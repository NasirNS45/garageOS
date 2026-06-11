import pytest
from httpx import AsyncClient

JOB_CARD_PAYLOAD = {
    "vehicle_number": "ABC-123",
    "customer_name": "Usman Ali",
    "customer_phone": "03331234567",
    "description": "Oil change + brake pads",
    "labour_charge": 1500,
    "parts_charge": 2500,
}


@pytest.mark.asyncio
async def test_create_job_card(client: AsyncClient, owner_headers: dict) -> None:
    resp = await client.post("/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["vehicle_number"] == "ABC-123"
    assert body["status"] == "pending"
    assert body["total_amount"] == 4000.0


@pytest.mark.asyncio
async def test_list_job_cards(client: AsyncClient, owner_headers: dict) -> None:
    await client.post("/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers)
    resp = await client.get("/api/v1/job-cards", headers=owner_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


@pytest.mark.asyncio
async def test_get_job_card(client: AsyncClient, owner_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/job-cards/{card_id}", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == card_id


@pytest.mark.asyncio
async def test_update_job_card_status(client: AsyncClient, owner_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/v1/job-cards/{card_id}",
        json={"status": "in_progress"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_complete_job_card(client: AsyncClient, owner_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create_resp.json()["id"]
    resp = await client.put(f"/api/v1/job-cards/{card_id}/complete", headers=owner_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["invoice_number"] is not None
    assert body["invoice_url"] is not None


@pytest.mark.asyncio
async def test_cancel_job_card(client: AsyncClient, owner_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/job-cards/{card_id}", headers=owner_headers)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_nonexistent_card(client: AsyncClient, owner_headers: dict) -> None:
    resp = await client.get("/api/v1/job-cards/nonexistent-id", headers=owner_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_multi_tenancy(client: AsyncClient) -> None:
    """Workshop A cannot see Workshop B's job cards."""
    # Workshop A
    resp_a = await client.post(
        "/api/v1/auth/signup",
        json={
            "mobile": "03001111111",
            "password": "passA1234",
            "full_name": "Owner A",
            "workshop_name": "Workshop A",
        },
    )
    headers_a = {"Authorization": f"Bearer {resp_a.json()['access_token']}"}

    # Workshop B
    resp_b = await client.post(
        "/api/v1/auth/signup",
        json={
            "mobile": "03002222222",
            "password": "passB1234",
            "full_name": "Owner B",
            "workshop_name": "Workshop B",
        },
    )
    headers_b = {"Authorization": f"Bearer {resp_b.json()['access_token']}"}

    # A creates a card
    create = await client.post("/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=headers_a)
    card_id = create.json()["id"]

    # B cannot see it
    resp = await client.get(f"/api/v1/job-cards/{card_id}", headers=headers_b)
    assert resp.status_code == 404

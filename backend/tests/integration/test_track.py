import pytest
from httpx import AsyncClient

JOB_CARD_PAYLOAD = {
    "vehicle_number": "TRK-001",
    "customer_name": "Track Test",
    "customer_phone": "03331239999",
    "description": "AC service",
    "labour_charge": 1000,
    "parts_charge": 0,
}


@pytest.mark.asyncio
async def test_job_card_response_has_track_url(
    client: AsyncClient, owner_headers: dict
) -> None:
    resp = await client.post("/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers)
    assert resp.status_code == 201
    body = resp.json()
    # Link now points at the public web base, still ending /track/{id}
    assert body["track_url"].endswith(f"/track/{body['id']}")


@pytest.mark.asyncio
async def test_public_track_endpoint(client: AsyncClient, owner_headers: dict) -> None:
    create = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create.json()["id"]

    # Public, no auth header
    resp = await client.get(f"/api/v1/public/track/{card_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["vehicle_number"] == "TRK-001"
    assert body["status"] == "pending"
    assert body["invoice_number"] is None


@pytest.mark.asyncio
async def test_public_track_unknown_id_404(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/public/track/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_public_invoice_endpoint(client: AsyncClient, owner_headers: dict) -> None:
    create = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create.json()["id"]
    complete = await client.put(
        f"/api/v1/job-cards/{card_id}/complete",
        json={"notify_customer": False},
        headers=owner_headers,
    )
    invoice_number = complete.json()["invoice_number"]
    assert invoice_number

    resp = await client.get(f"/api/v1/public/invoices/{invoice_number}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["invoice_number"] == invoice_number
    assert body["vehicle_number"] == "TRK-001"
    assert body["total_amount"] == 1000.0


@pytest.mark.asyncio
async def test_public_invoice_unknown_404(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/public/invoices/INV-NOPE-0000")
    assert resp.status_code == 404

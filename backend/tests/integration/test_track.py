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
    assert body["track_url"].endswith(f"/track/{body['id']}")


@pytest.mark.asyncio
async def test_track_page_renders_publicly(
    client: AsyncClient, owner_headers: dict
) -> None:
    create = await client.post(
        "/api/v1/job-cards", json=JOB_CARD_PAYLOAD, headers=owner_headers
    )
    card_id = create.json()["id"]

    # No auth header — public page
    resp = await client.get(f"/track/{card_id}")
    assert resp.status_code == 200
    assert "TRK-001" in resp.text
    assert "Vehicle received" in resp.text


@pytest.mark.asyncio
async def test_track_page_unknown_id_404(client: AsyncClient) -> None:
    resp = await client.get("/track/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404

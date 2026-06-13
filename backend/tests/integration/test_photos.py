import pytest
from httpx import AsyncClient

JOB = {
    "vehicle_number": "PIC-001",
    "customer_name": "Photo Customer",
    "customer_phone": "03334445555",
    "labour_charge": 500,
    "parts_charge": 0,
}


async def _make_card(client: AsyncClient, headers: dict) -> str:
    resp = await client.post("/api/v1/job-cards", json=JOB, headers=headers)
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_presign_returns_503_when_storage_unconfigured(
    client: AsyncClient, owner_headers: dict
) -> None:
    card_id = await _make_card(client, owner_headers)
    resp = await client.post(
        f"/api/v1/job-cards/{card_id}/photos/presign",
        json={"content_type": "image/jpeg"},
        headers=owner_headers,
    )
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_photo_record_crud(client: AsyncClient, owner_headers: dict) -> None:
    card_id = await _make_card(client, owner_headers)

    create = await client.post(
        f"/api/v1/job-cards/{card_id}/photos",
        json={
            "object_key": "workshops/w/jobs/j/abc.jpg",
            "public_url": "https://cdn.example.com/workshops/w/jobs/j/abc.jpg",
            "caption": "Before",
        },
        headers=owner_headers,
    )
    assert create.status_code == 201
    photo_id = create.json()["id"]
    assert create.json()["caption"] == "Before"

    listing = await client.get(
        f"/api/v1/job-cards/{card_id}/photos", headers=owner_headers
    )
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    delete = await client.delete(
        f"/api/v1/job-cards/{card_id}/photos/{photo_id}", headers=owner_headers
    )
    assert delete.status_code == 204

    after = await client.get(
        f"/api/v1/job-cards/{card_id}/photos", headers=owner_headers
    )
    assert after.json() == []


@pytest.mark.asyncio
async def test_photos_rejects_invalid_content_type(
    client: AsyncClient, owner_headers: dict
) -> None:
    card_id = await _make_card(client, owner_headers)
    resp = await client.post(
        f"/api/v1/job-cards/{card_id}/photos/presign",
        json={"content_type": "application/pdf"},
        headers=owner_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_customer_insights(client: AsyncClient, owner_headers: dict) -> None:
    card_id = await _make_card(client, owner_headers)
    await client.put(
        f"/api/v1/job-cards/{card_id}/complete",
        json={"notify_customer": False},
        headers=owner_headers,
    )
    resp = await client.get("/api/v1/customers/insights", headers=owner_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["customer_phone"] == "+923334445555"
    assert items[0]["total_jobs"] == 1
    assert items[0]["total_spent"] == 500.0

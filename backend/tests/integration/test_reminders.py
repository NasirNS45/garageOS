import pytest
from httpx import AsyncClient

JOB = {
    "vehicle_number": "REM-001",
    "customer_name": "Reminder Customer",
    "customer_phone": "03331112222",
    "description": "Oil change",
    "labour_charge": 1500,
    "parts_charge": 0,
}


async def _complete_a_job(client: AsyncClient, headers: dict) -> str:
    create = await client.post("/api/v1/job-cards", json=JOB, headers=headers)
    card_id = create.json()["id"]
    await client.put(
        f"/api/v1/job-cards/{card_id}/complete",
        json={"notify_customer": False},
        headers=headers,
    )
    return card_id


@pytest.mark.asyncio
async def test_no_reminder_when_interval_zero(
    client: AsyncClient, owner_headers: dict
) -> None:
    await _complete_a_job(client, owner_headers)
    resp = await client.get("/api/v1/reminders", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_reminder_created_on_completion(
    client: AsyncClient, owner_headers: dict
) -> None:
    upd = await client.put(
        "/api/v1/settings", json={"reminder_interval_days": 90}, headers=owner_headers
    )
    assert upd.status_code == 200
    assert upd.json()["reminder_interval_days"] == 90

    await _complete_a_job(client, owner_headers)

    resp = await client.get("/api/v1/reminders", headers=owner_headers)
    assert resp.status_code == 200
    reminders = resp.json()
    assert len(reminders) == 1
    assert reminders[0]["vehicle_number"] == "REM-001"
    assert reminders[0]["status"] == "pending"


@pytest.mark.asyncio
async def test_cancel_reminder(client: AsyncClient, owner_headers: dict) -> None:
    await client.put(
        "/api/v1/settings", json={"reminder_interval_days": 30}, headers=owner_headers
    )
    await _complete_a_job(client, owner_headers)
    reminders = (await client.get("/api/v1/reminders", headers=owner_headers)).json()
    rid = reminders[0]["id"]

    resp = await client.delete(f"/api/v1/reminders/{rid}", headers=owner_headers)
    assert resp.status_code == 204

    after = await client.get("/api/v1/reminders", headers=owner_headers)
    assert after.json() == []


@pytest.mark.asyncio
async def test_digest_toggle_persists(client: AsyncClient, owner_headers: dict) -> None:
    resp = await client.put(
        "/api/v1/settings", json={"digest_enabled": True}, headers=owner_headers
    )
    assert resp.status_code == 200
    assert resp.json()["digest_enabled"] is True

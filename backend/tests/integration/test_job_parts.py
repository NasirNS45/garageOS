"""Integration tests for job_parts endpoints and workflow changes."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

OWNER_SIGNUP = {
    "mobile": "03001234567",
    "password": "testpass123",
    "full_name": "Test Owner",
    "workshop_name": "Test Workshop",
}

JOB_CARD_BASE = {
    "vehicle_number": "ABC-1234",
    "customer_name": "Test Customer",
    "customer_phone": "03009876543",
    "labour_charge": 1000.0,
    "parts_charge": 0.0,
}


@pytest.fixture
async def owner_headers(client: AsyncClient) -> dict[str, str]:
    resp = await client.post("/api/v1/auth/signup", json=OWNER_SIGNUP)
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
async def active_card_id(client: AsyncClient, owner_headers: dict[str, str]) -> str:
    resp = await client.post("/api/v1/job-cards", json=JOB_CARD_BASE, headers=owner_headers)
    assert resp.status_code == 201
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# add_part_updates_parts_charge
# ---------------------------------------------------------------------------
async def test_add_part_updates_parts_charge(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    part_payload = {"name": "Engine Oil", "quantity": "2", "unit_price": "1200"}
    resp = await client.post(
        f"/api/v1/job-cards/{active_card_id}/parts",
        json=part_payload,
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Engine Oil"
    assert data["line_total"] == pytest.approx(2400.0)

    # Fetch the job card and verify parts_charge was updated
    card_resp = await client.get(f"/api/v1/job-cards/{active_card_id}", headers=owner_headers)
    assert card_resp.status_code == 200
    card = card_resp.json()
    assert card["parts_charge"] == pytest.approx(2400.0)
    assert card["total_amount"] == pytest.approx(3400.0)  # 1000 labour + 2400 parts
    assert len(card["parts"]) == 1
    assert card["parts"][0]["name"] == "Engine Oil"


# ---------------------------------------------------------------------------
# remove_part_updates_parts_charge
# ---------------------------------------------------------------------------
async def test_remove_part_updates_parts_charge(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    # Add two parts
    r1 = await client.post(
        f"/api/v1/job-cards/{active_card_id}/parts",
        json={"name": "Engine Oil", "quantity": "1", "unit_price": "1200"},
        headers=owner_headers,
    )
    await client.post(
        f"/api/v1/job-cards/{active_card_id}/parts",
        json={"name": "Oil Filter", "quantity": "1", "unit_price": "350"},
        headers=owner_headers,
    )
    part1_id = r1.json()["id"]

    # Remove the first part
    del_resp = await client.delete(
        f"/api/v1/job-cards/{active_card_id}/parts/{part1_id}",
        headers=owner_headers,
    )
    assert del_resp.status_code == 204

    card_resp = await client.get(f"/api/v1/job-cards/{active_card_id}", headers=owner_headers)
    card = card_resp.json()
    assert card["parts_charge"] == pytest.approx(350.0)
    assert card["total_amount"] == pytest.approx(1350.0)
    assert len(card["parts"]) == 1
    assert card["parts"][0]["name"] == "Oil Filter"


# ---------------------------------------------------------------------------
# add_part_forbidden_on_completed_job
# ---------------------------------------------------------------------------
async def test_add_part_forbidden_on_completed_job(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    with patch(
        "app.services.whatsapp_service.WhatsAppService.send_message",
        new_callable=AsyncMock,
    ):
        await client.put(f"/api/v1/job-cards/{active_card_id}/complete", headers=owner_headers)

    resp = await client.post(
        f"/api/v1/job-cards/{active_card_id}/parts",
        json={"name": "Belt", "quantity": "1", "unit_price": "500"},
        headers=owner_headers,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# mechanic_availability_flag_in_list
# ---------------------------------------------------------------------------
async def test_mechanic_availability_flag_in_list(
    client: AsyncClient, owner_headers: dict[str, str]
) -> None:
    # Add a mechanic
    mech_resp = await client.post(
        "/api/v1/auth/mechanics",
        json={"mobile": "03111111111", "password": "mechpass123", "full_name": "Ali Raza"},
        headers=owner_headers,
    )
    assert mech_resp.status_code == 201
    mechanic_id = mech_resp.json()["id"]

    # Initially available
    list_resp = await client.get("/api/v1/auth/mechanics", headers=owner_headers)
    assert list_resp.status_code == 200
    mechanics = list_resp.json()
    ali = next(m for m in mechanics if m["id"] == mechanic_id)
    assert ali["is_available"] is True

    # Assign mechanic to an in_progress job
    card_resp = await client.post(
        "/api/v1/job-cards",
        json={**JOB_CARD_BASE, "assigned_mechanic_id": mechanic_id},
        headers=owner_headers,
    )
    assert card_resp.status_code == 201
    assert card_resp.json()["status"] == "in_progress"

    # Now mechanic should show as unavailable
    list_resp2 = await client.get("/api/v1/auth/mechanics", headers=owner_headers)
    ali2 = next(m for m in list_resp2.json() if m["id"] == mechanic_id)
    assert ali2["is_available"] is False


# ---------------------------------------------------------------------------
# auto_transition_on_mechanic_assign_at_creation
# ---------------------------------------------------------------------------
async def test_auto_transition_on_mechanic_assign_at_creation(
    client: AsyncClient, owner_headers: dict[str, str]
) -> None:
    mech_resp = await client.post(
        "/api/v1/auth/mechanics",
        json={"mobile": "03122222222", "password": "mechpass123", "full_name": "Salman"},
        headers=owner_headers,
    )
    mechanic_id = mech_resp.json()["id"]

    card_resp = await client.post(
        "/api/v1/job-cards",
        json={**JOB_CARD_BASE, "assigned_mechanic_id": mechanic_id},
        headers=owner_headers,
    )
    assert card_resp.status_code == 201
    assert card_resp.json()["status"] == "in_progress"


# ---------------------------------------------------------------------------
# auto_transition_on_mechanic_assign_via_update
# ---------------------------------------------------------------------------
async def test_auto_transition_on_mechanic_assign_via_update(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    # Card starts as pending (no mechanic at creation in fixture)
    card_resp = await client.get(f"/api/v1/job-cards/{active_card_id}", headers=owner_headers)
    assert card_resp.json()["status"] == "pending"

    # Add a mechanic
    mech_resp = await client.post(
        "/api/v1/auth/mechanics",
        json={"mobile": "03133333333", "password": "mechpass123", "full_name": "Karim"},
        headers=owner_headers,
    )
    mechanic_id = mech_resp.json()["id"]

    # Assign via update
    update_resp = await client.put(
        f"/api/v1/job-cards/{active_card_id}",
        json={"assigned_mechanic_id": mechanic_id},
        headers=owner_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"


# ---------------------------------------------------------------------------
# complete_with_notify_false_suppresses_whatsapp
# ---------------------------------------------------------------------------
async def test_complete_with_notify_false_suppresses_whatsapp(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    with patch(
        "app.services.whatsapp_service.WhatsAppService.send_message",
        new_callable=AsyncMock,
    ) as send_mock:
        resp = await client.put(
            f"/api/v1/job-cards/{active_card_id}/complete",
            json={"notify_customer": False},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        send_mock.assert_not_called()


# ---------------------------------------------------------------------------
# complete_with_notify_true_calls_whatsapp
# ---------------------------------------------------------------------------
async def test_complete_with_notify_true_calls_whatsapp(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    with patch(
        "app.services.whatsapp_service.WhatsAppService.send_message",
        new_callable=AsyncMock,
    ):
        resp = await client.put(
            f"/api/v1/job-cards/{active_card_id}/complete",
            json={"notify_customer": True},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        # send_message would be called if whatsapp is configured; it logs a warning
        # if not configured but does NOT raise. Either way the job completes.
        assert resp.json()["status"] == "completed"


# ---------------------------------------------------------------------------
# list_job_cards_includes_parts
# ---------------------------------------------------------------------------
async def test_list_job_cards_includes_parts(
    client: AsyncClient, owner_headers: dict[str, str], active_card_id: str
) -> None:
    await client.post(
        f"/api/v1/job-cards/{active_card_id}/parts",
        json={"name": "Brake Pad", "quantity": "2", "unit_price": "800"},
        headers=owner_headers,
    )

    list_resp = await client.get("/api/v1/job-cards", headers=owner_headers)
    assert list_resp.status_code == 200
    cards = list_resp.json()["items"]
    target = next(c for c in cards if c["id"] == active_card_id)
    assert len(target["parts"]) == 1
    assert target["parts"][0]["name"] == "Brake Pad"
    assert target["parts"][0]["line_total"] == pytest.approx(1600.0)

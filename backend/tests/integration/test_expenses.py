from datetime import date, timedelta

import pytest
from httpx import AsyncClient

TODAY = date.today().isoformat()

EXPENSE_PAYLOAD = {
    "expense_date": TODAY,
    "category": "parts_purchase",
    "amount": 2500,
    "note": "Brake pads stock",
}


@pytest.mark.asyncio
async def test_create_expense(client: AsyncClient, owner_headers: dict) -> None:
    resp = await client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD, headers=owner_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 2500.0
    assert body["category"] == "parts_purchase"
    assert body["expense_date"] == TODAY


@pytest.mark.asyncio
async def test_create_expense_rejects_invalid(
    client: AsyncClient, owner_headers: dict
) -> None:
    bad = {**EXPENSE_PAYLOAD, "amount": -5}
    resp = await client.post("/api/v1/expenses", json=bad, headers=owner_headers)
    assert resp.status_code == 422

    bad_cat = {**EXPENSE_PAYLOAD, "category": "chai"}
    resp = await client.post("/api/v1/expenses", json=bad_cat, headers=owner_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_expenses_with_totals(client: AsyncClient, owner_headers: dict) -> None:
    await client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD, headers=owner_headers)
    await client.post(
        "/api/v1/expenses",
        json={**EXPENSE_PAYLOAD, "amount": 500, "category": "utilities"},
        headers=owner_headers,
    )
    resp = await client.get(
        f"/api/v1/expenses?start_date={TODAY}&end_date={TODAY}", headers=owner_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["total_amount"] == 3000.0


@pytest.mark.asyncio
async def test_delete_expense(client: AsyncClient, owner_headers: dict) -> None:
    create = await client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD, headers=owner_headers)
    expense_id = create.json()["id"]
    resp = await client.delete(f"/api/v1/expenses/{expense_id}", headers=owner_headers)
    assert resp.status_code == 204

    resp = await client.get(
        f"/api/v1/expenses?start_date={TODAY}&end_date={TODAY}", headers=owner_headers
    )
    assert resp.json()["total"] == 0


@pytest.mark.asyncio
async def test_delete_unknown_expense_404(client: AsyncClient, owner_headers: dict) -> None:
    resp = await client.delete("/api/v1/expenses/does-not-exist", headers=owner_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_daily_series_includes_expenses(
    client: AsyncClient, owner_headers: dict
) -> None:
    await client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD, headers=owner_headers)
    start = (date.today() - timedelta(days=2)).isoformat()
    resp = await client.get(
        f"/api/v1/summary/daily-series?start_date={start}&end_date={TODAY}",
        headers=owner_headers,
    )
    assert resp.status_code == 200
    points = resp.json()
    assert len(points) == 3  # one point per day, zero-filled
    today_point = points[-1]
    assert today_point["date"] == TODAY
    assert today_point["expenses"] == 2500.0
    assert today_point["revenue"] == 0.0


@pytest.mark.asyncio
async def test_daily_series_rejects_huge_range(
    client: AsyncClient, owner_headers: dict
) -> None:
    start = (date.today() - timedelta(days=200)).isoformat()
    resp = await client.get(
        f"/api/v1/summary/daily-series?start_date={start}&end_date={TODAY}",
        headers=owner_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_range_summary_has_net_profit(
    client: AsyncClient, owner_headers: dict
) -> None:
    await client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD, headers=owner_headers)
    resp = await client.get(
        f"/api/v1/summary/range?start_date={TODAY}&end_date={TODAY}",
        headers=owner_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_expenses"] == 2500.0
    assert body["net_profit"] == body["total_revenue"] - 2500.0

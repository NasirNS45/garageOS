import pytest
from httpx import AsyncClient

SIGNUP_PAYLOAD = {
    "mobile": "03001234567",
    "password": "password123",
    "full_name": "Ali Khan",
    "workshop_name": "Ali Motors",
    "workshop_address": "Karachi",
}


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_signup_duplicate_mobile(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    resp = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"mobile": "03001234567", "password": "password123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"mobile": "03001234567", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_mobile(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/login",
        json={"mobile": "03009999999", "password": "anything"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_no_token(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/job-cards")
    assert resp.status_code == 401

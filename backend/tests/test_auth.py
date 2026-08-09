"""
Regression tests for the authentication system (Phase Authentication).
"""


def test_register_creates_account(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepass123", "full_name": "Test User"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["email"] == "test@example.com"
    assert "access_token" in body


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "password": "securepass123"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 400


def test_login_with_correct_credentials_succeeds(client):
    client.post(
        "/api/v1/auth/register", json={"email": "login@example.com", "password": "securepass123"}
    )
    r = client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "securepass123"}
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register", json={"email": "wrongpw@example.com", "password": "securepass123"}
    )
    r = client.post(
        "/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "not-the-password"}
    )
    assert r.status_code == 401


def test_protected_route_requires_token(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_protected_route_succeeds_with_valid_token(client):
    reg = client.post(
        "/api/v1/auth/register", json={"email": "me@example.com", "password": "securepass123"}
    )
    token = reg.json()["access_token"]
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"

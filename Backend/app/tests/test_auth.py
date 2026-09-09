"""
Tests for the User Management / Authentication module (Milestone 1 scope).
Covers: registration, login (happy + failure paths), /auth/me, and
role-based access control.
"""
from .conftest import register_user, login_user, auth_headers


def test_health_check(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "running" in resp.json()["message"].lower()


def test_register_new_user_succeeds(client):
    resp = register_user(client)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "admin@example.com"
    assert body["role"] == "admin"
    assert "password" not in body  # password hash must never be returned


def test_register_duplicate_email_fails(client):
    register_user(client)
    resp = register_user(client)  # same email again
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_login_with_correct_credentials_returns_token(client):
    register_user(client)
    resp = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == "admin"
    assert body["access_token"]


def test_login_with_wrong_password_fails(client):
    register_user(client)
    resp = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


def test_login_with_unknown_email_fails(client):
    resp = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert resp.status_code == 401


def test_me_requires_valid_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401  # no Authorization header


def test_me_returns_current_user(client):
    register_user(client)
    token = login_user(client)
    resp = client.get("/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@example.com"


def test_admin_route_rejects_non_admin_role(client):
    register_user(client, email="commuter@example.com", role="commuter")
    token = login_user(client, email="commuter@example.com")
    resp = client.get("/auth/admin", headers=auth_headers(token))
    assert resp.status_code == 403


def test_admin_route_allows_admin_role(client):
    register_user(client, email="admin2@example.com", role="admin")
    token = login_user(client, email="admin2@example.com")
    resp = client.get("/auth/admin", headers=auth_headers(token))
    assert resp.status_code == 200
    assert "Welcome Admin" in resp.json()["message"]

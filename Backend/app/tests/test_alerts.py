"""
Tests for the Alert & Notification module (Milestone 3 scope).
"""
from .conftest import register_user, login_user, auth_headers


def _logged_in(client, email="commuter@example.com", role="commuter"):
    register_user(client, email=email, role=role)
    return login_user(client, email=email)


def test_create_alert_requires_auth(client):
    resp = client.post(
        "/alerts/",
        json={
            "alert_type": "Accident",
            "description": "Two-car collision",
            "location": "NH-16",
        },
    )
    assert resp.status_code == 401


def test_create_and_list_alert(client):
    token = _logged_in(client)
    create_resp = client.post(
        "/alerts/",
        json={
            "alert_type": "Accident",
            "description": "Two-car collision",
            "location": "NH-16",
            "severity": "High",
        },
        headers=auth_headers(token),
    )
    assert create_resp.status_code == 200, create_resp.text
    body = create_resp.json()
    assert body["status"] == "Active"
    assert body["severity"] == "High"

    list_resp = client.get("/alerts/", headers=auth_headers(token))
    assert list_resp.status_code == 200
    assert any(a["description"] == "Two-car collision" for a in list_resp.json())

"""
Tests for the Traffic Monitoring module (Milestone 1 scope).
Covers: ingesting traffic data (operator-only), reading live traffic,
and per-road history, plus the congestion-level calculation.
"""
from app.routers.traffic import calculate_congestion
from .conftest import register_user, login_user, auth_headers


def test_calculate_congestion_low():
    assert calculate_congestion(vehicle_count=50, average_speed=45) == "Low"


def test_calculate_congestion_high():
    assert calculate_congestion(vehicle_count=250, average_speed=10) == "High"


def _operator_token(client, email="operator@example.com"):
    register_user(client, email=email, role="operator")
    return login_user(client, email=email)


def test_commuter_cannot_ingest_traffic(client):
    register_user(client, email="commuter@example.com", role="commuter")
    token = login_user(client, email="commuter@example.com")
    resp = client.post(
        "/traffic/ingest",
        json={"road_name": "MG Road", "vehicle_count": 120, "average_speed": 25},
        headers=auth_headers(token),
    )
    assert resp.status_code == 403


def test_operator_can_ingest_traffic(client):
    token = _operator_token(client)
    resp = client.post(
        "/traffic/ingest",
        json={"road_name": "MG Road", "vehicle_count": 120, "average_speed": 25},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["road_name"] == "MG Road"
    assert body["congestion_level"] in ("Low", "Medium", "High")


def test_live_traffic_returns_latest_per_road(client):
    token = _operator_token(client)
    client.post(
        "/traffic/ingest",
        json={"road_name": "Ring Road", "vehicle_count": 80, "average_speed": 40},
        headers=auth_headers(token),
    )
    client.post(
        "/traffic/ingest",
        json={"road_name": "Ring Road", "vehicle_count": 200, "average_speed": 12},
        headers=auth_headers(token),
    )
    resp = client.get("/traffic/live", headers=auth_headers(token))
    assert resp.status_code == 200
    roads = [row["road_name"] for row in resp.json()]
    assert roads.count("Ring Road") == 1  # only the latest reading per road


def test_road_history_returns_records_for_that_road(client):
    token = _operator_token(client)
    client.post(
        "/traffic/ingest",
        json={"road_name": "Outer Ring Road", "vehicle_count": 90, "average_speed": 35},
        headers=auth_headers(token),
    )
    resp = client.get("/traffic/history/Outer Ring Road", headers=auth_headers(token))
    assert resp.status_code == 200
    assert all(row["road_name"] == "Outer Ring Road" for row in resp.json())

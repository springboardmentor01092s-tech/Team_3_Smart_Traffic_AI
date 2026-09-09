"""
Shared pytest fixtures for the TrafficVision AI backend test suite.

Each test run uses a fresh, throwaway SQLite file (test_users.db) so
tests never touch the real users.db used by the running application,
and every test starts from a clean database.
"""
import os
import sys

# Make sure the "app" package is importable when running `pytest` from Backend/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Point the app at a dedicated test database BEFORE importing app.main,
# since app.database reads DATABASE_URL at import time.
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_users.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine


@pytest.fixture(scope="function", autouse=True)
def fresh_database():
    """Recreate all tables before every test for isolation."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """A FastAPI TestClient wired to the app with the test database."""
    with TestClient(app) as c:
        yield c


def register_user(client, email="admin@example.com", password="Password123!",
                   username="Admin User", role="admin"):
    """Helper: registers a user and returns the response."""
    return client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "role": role,
        },
    )


def login_user(client, email="admin@example.com", password="Password123!"):
    """Helper: logs in and returns the access token string."""
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}

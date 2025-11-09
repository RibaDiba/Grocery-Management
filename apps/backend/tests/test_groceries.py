import pytest
from fastapi.testclient import TestClient
from mongomock import MongoClient
from server import app
import database as db_mod


TEST_EMAIL = "tester@example.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="function")
def client():
    # Set up isolated in-memory Mongo using mongomock
    mock_client = MongoClient()
    mock_db = mock_client["test_db"]

    # Monkeypatch database collection getters to use mock db
    db_mod.get_user_collection = lambda: mock_db["users"]
    db_mod.get_groceries_collection = lambda: mock_db["groceries"]

    with TestClient(app) as c:
        yield c


def auth_headers(client: TestClient):
    # Register user (ignore if already)
    client.post("/api/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    # Login to obtain token
    resp = client.post("/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_delete_decrement_by_parameter(client):
    headers = auth_headers(client)

    # Add same grocery three times -> count=3
    gid = client.post("/api/groceries/", json={"name": "Milk"}, headers=headers).json()["id"]
    client.post("/api/groceries/", json={"name": "Milk"}, headers=headers)
    third = client.post("/api/groceries/", json={"name": "Milk"}, headers=headers)
    assert third.json()["count"] == 3

    # Decrement by 2 -> remaining count should be 1
    resp = client.delete(f"/api/groceries/{gid}?by=2", headers=headers)
    assert resp.status_code == 204
    items = client.get("/api/groceries/", headers=headers).json()
    assert items[0]["count"] == 1

    # Decrement by >= remaining (by=5) -> document removed
    resp2 = client.delete(f"/api/groceries/{gid}?by=5", headers=headers)
    assert resp2.status_code == 204
    items_after = client.get("/api/groceries/", headers=headers).json()
    assert items_after == []


def test_delete_invalid_by(client):
    headers = auth_headers(client)
    gid = client.post("/api/groceries/", json={"name": "Egg"}, headers=headers).json()["id"]
    bad = client.delete(f"/api/groceries/{gid}?by=0", headers=headers)
    assert bad.status_code == 400
    assert bad.json()["detail"] == "'by' must be a positive integer"


def test_delete_removes_when_count_one(client):
    headers = auth_headers(client)
    r = client.post("/api/groceries/", json={"name": "Apple"}, headers=headers)
    assert r.status_code == 201
    gid = r.json()["id"]
    assert r.json()["count"] == 1

    del_resp = client.delete(f"/api/groceries/{gid}", headers=headers)
    assert del_resp.status_code == 204

    # List should be empty
    list_resp = client.get("/api/groceries/", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json() == []


def test_delete_not_found(client):
    headers = auth_headers(client)
    # Use a random ObjectId that does not exist
    fake_id = "64c9f8c2c2a1a9b5e4d1f9aa"
    resp = client.delete(f"/api/groceries/{fake_id}", headers=headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Grocery not found"


def test_delete_invalid_id(client):
    headers = auth_headers(client)
    resp = client.delete("/api/groceries/not-an-object-id", headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid grocery id"

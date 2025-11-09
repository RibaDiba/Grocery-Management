import pytest
from fastapi.testclient import TestClient
from mongomock import MongoClient
from server import app
import database as db_mod


EMAIL_1 = "user1@example.com"
EMAIL_2 = "user2@example.com"
PASSWORD = "secretpw"


@pytest.fixture(scope="function")
def client():
    mock_client = MongoClient()
    mock_db = mock_client["test_db"]
    db_mod.get_user_collection = lambda: mock_db["users"]
    db_mod.get_recipes_collection = lambda: mock_db["recipes"]
    with TestClient(app) as c:
        yield c


def auth_headers(client: TestClient, email: str):
    client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    resp = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_recipes_isolated(client):
    h1 = auth_headers(client, EMAIL_1)
    h2 = auth_headers(client, EMAIL_2)

    # User1 creates two recipes
    r1 = client.post("/api/recipes/", json={
        "title": "Milk Toast", "ingredients": ["Milk", "Bread"], "steps": ["Toast bread", "Pour milk"], "estimated_minutes": 5
    }, headers=h1)
    assert r1.status_code == 201
    r2 = client.post("/api/recipes/", json={
        "title": "Apple Snack", "ingredients": ["Apple"], "steps": ["Slice apple"], "estimated_minutes": 2
    }, headers=h1)
    assert r2.status_code == 201

    # User2 creates one recipe
    r3 = client.post("/api/recipes/", json={
        "title": "Tea", "ingredients": ["Tea Bag", "Water"], "steps": ["Boil water", "Steep"], "estimated_minutes": 4
    }, headers=h2)
    assert r3.status_code == 201

    list1 = client.get("/api/recipes/", headers=h1)
    list2 = client.get("/api/recipes/", headers=h2)
    assert list1.status_code == 200 and list2.status_code == 200
    data1 = list1.json(); data2 = list2.json()
    assert len(data1) == 2
    assert len(data2) == 1
    # Ensure isolation
    ids1 = {d["id"] for d in data1}
    ids2 = {d["id"] for d in data2}
    assert ids1.isdisjoint(ids2)


def test_get_update_delete_recipe(client):
    headers = auth_headers(client, EMAIL_1)
    create = client.post("/api/recipes/", json={
        "title": "Porridge", "ingredients": ["Oats", "Milk"], "steps": ["Combine", "Heat"], "estimated_minutes": 10
    }, headers=headers)
    assert create.status_code == 201
    rid = create.json()["id"]

    # Get
    get_resp = client.get(f"/api/recipes/{rid}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Porridge"

    # Update title
    upd = client.patch(f"/api/recipes/{rid}", json={"title": "Creamy Porridge"}, headers=headers)
    assert upd.status_code == 200
    assert upd.json()["title"] == "Creamy Porridge"

    # Delete
    del_resp = client.delete(f"/api/recipes/{rid}", headers=headers)
    assert del_resp.status_code == 204

    # Ensure gone
    missing = client.get(f"/api/recipes/{rid}", headers=headers)
    assert missing.status_code == 404


def test_recipe_not_found_cases(client):
    headers = auth_headers(client, EMAIL_1)
    fake_id = "64c9f8c2c2a1a9b5e4d1f9aa"
    assert client.get(f"/api/recipes/{fake_id}", headers=headers).status_code == 404
    assert client.patch(f"/api/recipes/{fake_id}", json={"title": "X"}, headers=headers).status_code == 404
    assert client.delete(f"/api/recipes/{fake_id}", headers=headers).status_code == 404

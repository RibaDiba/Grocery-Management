
import pytest
from fastapi.testclient import TestClient
from mongomock import MongoClient
from server import app
from database import get_db
from auth_routes import router as auth_router
from receipts import router as receipts_router
from models import User

@pytest.fixture
def client():
    from auth_routes import router as auth_router
    from receipts import router as receipts_router
    # Create a mock MongoDB client
    mock_client = MongoClient()
    mock_db = mock_client["test_db"]

    # Override the get_db dependency
    def get_mock_db():
        return mock_db

    app.dependency_overrides[get_db] = get_mock_db
    # Ensure all code paths use the mock receipts collection
    import database as _db_mod
    _db_mod.get_receipts_collection = lambda: mock_db["receipts"]
    app.include_router(auth_router)
    app.include_router(receipts_router)
    
    with TestClient(app) as client:
        yield client

    app.dependency_overrides = {}


@pytest.fixture(autouse=True)
def run_before_and_after_tests(client):
    """Fixture to clear the mock database before and after each test."""
    db = client.app.dependency_overrides[get_db]()
    db.users.delete_many({})
    db.receipts.delete_many({})
    yield
    db.users.delete_many({})
    db.receipts.delete_many({})

def get_auth_headers(client, username="testuser"):
    # Register user
    client.post(
        "/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "password"},
    )
    # Login user
    response = client.post(
        "/auth/login",
        data={"username": username, "password": "password"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_receipts_empty(client):
    headers = get_auth_headers(client)
    response = client.get("/api/receipts/", headers=headers)
    assert response.status_code == 200
    assert response.json() == []

def test_list_receipts_with_data(client):
    headers = get_auth_headers(client)
    
    # Need to get the user id from the token
    from jose import jwt
    from config import config
    token = headers["Authorization"].split(" ")[1]
    payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    user_id = payload["sub"]


    # Use the mocked receipts collection
    import database as _db_mod
    receipts_col = _db_mod.get_receipts_collection()
    receipts_col.insert_one({
        "user_id": user_id,
        "file_path": "/path/to/receipt1.jpg",
        "raw_text": "some text",
        "grocery_items": ["item1", "item2"]
    })
    receipts_col.insert_one({
        "user_id": "another_user",
        "file_path": "/path/to/receipt2.jpg",
        "raw_text": "some other text",
        "grocery_items": ["item3", "item4"]
    })

    response = client.get("/api/receipts/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == user_id
    assert data[0]["file_path"] == "/path/to/receipt1.jpg"

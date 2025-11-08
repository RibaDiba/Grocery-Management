import pytest
from fastapi.testclient import TestClient
from mongomock import MongoClient
from server import app
from database import get_db
from auth_routes import router as auth_router

@pytest.fixture
def client():
    # Create a mock MongoDB client
    mock_client = MongoClient()
    mock_db = mock_client["test_db"]

    # Override the get_db dependency
    def get_mock_db():
        return mock_db

    app.dependency_overrides[get_db] = get_mock_db
    app.include_router(auth_router)
    
    with TestClient(app) as client:
        yield client

    app.dependency_overrides = {}


@pytest.fixture(autouse=True)
def run_before_and_after_tests(client):
    """Fixture to clear the mock database before and after each test."""
    db = client.app.dependency_overrides[get_db]()
    db.users.delete_many({})
    yield
    db.users.delete_many({})

def test_register_user_success(client):
    response = client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert response.json()["email"] == "test@example.com"

def test_register_user_duplicate_username(client):
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password"},
    )
    response = client.post(
        "/auth/register",
        json={"username": "testuser", "email": "another@example.com", "password": "password"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already registered"

def test_register_user_duplicate_email(client):
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password"},
    )
    response = client.post(
        "/auth/register",
        json={"username": "anotheruser", "email": "test@example.com", "password": "password"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password"},
    )
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "password"},
    )
    assert response.status_code == 200
    json_response = response.json()
    assert "access_token" in json_response
    assert json_response["token_type"] == "bearer"

def test_login_incorrect_password(client):
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password"},
    )
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_login_nonexistent_username(client):
    response = client.post(
        "/auth/login",
        data={"username": "nonexistentuser", "password": "password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_register_user_long_password(client):
    long_password = "a" * 72
    response = client.post(
        "/auth/register",
        json={"username": "longpassworduser", "email": "long@example.com", "password": long_password},
    )
    assert response.status_code == 200
    
    # Now try to login with the long password
    response = client.post(
        "/auth/login",
        data={"username": "longpassworduser", "password": long_password},
    )
    assert response.status_code == 200
    json_response = response.json()
    assert "access_token" in json_response
    assert json_response["token_type"] == "bearer"

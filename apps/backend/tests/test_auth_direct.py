import pytest
from mongomock import MongoClient
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from models import User
from jose import jwt
from config import config
from fastapi import HTTPException

def test_password_hashing():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert hashed_password != password
    assert verify_password(password, hashed_password)

def test_long_password_hashing():
    password = "a" * 100
    hashed_password = get_password_hash(password)
    assert hashed_password != password
    assert verify_password(password, hashed_password)

def test_create_access_token():
    data = {"sub": "testuser"}
    token = create_access_token(data)
    decoded_token = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    assert decoded_token["sub"] == "testuser"

@pytest.mark.asyncio
async def test_get_current_user():
    mock_users_collection = MongoClient().db.users
    username = "testuser"
    user_data = {"username": username, "email": "test@example.com", "password": "password"}
    mock_users_collection.insert_one(User(**user_data).dict())

    token = create_access_token(data={"sub": username})

    async def mock_get_user_collection():
        return mock_users_collection

    user = await get_current_user(token=token, users_collection=mock_get_user_collection())
    assert user.username == username

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(token="invalidtoken")
    assert excinfo.value.status_code == 401

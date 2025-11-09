from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator

from config import config
from database import get_user_collection


router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    users = get_user_collection()
    # Enforce unique email and username
    if users.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if users.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed = get_password_hash(req.password)
    user_doc = {
        "username": req.username,
        "email": req.email,
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
    }
    users.insert_one(user_doc)
    return {"message": "User registered"}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    users = get_user_collection()
    user = users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": str(user.get("_id")),
        "email": user["email"],
        "username": user.get("username", "")
    })
    return TokenResponse(access_token=token)


class User(BaseModel):
    id: str
    email: EmailStr
    username: str


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Decode JWT and fetch the current user; raises 401 if invalid."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = str(payload.get("sub"))
        email = payload.get("email")
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    users = get_user_collection()
    user = users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return User(id=str(user.get("_id")), email=email, username=user.get("username", ""))
    
@router.get("/me", response_model=User)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""
    return current_user


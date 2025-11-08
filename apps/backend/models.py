from typing import List
from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserInDB(User):
    hashed_password: str

class Receipt(BaseModel):
    user_id: str
    file_path: str
    raw_text: str
    grocery_items: List[str] = []

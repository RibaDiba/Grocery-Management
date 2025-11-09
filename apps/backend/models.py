from typing import List, Optional
from datetime import datetime, timezone
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


class Recipe(BaseModel):
    id: Optional[str] = Field(None, description="MongoDB ObjectId as string")
    user_id: str = Field(..., description="Owner user's id")
    title: str = Field(..., min_length=1, max_length=120)
    ingredients: List[str] = Field(default_factory=list, description="Flat list of ingredient names")
    steps: List[str] = Field(default_factory=list, description="Ordered preparation steps")
    estimated_minutes: int = Field(default=20, ge=1, description="Estimated time to prepare")
    source: Optional[str] = Field(None, description="Source of recipe: manual|generated|imported")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

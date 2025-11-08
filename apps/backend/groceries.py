"""Groceries endpoints backed by a dedicated Mongo collection.

Each grocery item doc (in `groceries` collection) has:
  user_id: ObjectId of owning user
  name: string
  perish_min_days: int | null (minimum days before perishing)
  perish_max_days: int | null (maximum days before perishing)
  created_at: datetime (UTC)

The perishing range lets clients calculate estimated expiration windows.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from bson import ObjectId

from auth import get_current_user, User
from database import get_groceries_collection, get_user_collection


router = APIRouter(prefix="/api/groceries", tags=["groceries"])


from pydantic import BaseModel, Field, field_validator

class GroceryCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the grocery item")
    min_days: Optional[int] = Field(None, ge=0, description="Minimum days before item perishes")
    max_days: Optional[int] = Field(None, ge=0, description="Maximum days before item perishes")

    @field_validator("max_days")
    def validate_range(cls, v, values):
        min_v = values.data.get("min_days")
        if v is not None and min_v is not None and v < min_v:
            raise ValueError("max_days cannot be less than min_days")
        return v


class GroceryItem(BaseModel):
    id: str
    name: str
    min_days: Optional[int]
    max_days: Optional[int]
    created_at: datetime


def _object_id(user: User) -> ObjectId:
    try:
        return ObjectId(user.id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")


@router.get("/", response_model=list[GroceryItem])
def list_groceries(current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    cursor = col.find({"user_id": _object_id(current_user)})
    items: list[GroceryItem] = []
    for doc in cursor:
        items.append(GroceryItem(
            id=str(doc.get("_id")),
            name=doc.get("name", ""),
            min_days=doc.get("min_days"),
            max_days=doc.get("max_days"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
        ))
    return items


@router.post("/", response_model=GroceryItem, status_code=201)
def add_grocery(body: GroceryCreate, current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    user_id = _object_id(current_user)
    doc = {
        "user_id": user_id,
        "name": body.name,
        "min_days": body.min_days,
        "max_days": body.max_days,
        "created_at": datetime.now(timezone.utc),
    }
    inserted = col.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return GroceryItem(
        id=str(doc["_id"]),
        name=doc["name"],
        min_days=doc["min_days"],
        max_days=doc["max_days"],
        created_at=doc["created_at"],
    )


@router.delete("/{grocery_id}", status_code=204)
def delete_grocery(grocery_id: str, current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    user_oid = _object_id(current_user)
    try:
        target_oid = ObjectId(grocery_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid grocery id")

    result = col.delete_one({"_id": target_oid, "user_id": user_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Grocery not found")
    return None


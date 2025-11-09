from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List, Optional
from auth import get_current_user, User
from database import get_recipes_collection
from models import Recipe
from pydantic import BaseModel, Field
from datetime import datetime, timezone

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


class RecipeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    ingredients: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    estimated_minutes: int = Field(default=20, ge=1)
    source: Optional[str] = Field("manual")


class RecipeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    ingredients: Optional[List[str]] = None
    steps: Optional[List[str]] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)
    source: Optional[str] = None


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipe id")


@router.get("/", response_model=List[Recipe])
def list_recipes(current_user: User = Depends(get_current_user)):
    col = get_recipes_collection()
    cursor = col.find({"user_id": current_user.id}).sort("created_at", -1)
    out: List[Recipe] = []
    for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        out.append(Recipe(**doc))
    return out


@router.post("/", response_model=Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(body: RecipeCreate, current_user: User = Depends(get_current_user)):
    col = get_recipes_collection()
    doc = {
        "user_id": current_user.id,
        "title": body.title,
        "ingredients": body.ingredients,
        "steps": body.steps,
        "estimated_minutes": body.estimated_minutes,
        "source": body.source or "manual",
        "created_at": datetime.now(timezone.utc),
    }
    inserted = col.insert_one(doc)
    doc["id"] = str(inserted.inserted_id)
    doc["_id"] = inserted.inserted_id
    return Recipe(**doc)


@router.get("/{recipe_id}", response_model=Recipe)
def get_recipe(recipe_id: str, current_user: User = Depends(get_current_user)):
    col = get_recipes_collection()
    rec = col.find_one({"_id": _oid(recipe_id), "user_id": current_user.id})
    if not rec:
        raise HTTPException(status_code=404, detail="Recipe not found")
    rec["id"] = str(rec.get("_id"))
    return Recipe(**rec)


@router.patch("/{recipe_id}", response_model=Recipe)
def update_recipe(recipe_id: str, body: RecipeUpdate, current_user: User = Depends(get_current_user)):
    col = get_recipes_collection()
    update_fields = {}
    for k, v in body.model_dump().items():
        if v is not None:
            update_fields[k] = v
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = col.find_one_and_update(
        {"_id": _oid(recipe_id), "user_id": current_user.id},
        {"$set": update_fields},
        return_document=True,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Recipe not found")
    res["id"] = str(res.get("_id"))
    return Recipe(**res)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: str, current_user: User = Depends(get_current_user)):
    col = get_recipes_collection()
    result = col.delete_one({"_id": _oid(recipe_id), "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return None

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
import random
from math import ceil

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from bson import ObjectId

from auth import get_current_user, User
from database import get_groceries_collection, get_user_collection
from config import config

try:
    import google.generativeai as genai
except Exception:
    genai = None


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
    count: int = Field(default=1, ge=1)


class Recipe(BaseModel):
    title: str
    ingredients_used: list[str]
    steps: list[str]
    estimated_minutes: int = Field(default=20, ge=1)


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
            count=int(doc.get("count", 1)),
        ))
    return items



@router.get("/recipe", response_model=Recipe)
def generate_recipe(current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    cursor = col.find({"user_id": _object_id(current_user)})
    names = [doc.get("name", "").strip() for doc in cursor if doc.get("name")]
    seen = set()
    ingredients = []
    for n in names:
        key = n.lower()
        if key and key not in seen:
            seen.add(key)
            ingredients.append(n)

    if not ingredients:
        raise HTTPException(status_code=400, detail="No groceries found for user")
    if config.GEMINI_API_KEY and genai is not None:
        try:
            genai.configure(api_key=config.GEMINI_API_KEY)
            model = genai.GenerativeModel(config.LLM_MODEL)
            generation_config = genai.types.GenerationConfig(
                temperature=float(config.LLM_TEMPERATURE),
                max_output_tokens=int(config.LLM_MAX_TOKENS),
            )
            parts: list[str] = []
            parts.append("SYSTEM_ROLE:\n")
            parts.append("You are an expert home cook and recipe developer.\n")
            parts.append(
                "TASK:\nGenerate a single practical recipe the user can make using ONLY the ingredients listed below. You may assume basic staples (salt, pepper, oil, water) but do not assume any other ingredients. Be concise and provide a short ingredients list (with amounts if appropriate) and clear step-by-step instructions.\n\n"
            )
            parts.append(
                "RESPONSE_FORMAT: Return only a JSON object with the keys:\n  title: string\n  ingredients: list of objects {name: string, amount: string (optional)}\n  steps: list of strings\n  estimated_minutes: integer\nDo NOT include any extra commentary outside the JSON object.\n\n"
            )
            parts.append("AVAILABLE_INGREDIENTS:\n")
            for it in ingredients:
                parts.append(f"- {it}\n")
            parts.append("\nJSON_OUTPUT:\n")
            prompt = "".join(parts)

            resp = model.generate_content(prompt, generation_config=generation_config)
            resp_text = None
            if isinstance(resp, str):
                resp_text = resp
            elif hasattr(resp, "text") and resp.text:
                resp_text = resp.text
            elif hasattr(resp, "content") and resp.content:
                resp_text = resp.content
            elif hasattr(resp, "candidates") and getattr(resp, "candidates"):
                first = resp.candidates[0]
                if isinstance(first, dict):
                    resp_text = first.get("content") or first.get("output") or None
                elif hasattr(first, "content"):
                    resp_text = first.content

            if resp_text:
                import json, re

                m = re.search(r"\{.*\}", resp_text, re.DOTALL)
                if m:
                    try:
                        obj = json.loads(m.group(0))
                        title = obj.get("title", "Quick Recipe")
                        ing = obj.get("ingredients", [])
                        steps = obj.get("steps", [])
                        est = int(obj.get("estimated_minutes", 20))

                        names_used: list[str] = []
                        for ii in ing:
                            if isinstance(ii, dict):
                                n = ii.get("name") or ii.get("ingredient")
                                if n:
                                    names_used.append(str(n))
                            elif isinstance(ii, str):
                                names_used.append(ii)

                        return Recipe(title=title, ingredients_used=names_used, steps=steps, estimated_minutes=est)
                    except Exception:
                        # If parsing fails, fall back to local generator
                        pass
        except Exception:
            # Model call failed; fall back to local generator
            pass


@router.post("/", response_model=GroceryItem, status_code=201)
def add_grocery(body: GroceryCreate, current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    user_id = _object_id(current_user)
    # Upsert: if the user already has the same named grocery, increment its count
    from pymongo import ReturnDocument

    doc_on_insert = {
        "user_id": user_id,
        "name": body.name,
        "min_days": body.min_days,
        "max_days": body.max_days,
        "created_at": datetime.now(timezone.utc),
    }

    updated = col.find_one_and_update(
        {"user_id": user_id, "name": body.name},
        {"$inc": {"count": 1}, "$setOnInsert": doc_on_insert},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    return GroceryItem(
        id=str(updated.get("_id")),
        name=updated.get("name", body.name),
        min_days=updated.get("min_days"),
        max_days=updated.get("max_days"),
        created_at=updated.get("created_at", datetime.now(timezone.utc)),
        count=updated.get("count", 1),
    )


@router.delete("/{grocery_id}", status_code=204)
def delete_grocery(grocery_id: str, current_user: User = Depends(get_current_user)):
    col = get_groceries_collection()
    user_oid = _object_id(current_user)
    try:
        target_oid = ObjectId(grocery_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid grocery id")

    # If count > 1, decrement the count; otherwise remove the document.
    doc = col.find_one({"_id": target_oid, "user_id": user_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Grocery not found")

    current_count = int(doc.get("count", 1))
    if current_count > 1:
        res = col.update_one({"_id": target_oid, "user_id": user_oid}, {"$inc": {"count": -1}})
        if res.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to decrement grocery count")
        return None

    # count <= 1 -> delete
    result = col.delete_one({"_id": target_oid, "user_id": user_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete grocery")
    return None


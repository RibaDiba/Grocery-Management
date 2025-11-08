
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, User
from database import get_receipts_collection
from models import Receipt
from typing import List

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

@router.get("/", response_model=List[Receipt])
def list_receipts(current_user: User = Depends(get_current_user)):
    receipts_col = get_receipts_collection()
    cursor = receipts_col.find({"user_id": current_user.id})
    receipts = []
    for doc in cursor:
        receipts.append(Receipt(**doc))
    return receipts

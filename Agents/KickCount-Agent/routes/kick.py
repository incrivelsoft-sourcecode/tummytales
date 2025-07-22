from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from models.movement import MovementModel as kickEntry
from db.mongo import entries_col  # ✅ using your defined async collection

router = APIRouter(tags=["Kick Logging"])


# ─────────────────────────────────────────────────────────────
# POST /api/kick-entry   – Add one kick entry into the `entries` collection
# ─────────────────────────────────────────────────────────────
@router.post("/kick-entry")
async def create_kick_entry_route(entry: kickEntry):
    try:
        ObjectId(entry.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    entry_dict = entry.dict()
    result = await entries_col.insert_one(entry_dict)

    return {"message": "Kick entry added", "entry_id": str(result.inserted_id)}


# ─────────────────────────────────────────────────────────────
# GET /api/kick-entries  – Return all kick entries for a given user
# ─────────────────────────────────────────────────────────────
@router.get("/kick-entries")
async def get_kick_entries_route(
    user_id: str = Query(...)
):
    try:
        ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    entries_cursor = entries_col.find({"user_id": user_id})
    entries = await entries_cursor.to_list(length=None)

    # Convert ObjectIds to strings
    for e in entries:
        e["_id"] = str(e["_id"])

    return entries

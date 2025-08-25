from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from models.movement import MovementModel as kickEntry
from db.mongo import entries_col  # ✅ using your defined async collection
from datetime import datetime

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


# ─────────────────────────────────────────────────────────────
# GET /api/session-summary  – Return summary of kick entries for a given user
# ─────────────────────────────────────────────────────────────
@router.get("/session-summary")
async def get_session_summary(
    user_id: str = Query(...),
    session_id: str = Query(...)
):
    # Validate user_id
    try:
        ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Fetch kicks for the session
    kicks_cursor = entries_col.find({"user_id": user_id, "session_id": session_id})
    kicks = await kicks_cursor.to_list(length=None)

    if not kicks:
        return {
            "total_kicks": 0,
            "session_duration": 0,
            "most_common_kick": None,
            "session_start": None
        }

    total_kicks = len(kicks)

    # Convert timestamps to datetime objects if needed
    timestamps = []
    for k in kicks:
        ts = k.get("timestamp")
        if isinstance(ts, str):  # Convert from string to datetime if needed
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        timestamps.append(ts)

    min_time = min(timestamps)
    max_time = max(timestamps)
    session_duration = int((max_time - min_time).total_seconds() // 60)  # in minutes

    # Find most common kick type
    kick_counts = {}
    for k in kicks:
        strength = k.get("strength")
        if strength:
            kick_counts[strength] = kick_counts.get(strength, 0) + 1

    most_common_kick = max(kick_counts, key=kick_counts.get) if kick_counts else None

    return {
        "total_kicks": total_kicks,
        "session_duration": session_duration,
        "most_common_kick": most_common_kick,
        "session_start": min_time.isoformat()
    }
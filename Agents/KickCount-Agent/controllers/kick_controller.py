# kick_controller.py
from fastapi import HTTPException
from models.movement import MovementModel as KickEntry
from services.db_api import add_kick_entry, list_kick_entries, get_profile

async def create_kick_entry_controller(user_id: str, entry: KickEntry):
    # Optional: ensure profile exists
    profile = await get_profile(str(user_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Mom profile not found")

    try:
        await add_kick_entry(str(user_id), entry.dict())
        return {"success": True, "message": "Kick entry added successfully"}
    except Exception as e:
        # httpx.HTTPStatusError would bubble here if 4xx/5xx
        raise HTTPException(status_code=502, detail=f"DB API error: {e}")

async def get_kick_entries_controller(user_id: str):
    profile = await get_profile(str(user_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Mom profile not found")

    try:
        entries = await list_kick_entries(str(user_id))
        return entries or []
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DB API error: {e}")
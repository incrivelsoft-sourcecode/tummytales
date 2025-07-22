from fastapi import HTTPException
from db.mongo import profile_col  # your MongoDB collection
from models.movement import MovementModel as KickEntry

async def create_kick_entry_controller(user_id: str, entry: KickEntry):
    result = await profile_col.update_one(
        {"userId": str(user_id)},  # Match userId as string
        {"$push": {"kickEntries": entry.dict()}}  # Push entry into subdoc array
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mom profile not found")

    return {"success": True, "message": "Kick entry added successfully"}

async def get_kick_entries_controller(user_id: str):
    mom_profile = await profile_col.find_one({"userId": str(user_id)})

    if not mom_profile:
        raise HTTPException(status_code=404, detail="Mom profile not found")

    return mom_profile.get("kickEntries", [])
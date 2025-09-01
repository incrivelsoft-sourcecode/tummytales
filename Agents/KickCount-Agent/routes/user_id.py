from fastapi import APIRouter, HTTPException, Query
from db.mongo import profile_col  # Import your profile collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["User Profile"])

# ─────────────────────────────────────────────────────────────
# GET /api/user-by-email – Fetch user profile by email
# ─────────────────────────────────────────────────────────────
@router.get("/user-by-email")
async def get_user_by_email(email: str = Query(...)):
    try:
        user = await profile_col.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "_id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", "Unknown User")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

# ─────────────────────────────────────────────────────────────
# GET /api/profile-from-email – Create or fetch profile by email
# ─────────────────────────────────────────────────────────────    
@router.get("/profile-from-email")
async def profile_from_email(email: str):
    """
    • If a profile for `email` exists → return its _id  
    • Otherwise create a bare‑bones profile and return the new _id
    """
    profile = await profile_col.find_one({"email": email})

    if profile:
        # convert ObjectId → str so the front‑end can use it
        return {"userId": str(profile["_id"])}

    # ---- create minimal profile ----
    doc = {
        "email": email,
        # add any defaults you need here
    }
    result = await profile_col.insert_one(doc)
    return {"userId": str(result.inserted_id)}
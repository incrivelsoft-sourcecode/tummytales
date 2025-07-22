from fastapi import APIRouter, Depends, HTTPException, status
from db_access import useronboarding_db
from models.useronboarding_models import UserDetailsModel, MomProfileModel, SupporterProfileModel
from utils.security import verify_agent_api_key

router = APIRouter(
    prefix="/useronboarding",
    tags=["User Onboarding"],
    dependencies=[Depends(verify_agent_api_key("useronboarding"))]
)

# -----------------------------
# POST
# -----------------------------

@router.post("/user")
def add_user_details(data: UserDetailsModel):
    try:
        inserted_id = useronboarding_db.insert_user_details(data)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert user details: {str(e)}")

@router.post("/mom")
def add_mom_profile(user_id: str, data: MomProfileModel):
    try:
        inserted_id = useronboarding_db.insert_mom_profile(user_id, data)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert mom profile: {str(e)}")

@router.post("/supporter")
def add_supporter_profile(user_id: str, data: SupporterProfileModel):
    try:
        inserted_id = useronboarding_db.insert_supporter_profile(user_id, data)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert supporter profile: {str(e)}")

# -----------------------------
# PATCH
# -----------------------------

@router.patch("/user")
def update_user_details(user_id: str, update_fields: dict):
    try:
        result = useronboarding_db.update_user_details(user_id, update_fields)
        return {"status": "success", "modified_count": result.modified_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user details: {str(e)}")

@router.patch("/mom")
def update_mom_profile(user_id: str, update_fields: dict):
    try:
        result = useronboarding_db.update_mom_profile(user_id, update_fields)
        return {"status": "success", "modified_count": result.modified_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update mom profile: {str(e)}")

@router.patch("/supporter")
def update_supporter_profile(user_id: str, update_fields: dict):
    try:
        result = useronboarding_db.update_supporter_profile(user_id, update_fields)
        return {"status": "success", "modified_count": result.modified_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update supporter profile: {str(e)}")

# -----------------------------
# GET
# -----------------------------

@router.get("/user")
def get_user_details(user_id: str):
    try:
        user = useronboarding_db.get_user_details(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user details: {str(e)}")

@router.get("/mom")
def get_mom_profile(user_id: str):
    try:
        profile = useronboarding_db.get_mom_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Mom profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mom profile: {str(e)}")

@router.get("/supporter")
def get_supporter_profile(user_id: str):
    try:
        profile = useronboarding_db.get_supporter_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Supporter profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve supporter profile: {str(e)}")

# -----------------------------
# DELETE
# -----------------------------

@router.delete("/user")
def delete_user_details(user_id: str):
    try:
        result = useronboarding_db.delete_user_details(user_id)
        return {"status": "success", "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user details: {str(e)}")

@router.delete("/mom")
def delete_mom_profile(user_id: str):
    try:
        result = useronboarding_db.delete_mom_profile(user_id)
        return {"status": "success", "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete mom profile: {str(e)}")

@router.delete("/supporter")
def delete_supporter_profile(user_id: str):
    try:
        result = useronboarding_db.delete_supporter_profile(user_id)
        return {"status": "success", "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete supporter profile: {str(e)}")

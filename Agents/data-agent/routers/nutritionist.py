from fastapi import APIRouter, Depends, HTTPException, status
from db_access import nutrition_db
from models.nutrition_models import FinalizedMealModel, AIGeneratedMealModel
from utils.security import verify_agent_api_key  # Optional, if using route-level auth

# router = APIRouter()
router = APIRouter(
        prefix="/nutritionist",
        tags=["Nutrition"], 
        dependencies=[Depends(verify_agent_api_key("nutritionist"))]
    )

# -----------------------------
# POST/PUT
# -----------------------------

@router.post("/ai-meal")
def add_ai_generated_meal(data: AIGeneratedMealModel):
    try:
        inserted_id = nutrition_db.insert_ai_generated_meal(data)
        return {"status": "success", "inserted_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert AI meal: {str(e)}")    

@router.post("/finalized-meal")
def add_finalized_meal(data: FinalizedMealModel):
    try:
        inserted_id = nutrition_db.insert_finalized_meal(data)
        return {"status": "success", "inserted_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert finalized meal: {str(e)}")

@router.put("/finalized-meal/{meal_id}")
def update_finalized_meal(meal_id: str, data: FinalizedMealModel):
    try:
        updated = nutrition_db.update_finalized_meal(meal_id, data)
        if updated.modified_count == 0:
            raise HTTPException(status_code=404, detail="Meal not found or no update made.")
        return {"status": "success", "updated_count": updated.modified_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update meal: {str(e)}")

# -----------------------------
# GET
# -----------------------------

@router.get("/ai-meal/{user_id}")
def get_ai_generated_meals(user_id: str):
    try:
        meals = nutrition_db.get_ai_meals_by_user(user_id)
        return {"status": "success", "meals": meals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch AI meals: {str(e)}")

@router.get("/finalized-meal/{user_id}")
def get_finalized_meals(user_id: str):
    try:
        meals = nutrition_db.get_finalized_meals_by_user(user_id)
        return {"status": "success", "meals": meals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch finalized meals: {str(e)}")

# -----------------------------
# DELETE
# -----------------------------

@router.delete("/finalized-meal/{meal_id}")
def delete_finalized_meal(meal_id: str):
    try:
        deleted = nutrition_db.delete_finalized_meal(meal_id)
        if deleted.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Meal not found.")
        return {"status": "success", "deleted_count": deleted.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete meal: {str(e)}")

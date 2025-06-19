from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Any, Optional

from app.core.meal import meal_planning_service
from app.core.meal.meal_model import Meal, MealPlanRequest, MealPlanResponse
from app.core.meal.meal_model import RegenerateRequest, IngredientEditRequest, PortionAdjustRequest
from app.core.meal.repository import meal_repository
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate", response_model=MealPlanResponse)
async def generate_meal(request: MealPlanRequest):
    """
    Generate a personalized meal recipe
    
    This endpoint creates a customized meal recipe based on user preferences,
    pregnancy trimester, and nutritional needs.
    """
    try:
        # Initialize the meal planning service if needed
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
        
        # Generate the meal plan
        result = await meal_planning_service.generate_meal(request)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating meal: {str(e)}")

@router.get("/types")
async def get_meal_types():
    """Get available meal types"""
    return {
        "meal_types": [
            "breakfast",
            "lunch",
            "dinner",
            "snack",
            "dessert"
        ]
    }

# Add these endpoints to app/api/routes/meal.py

@router.post("/regenerate")
async def regenerate_meal(request: Dict[str, Any]):
    """
    Regenerate a meal with the same criteria but different recipe
    """
    try:
        meal_id = request.get("meal_id")
        user_id = request.get("user_id", "anonymous_user")
        
        if not meal_id:
            raise HTTPException(status_code=400, detail="meal_id is required")
        
        # Get the original meal to extract preferences
        original_meal_doc = await meal_repository.get_meal_by_id(meal_id)
        
        if not original_meal_doc:
            raise HTTPException(status_code=404, detail=f"Meal not found with ID: {meal_id}")
        
        # Extract original request parameters
        original_request = original_meal_doc.get("original_request", {})
        original_meal = original_meal_doc.get("meal", {})
        
        return {
            "status": "success",
            "data": {
                "query": f"Generate a different {original_request.get('meal_type', 'lunch')} recipe for {original_request.get('trimester', 'second')} trimester",
                "meal_type": original_request.get("meal_type", "lunch"),
                "trimester": original_request.get("trimester", "second"),
                "preferences": original_request.get("preferences", {}),
                "original_title": original_meal.get("title", "Previous Recipe"),
                "regenerate": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing regeneration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error preparing regeneration: {str(e)}")

@router.post("/edit-ingredients")
async def edit_ingredients(request: Dict[str, Any]):
    """
    Edit specific ingredients in a meal
    
    This endpoint replaces specified ingredients with alternatives
    and updates the nutritional information accordingly.
    """
    try:
        meal_id = request.get("meal_id")
        user_id = request.get("user_id", "anonymous_user")
        replacements = request.get("replacements", {})
        ai_replacements = request.get("aiReplacements", [])
        
        logger.info(f"Edit ingredients request - meal_id: {meal_id}, replacements: {replacements}, aiReplacements: {ai_replacements}")
        
        if not meal_id:
            raise HTTPException(status_code=400, detail="meal_id is required")
        
        if not replacements and not ai_replacements:
            raise HTTPException(status_code=400, detail=f"replacements or aiReplacements are required. Got replacements: {replacements}, aiReplacements: {ai_replacements}")
        
        # Initialize the meal planning service if needed
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
        
        # Create IngredientEditRequest object with both types of replacements
        class ExtendedIngredientEditRequest:
            def __init__(self, meal_id, user_id, replacements, ai_replacements):
                self.meal_id = meal_id
                self.user_id = user_id
                self.replacements = replacements
                self.ai_replacements = ai_replacements
        
        edit_request = ExtendedIngredientEditRequest(
            meal_id=meal_id,
            user_id=user_id,
            replacements=replacements,
            ai_replacements=ai_replacements
        )
        
        logger.info(f"Calling meal_planning_service.edit_ingredients with request")
        
        # Edit the ingredients
        result = await meal_planning_service.edit_ingredients(edit_request)
        
        logger.info(f"Edit ingredients completed successfully for meal_id: {meal_id}")
        
        # Ensure we return proper JSON response
        response_data = {
            "status": "success",
            "data": {
                "_id": meal_id,
                "meal": result.meal.model_dump(),
                "message": f"Ingredients updated successfully ({len(replacements)} manual + {len(ai_replacements)} AI replacements)"
            }
        }
        
        logger.info(f"Returning response: {response_data['status']} with meal data")
        return response_data
        
    except ValueError as e:
        logger.error(f"ValueError in edit_ingredients: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error editing ingredients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error editing ingredients: {str(e)}")

@router.post("/adjust-portions", response_model=MealPlanResponse)
async def adjust_portions(request: PortionAdjustRequest):
    """
    Adjust the portion size for a meal
    
    This endpoint updates the number of servings and scales
    the ingredients accordingly.
    """
    try:
        # Initialize the meal planning service if needed
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
        
        # Adjust the portions
        result = await meal_planning_service.adjust_portions(request)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adjusting portions: {str(e)}")


# app/api/routes/meal.py (add these new endpoints)

@router.get("/history")
async def get_meal_history(
    user_id: str, 
    limit: int = Query(10, ge=1, le=50), 
    skip: int = Query(0, ge=0)
):
    """
    Get meal history for a user
    
    This endpoint retrieves a paginated list of meals generated for a specific user.
    """
    try:
        meal_documents = await meal_repository.get_meal_history(user_id, limit, skip)
        
        # Convert to simple response format that frontend expects
        history_items = []
        for doc in meal_documents:
            history_item = {
                "_id": doc["_id"],
                "meal": doc["meal"],
                "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
                "meal_type": doc.get("meal_type", "general"),
                "trimester": doc.get("trimester", "second")
            }
            history_items.append(history_item)
        
        return {
            "status": "success",
            "data": history_items,
            "total": len(history_items)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving meal history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving meal history: {str(e)}")

@router.get("/latest/{meal_type}", response_model=MealPlanResponse)
async def get_latest_meal(meal_type: str, user_id: str):
    """
    Get the latest meal of a specific type for a user
    
    This endpoint retrieves the most recently generated meal of a specific type.
    """
    try:
        meal_document = await meal_repository.get_latest_meal_by_type(user_id, meal_type)
        
        if not meal_document:
            raise HTTPException(status_code=404, detail=f"No {meal_type} meal found for user {user_id}")
        
        # Convert to response format
        response = MealPlanResponse(
            meal=Meal(**meal_document["meal"]),
            sources=[],  # Historical meals don't need sources
            meal_id=meal_document["_id"]
        )
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving latest meal: {str(e)}")
    
@router.post("/save")
async def save_meal(meal_data: Dict[str, Any]):
    """
    Save a generated meal to the database
    
    Args:
        meal_data: Dictionary containing meal information and metadata
        
    Returns:
        Dict with saved meal ID and success status
    """
    try:
        # Extract the meal content
        meal_content = meal_data.get("meal", {})
        user_id = meal_data.get("user_id", "anonymous_user")
        meal_type = meal_data.get("meal_type", "general")
        
        # Create a Meal object from the parsed data
        meal = Meal(
            title=meal_content.get("title", "Generated Recipe"),
            servings=meal_content.get("servings", 2),
            ingredients=meal_content.get("ingredients", []),
            instructions=meal_content.get("instructions", ""),
            nutritionalValues=meal_content.get("nutritionalValues", {}),
            pregnancy_safe_notes=meal_content.get("Pregnancy-Safe Notes", ""),
            substitution_options=meal_content.get("Substitution Options", "")
        )
        
        # Create a proper MealPlanRequest object for storage
        meal_request = MealPlanRequest(
            meal_type=meal_type,
            trimester=meal_data.get("trimester", "second"),
            preferences=meal_data.get("preferences", {}),
            user_id=user_id
        )
        
        # Save to database using the correct method
        meal_id = await meal_repository.store_meal(meal, meal_request)
        
        logger.info(f"Successfully saved meal with ID: {meal_id}")
        
        return {
            "status": "success",
            "meal_id": meal_id,
            "message": "Meal saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving meal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save meal: {str(e)}")
# app/api/routes/customization.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import logging
from app.core.meal.meal_model import PortionAdjustRequest
from app.core.meal.meal_service import meal_planning_service
from app.core.meal.meal_model import (
    SpiceLevelRequest, CookingTimeRequest, CookingMethodRequest,
    ComplexityRequest, NutritionBoostRequest, BatchCookingRequest,
    CulturalAdaptationRequest, RegenerateRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/adjust-spice")
async def adjust_spice_level(request: SpiceLevelRequest):
    """
    Adjust the spice level of a recipe
    
    Spice levels: none, mild, medium, hot
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.adjust_spice_level(request)
        
        return {
            "status": "success",
            "message": f"Successfully adjusted spice level to {request.spice_level}",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error adjusting spice level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adjust-time")
async def adjust_cooking_time(request: CookingTimeRequest):
    """
    Adjust recipe to fit within specified cooking time
    
    Max time: 15-120 minutes
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.adjust_cooking_time(request)
        
        return {
            "status": "success",
            "message": f"Successfully adjusted recipe to {request.max_time} minutes",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error adjusting cooking time: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/adjust-portions")
async def adjust_portions_endpoint(request: PortionAdjustRequest):
    """Adjust portion sizes"""
    try:
        result = await meal_planning_service.adjust_portions(request)
        return {
            "status": "success", 
            "data": {
                "_id": request.meal_id,
                "meal": result.meal.model_dump()
            }
        }
    except Exception as e:
        logger.error(f"Error adjusting portions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-method")
async def change_cooking_method(request: CookingMethodRequest):
    """
    Change the cooking method of a recipe
    
    Methods: stovetop, oven, pressure_cooker, microwave, no_cook
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.change_cooking_method(request)
        
        return {
            "status": "success",
            "message": f"Successfully changed cooking method to {request.method}",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error changing cooking method: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adjust-complexity")
async def adjust_complexity(request: ComplexityRequest):
    """
    Adjust recipe complexity level
    
    Levels: simple, moderate, elaborate
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.adjust_complexity(request)
        
        return {
            "status": "success",
            "message": f"Successfully adjusted complexity to {request.complexity}",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error adjusting complexity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/boost-nutrition")
async def boost_nutrition(request: NutritionBoostRequest):
    """
    Boost specific nutrients in a recipe
    
    Nutrients: iron, calcium, protein, folate, fiber
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.boost_nutrition(request)
        
        return {
            "status": "success",
            "message": f"Successfully boosted {', '.join(request.boost_nutrients)}",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error boosting nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-cooking")
async def scale_for_batch_cooking(request: BatchCookingRequest):
    """
    Scale recipe for batch cooking/meal prep
    
    Prepare multiple days worth of meals
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.scale_for_batch_cooking(request)
        
        return {
            "status": "success",
            "message": f"Successfully scaled for {request.days} days batch cooking",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error scaling for batch cooking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cultural-adaptation")
async def adapt_to_culture(request: CulturalAdaptationRequest):
    """
    Adapt recipe to a different cultural cuisine
    
    Transform recipes to match different cultural food traditions
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.adapt_to_culture(request)
        
        return {
            "status": "success",
            "message": f"Successfully adapted to {request.target_cuisine} cuisine",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error adapting to culture: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/leftover-transformation")
async def create_leftover_transformation(request: RegenerateRequest):
    """
    Transform leftovers into a new creative dish
    
    Creates a completely new recipe using leftovers from the original
    """
    try:
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
            
        result = await meal_planning_service.create_leftover_transformation(request)
        
        return {
            "status": "success",
            "message": "Successfully created leftover transformation recipe",
            "data": {
                "_id": result.meal_id,
                "aiGeneratedMeal": result.meal.model_dump(by_alias=True),
                "sources": result.sources
            }
        }
    except Exception as e:
        logger.error(f"Error creating leftover transformation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customization-options")
async def get_customization_options():
    """
    Get all available customization options
    
    Returns the list of customization features and their parameters
    """
    return {
        "status": "success",
        "customizations": {
            "spice_levels": ["none", "mild", "medium", "hot"],
            "cooking_times": {
                "min": 15,
                "max": 120,
                "presets": [15, 30, 45, 60]
            },
            "cooking_methods": ["stovetop", "oven", "pressure_cooker", "microwave", "no_cook"],
            "complexity_levels": ["simple", "moderate", "elaborate"],
            "nutrients_to_boost": ["iron", "calcium", "protein", "folate", "fiber"],
            "batch_cooking": {
                "max_days": 7,
                "max_portions_per_day": 4
            },
            "cuisines": [
                "Indian", "Chinese", "Italian", "Mexican", "Thai", 
                "Mediterranean", "Japanese", "American", "French", 
                "Korean", "Vietnamese", "Middle Eastern"
            ]
        }
    }
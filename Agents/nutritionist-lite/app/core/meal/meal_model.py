# app/core/meal/meal_model.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class NutritionalValues(BaseModel):
    Calories: Optional[str] = Field(None, description="Calorie content")
    Protein: Optional[str] = Field(None, description="Protein content") 
    Carbohydrates: Optional[str] = Field(None, description="Carbohydrate content")
    Fat: Optional[str] = Field(None, description="Fat content")
    Fiber: Optional[str] = Field(None, description="Fiber content")
    Calcium: Optional[str] = Field(None, description="Calcium content")
    Iron: Optional[str] = Field(None, description="Iron content")

class Meal(BaseModel):
    """Model for a complete meal recipe"""
    title: str = Field(..., description="Title of the meal")
    servings: int = Field(..., description="Number of servings")
    ingredients: List[str] = Field(..., description="List of ingredients")
    instructions: str = Field(..., description="Step-by-step cooking instructions")
    nutritionalValues: NutritionalValues = Field(..., description="Nutritional information")
    
    # Use aliases to match the JSON keys with spaces
    pregnancy_safe_notes: str = Field(..., alias="Pregnancy-Safe Notes", description="Notes on why this recipe is safe for pregnancy")
    substitution_options: str = Field(..., alias="Substitution Options", description="Suggestions for ingredient substitutions")
    
    # New fields for enhanced customization
    cooking_time: Optional[str] = Field(None, description="Total cooking time (e.g., '30 minutes')")
    difficulty_level: Optional[str] = Field("moderate", description="Recipe difficulty: simple, moderate, elaborate")
    spice_level: Optional[str] = Field("mild", description="Spice level: none, mild, medium, hot")
    equipment_needed: Optional[List[str]] = Field(default_factory=list, description="Kitchen equipment required")
    
    image: Optional[str] = Field(None, description="URL to an image of the meal")
    
    class Config:
        # Allow population by field name or alias
        populate_by_name = True
        # Allow extra fields in case the LLM gives us more than we expect
        extra = "ignore"

class MealPlanRequest(BaseModel):
    """Model for meal plan generation request"""
    meal_type: str = Field(..., description="Type of meal (breakfast, lunch, dinner, snack, dessert)")
    trimester: str = Field(..., description="Pregnancy trimester (first, second, third)")
    preferences: Dict = Field(..., description="User preferences for meal generation")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class MealPlanResponse(BaseModel):
    """Model for meal plan generation response"""
    meal: Meal = Field(..., description="Generated meal")
    sources: List[str] = Field(default_factory=list, description="Sources used for meal generation")
    meal_id: Optional[str] = Field(None, description="Database ID of the stored meal")

# Existing request models
class RegenerateRequest(BaseModel):
    """Model for recipe regeneration requests"""
    meal_id: str = Field(..., description="ID of the meal to regenerate")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class IngredientEditRequest(BaseModel):
    """Model for ingredient editing requests"""
    meal_id: str = Field(..., description="ID of the meal to edit")
    replacements: Dict[str, str] = Field(..., description="Mapping of original ingredients to replacements")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class PortionAdjustRequest(BaseModel):
    """Model for portion adjustment requests"""
    meal_id: str = Field(..., description="ID of the meal to adjust")
    servings: int = Field(..., description="New number of servings", ge=1, le=12)
    user_id: Optional[str] = Field(None, description="User ID for personalization")

# New customization request models
class SpiceLevelRequest(BaseModel):
    """Model for spice level adjustment requests"""
    meal_id: str = Field(..., description="ID of the meal to adjust")
    spice_level: str = Field(..., description="Desired spice level: none, mild, medium, hot")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class CookingTimeRequest(BaseModel):
    """Model for cooking time adjustment requests"""
    meal_id: str = Field(..., description="ID of the meal to adjust")
    max_time: int = Field(..., description="Maximum cooking time in minutes", ge=15, le=120)
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class CookingMethodRequest(BaseModel):
    """Model for cooking method change requests"""
    meal_id: str = Field(..., description="ID of the meal to adjust")
    method: str = Field(..., description="Cooking method: stovetop, oven, pressure_cooker, microwave, no_cook")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class ComplexityRequest(BaseModel):
    """Model for recipe complexity adjustment requests"""
    meal_id: str = Field(..., description="ID of the meal to adjust")
    complexity: str = Field(..., description="Desired complexity: simple, moderate, elaborate")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class NutritionBoostRequest(BaseModel):
    """Model for nutrition boost requests"""
    meal_id: str = Field(..., description="ID of the meal to boost")
    boost_nutrients: List[str] = Field(..., description="Nutrients to maximize: iron, calcium, protein, folate, fiber")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class BatchCookingRequest(BaseModel):
    """Model for batch cooking scaling requests"""
    meal_id: str = Field(..., description="ID of the meal to scale")
    days: int = Field(..., description="Number of days to prep for", ge=1, le=7)
    portions_per_day: int = Field(..., description="Portions needed per day", ge=1, le=4)
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class CulturalAdaptationRequest(BaseModel):
    """Model for cultural adaptation requests"""
    meal_id: str = Field(..., description="ID of the meal to adapt")
    target_cuisine: str = Field(..., description="Target cuisine style")
    maintain_nutrition: bool = Field(True, description="Whether to maintain similar nutritional profile")
    user_id: Optional[str] = Field(None, description="User ID for personalization")
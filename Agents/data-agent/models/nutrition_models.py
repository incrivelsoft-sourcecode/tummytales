from typing import List, Optional, Dict, Union
from pydantic import BaseModel, Field
from datetime import datetime

# ----------------------------
# AI Generated Meal Model
# ----------------------------
class NutritionalValuesModel(BaseModel):
    Calories: Optional[str]
    Protein: Optional[str]
    Carbohydrates: Optional[str]
    Fat: Optional[str]
    Fiber: Optional[str]
    Calcium: Optional[str]
    Iron: Optional[str]

class AIGeneratedMealEntry(BaseModel):
    title: str
    servings: int
    ingredients: List[str]
    instructions: Optional[str]
    image: Optional[str]
    nutritionalValues: Optional[NutritionalValuesModel]
    Substitution_Options: Optional[str] = Field(None, alias="Substitution Options")

class AIGeneratedMealModel(BaseModel):
    user_name: str
    mealType: str
    preferences: Optional[Dict[str, List[str]]]
    allergies: Optional[List[str]]
    reminderTime: Optional[datetime]
    repeatDaily: Optional[bool]
    userLocalTime: Optional[datetime]
    aiGeneratedMeal: AIGeneratedMealEntry
    createdAt: Optional[datetime]
    generationStatus: Optional[str]
    trimester: Optional[str]

# ----------------------------
# Finalized Meal Model
# ----------------------------
class FinalizedMealData(BaseModel):
    title: str
    servings: int
    ingredients: List[str]
    instructions: Optional[str]
    nutritionalValues: Optional[NutritionalValuesModel]
    Pregnancy_Safe_Notes: Optional[str] = Field(None, alias="Pregnancy-Safe Notes")
    Substitution_Options: Optional[str] = Field(None, alias="Substitution Options")
    image: Optional[str]

class OriginalRequestModel(BaseModel):
    meal_type: Optional[str]
    trimester: Optional[str]
    preferences: Optional[Dict[str, List[str]]]

class FinalizedMealModel(BaseModel):
    meal: FinalizedMealData
    original_request: Optional[OriginalRequestModel]
    user_id: str
    meal_type: Optional[str]
    trimester: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    version: Optional[int]
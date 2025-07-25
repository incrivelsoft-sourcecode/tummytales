# agent_collections.py
from datetime import datetime, timezone
from utils.db import db, users
from models.nutrition_models import AIGeneratedMealModel, FinalizedMealModel
from utils.user_metadata import extract_nutrition_context_from_user

"""

User's context:

    context = {
        "trimester": request.trimester,
        "dietary_restrictions": request.dietary_restrictions,
        "cuisine_preferences": request.cuisine_preferences,
        "allergies": request.allergies,
        "nutritional_focus": request.nutritional_focus,
        "user_id": request.user_id
    }

- Static metadata (like name, email, role, etc.) comes from UserDetailsModel.
- Dynamic metadata (like trimester, cultural background, preferred language, pregnancy status, etc.) comes from MomProfileModel.

"""

# -----------------------------
# Metadata Extraction for Shared `users` Collection
# -----------------------------
# context = extract_nutrition_context_from_user(user_doc)

# -----------------------------
# Nutrition Agent Logic
# -----------------------------
nutrition_agent_meals = db["nutrition_agent_meals"]
nutrition_agent_ai_meals = db["nutrition_agent_ai_meals"]

# -----------------------------
# Insert Functions
# -----------------------------
def insert_ai_generated_meal(meal: AIGeneratedMealModel):
    if not users.find_one({"user_id": meal.user_id}):
        print(f"[nutrition] User {meal.user_id} not found.")
        return None

    doc = meal.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["updated_at"] = doc["created_at"]

    result = nutrition_agent_ai_meals.insert_one(doc)
    print(f"[nutrition] AI meal generated for user {meal.user_id}")
    return result.inserted_id

def insert_finalized_meal(meal: FinalizedMealModel):
    if not users.find_one({"user_id": meal.user_id}):
        print(f"[nutrition] User {meal.user_id} not found.")
        return None

    doc = meal.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["updated_at"] = doc["created_at"]

    result = nutrition_agent_meals.insert_one(doc)
    print(f"[nutrition] Finalized meal saved for user_id {meal.user_id}")
    return result.inserted_id

# -----------------------------
# Retrieve Functions
# -----------------------------
def get_ai_meals_by_user(user_id: str):
    return list(nutrition_agent_ai_meals.find({"user_id": user_id}))

def get_finalized_meals_by_user(user_id: str):
    return list(nutrition_agent_meals.find({"user_id": user_id}))

# -----------------------------
# Update Functions
# -----------------------------
def update_finalized_meal(meal_id: str, update_fields: dict):
    update_fields["updated_at"] = datetime.now(timezone.utc)
    return nutrition_agent_meals.update_one({"_id": meal_id}, {"$set": update_fields})

# -----------------------------
# Delete Functions
# -----------------------------
def delete_ai_meal(meal_id: str):
    return nutrition_agent_ai_meals.delete_one({"_id": meal_id})

def delete_finalized_meal(meal_id: str):
    return nutrition_agent_meals.delete_one({"_id": meal_id})


# -----------------------------
# Updated Index or Validation Setup
# -----------------------------

def create_agent_indexes():
   
    nutrition_agent_meals.create_index("user_id")
    nutrition_agent_meals.create_index("created_at")
    nutrition_agent_ai_meals.create_index("user_id")
    nutrition_agent_ai_meals.create_index("createdAt")
    
    print("Agent-specific indexes created.")

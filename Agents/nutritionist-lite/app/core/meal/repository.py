# app/core/meal/repository.py

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from bson import ObjectId
import json

from app.config.database import db
from app.core.meal.meal_model import Meal, MealPlanRequest

logger = logging.getLogger(__name__)

class MealRepository:
    """Repository for storing and retrieving meal data"""
    
    @classmethod
    async def store_meal(cls, meal: Meal, request: MealPlanRequest) -> str:
        """
        Store a generated meal and its request parameters
        
        Args:
            meal: The generated meal
            request: The original request that generated the meal
            
        Returns:
            str: The ID of the stored meal
        """
        try:
            # Convert meal to dict for MongoDB storage
            meal_dict = meal.model_dump(by_alias=True)
            
            # Convert request to dict
            request_dict = request.model_dump()
            
            # Create document for storage
            meal_document = {
                "meal": meal_dict,
                "original_request": request_dict,
                "user_id": request.user_id,
                "meal_type": request.meal_type,
                "trimester": request.trimester,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "version": 1  # For tracking modifications
            }
            
            # Insert into database
            result = await db.db.meals.insert_one(meal_document)
            meal_id = str(result.inserted_id)
            
            logger.info(f"Stored meal with ID: {meal_id}")
            return meal_id
            
        except Exception as e:
            logger.error(f"Error storing meal: {str(e)}")
            raise
    
    @classmethod
    async def get_meal_by_id(cls, meal_id: str) -> Optional[Dict]:
        """
        Retrieve a meal by its ID
        
        Args:
            meal_id: The ID of the meal to retrieve
            
        Returns:
            Optional[Dict]: The meal document or None if not found
        """
        try:
            # Convert string ID to ObjectId
            object_id = ObjectId(meal_id)
            
            # Retrieve from database
            meal_document = await db.db.meals.find_one({"_id": object_id})
            
            if not meal_document:
                logger.warning(f"Meal not found with ID: {meal_id}")
                return None
            
            # Convert ObjectId to string for JSON serialization
            meal_document["_id"] = str(meal_document["_id"])
            
            return meal_document
            
        except Exception as e:
            logger.error(f"Error retrieving meal: {str(e)}")
            raise
    
    @classmethod
    async def update_meal(cls, meal_id: str, meal: Meal) -> bool:
        """
        Update a meal with new data
        
        Args:
            meal_id: The ID of the meal to update
            meal: The updated meal data
            
        Returns:
            bool: True if successful, False if meal not found
        """
        try:
            # Convert string ID to ObjectId
            object_id = ObjectId(meal_id)
            
            # Convert meal to dict for MongoDB storage
            meal_dict = meal.model_dump(by_alias=True)
            
            # Update document
            # Update document
            result = await db.db.meals.update_one(
                {"_id": object_id},
                {
                    "$set": {
                        "meal": meal_dict,
                        "updated_at": datetime.utcnow()
                    },
                    "$inc": {"version": 1}  # Move $inc outside of $set
                }
            )
            
            if result.matched_count == 0:
                logger.warning(f"Meal not found for update with ID: {meal_id}")
                return False
            
            logger.info(f"Updated meal with ID: {meal_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating meal: {str(e)}")
            raise
    
    @classmethod
    async def get_meal_history(cls, user_id: str, limit: int = 10, skip: int = 0) -> List[Dict]:
        """
        Get meal history for a user
        
        Args:
            user_id: The user ID to get history for
            limit: Maximum number of meals to return
            skip: Number of meals to skip (for pagination)
            
        Returns:
            List[Dict]: List of meal documents
        """
        try:
            # Build query
            query = {"user_id": user_id}
            
            # Execute query with sorting and pagination
            cursor = db.db.meals.find(query).sort(
                "created_at", -1  # Newest first
            ).skip(skip).limit(limit)
            
            # Convert cursor to list
            meal_documents = await cursor.to_list(length=limit)
            
            # Convert ObjectIds to strings for JSON serialization
            for document in meal_documents:
                document["_id"] = str(document["_id"])
            
            logger.info(f"Retrieved {len(meal_documents)} meals for user: {user_id}")
            return meal_documents
            
        except Exception as e:
            logger.error(f"Error retrieving meal history: {str(e)}")
            raise
    
    @classmethod
    async def get_latest_meal_by_type(cls, user_id: str, meal_type: str) -> Optional[Dict]:
        """
        Get the latest meal of a specific type for a user
        
        Args:
            user_id: The user ID to get the meal for
            meal_type: The type of meal (breakfast, lunch, dinner, etc.)
            
        Returns:
            Optional[Dict]: The meal document or None if not found
        """
        try:
            # Build query
            query = {"user_id": user_id, "meal_type": meal_type}
            
            # Execute query with sorting
            meal_document = await db.db.meals.find_one(
                query,
                sort=[("created_at", -1)]  # Newest first
            )
            
            if not meal_document:
                logger.warning(f"No {meal_type} meal found for user: {user_id}")
                return None
            
            # Convert ObjectId to string for JSON serialization
            meal_document["_id"] = str(meal_document["_id"])
            
            return meal_document
            
        except Exception as e:
            logger.error(f"Error retrieving latest meal: {str(e)}")
            raise

# Create singleton instance
meal_repository = MealRepository()
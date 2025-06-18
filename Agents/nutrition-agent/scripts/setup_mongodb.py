# scripts/setup_mongodb.py

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_mongodb():
    """Set up MongoDB collections and indexes for testing"""
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "tummytales_nutrition")
    
    try:
        # Connect to MongoDB
        logger.info(f"Connecting to MongoDB at {mongodb_url}")
        client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
        
        # Check if connection is successful
        await client.server_info()
        
        # Create database
        db = client[db_name]
        
        # Create collections
        meals_collection = db.meals
        
        # Create indexes
        await meals_collection.create_index("user_id")
        await meals_collection.create_index("meal_type")
        await meals_collection.create_index("created_at")
        
        # Create compound index for efficient user history queries
        await meals_collection.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        
        logger.info(f"MongoDB setup complete for database: {db_name}")
        
        # Check if collections exist
        collections = await db.list_collection_names()
        logger.info(f"Collections: {', '.join(collections)}")
        
        # Close connection
        client.close()
        
    except ServerSelectionTimeoutError:
        logger.error(f"Could not connect to MongoDB at {mongodb_url}")
        logger.error("Make sure MongoDB is running and accessible")
        raise
    except Exception as e:
        logger.error(f"Error setting up MongoDB: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(setup_mongodb())
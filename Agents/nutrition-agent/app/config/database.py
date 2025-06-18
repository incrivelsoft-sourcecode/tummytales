import motor.motor_asyncio
from pymongo.errors import ServerSelectionTimeoutError
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    """MongoDB database connection manager"""
    
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect_to_database(cls, db_url: str, db_name: str):
        """Connect to MongoDB database"""
        try:
            logger.info(f"Connecting to MongoDB at {db_url}")
            cls.client = motor.motor_asyncio.AsyncIOMotorClient(
                db_url, 
                serverSelectionTimeoutMS=5000
            )
            
            # Check if connection is successful
            await cls.client.server_info()
            
            cls.db = cls.client[db_name]
            logger.info(f"Connected to MongoDB: {db_name}")
            
            # Create indexes for fast queries
            await cls.create_indexes()
            
            return cls.client
        except ServerSelectionTimeoutError:
            logger.error(f"Could not connect to MongoDB at {db_url}")
            raise
    
    @classmethod
    async def close_database_connection(cls):
        """Close MongoDB connection"""
        if cls.client is not None:  # Changed from 'if cls.client:'
            logger.info("Closing MongoDB connection")
            cls.client.close()
            cls.client = None
    
    @classmethod
    async def create_indexes(cls):
        """Create indexes for collections"""
        if cls.db is not None:  # Changed from 'if cls.db:'
            # Create index for meals collection
            await cls.db.meals.create_index("user_id")
            await cls.db.meals.create_index("meal_type")
            await cls.db.meals.create_index("created_at")
            
            # Create compound index for efficient user history queries
            await cls.db.meals.create_index([
                ("user_id", 1),
                ("created_at", -1)
            ])
            
            logger.info("Created MongoDB indexes")

# Singleton instance
db = Database()
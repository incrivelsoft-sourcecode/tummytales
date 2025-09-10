"""
Database connection and initialization using MongoEngine.
"""

import time
from typing import Optional
import mongoengine
from config.logger import get_logger

logger = get_logger(__name__)


def connect_with_retry(mongo_uri: str, max_retries: int = 3) -> bool:
    """
    Connect to MongoDB with retry logic and exponential backoff.
    
    Args:
        mongo_uri: MongoDB connection string
        max_retries: Maximum number of connection attempts
        
    Returns:
        bool: True if connection successful, False otherwise
    """
    for attempt in range(max_retries):
        try:
            mongoengine.connect(host=mongo_uri)
            logger.info(f"Successfully connected to MongoDB on attempt {attempt + 1}")
            return True
        except Exception as e:
            wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
            logger.warning(f"MongoDB connection attempt {attempt + 1} failed: {str(e)}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying connection in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"Failed to connect to MongoDB after {max_retries} attempts")
                
    return False


def ensure_indexes() -> None:
    """
    Ensure database indexes are created for all registered models.
    This should be called after all models are imported.
    """
    try:
        # Import all models to ensure they are registered
        from models.user_game_profile import UserGameProfile
        from models.flashcard import Flashcard
        from models.question import Question
        from models.quiz_session import QuizSession
        from models.answer import Answer
        from models.activity_log import ActivityLog
        from models.achievement import Achievement
        from models.similarity_index import SimilarityIndex
        
        # List of all document classes
        document_classes = [
            UserGameProfile,
            Flashcard,
            Question,
            QuizSession,
            Answer,
            ActivityLog,
            Achievement,
            SimilarityIndex
        ]
        
        # Ensure indexes for each model
        for doc_class in document_classes:
            try:
                doc_class.ensure_indexes()
                logger.debug(f"Ensured indexes for {doc_class.__name__}")
            except Exception as e:
                logger.warning(f"Failed to ensure indexes for {doc_class.__name__}: {str(e)}")
        
        logger.info("Database indexes ensured successfully")
        
    except Exception as e:
        logger.error(f"Failed to ensure database indexes: {str(e)}")
        # Don't raise the exception - let the app continue without indexes


def init_db(config) -> None:
    """
    Initialize database connection and setup.
    
    Args:
        config: Configuration object containing MONGO_URI
        
    Raises:
        ConnectionError: If unable to connect to database
    """
    logger.info("Initializing database connection...")
    
    if not hasattr(config, 'MONGO_URI'):
        raise ValueError("MONGO_URI not found in configuration")
    
    # Attempt to connect with retry logic
    if not connect_with_retry(config.MONGO_URI):
        raise ConnectionError("Unable to establish database connection")
    
    # Import models to register them with MongoEngine
    try:
        # Import all model modules here to ensure they're registered
        # This will be uncommented as models are created
        # from models.user_game_profile import UserGameProfile
        # from models.flashcard import Flashcard
        # from models.quiz import Quiz
        # from models.user_session import UserSession
        
        logger.info("Models imported successfully")
        
    except ImportError as e:
        logger.warning(f"Some models not yet available: {str(e)}")
    
    # Ensure indexes are created
    try:
        ensure_indexes()
    except Exception as e:
        logger.error(f"Failed to ensure database indexes: {str(e)}")
        # Don't raise here as this is not critical for startup
    
    logger.info("Database initialization completed")


def disconnect_db() -> None:
    """Disconnect from MongoDB."""
    try:
        mongoengine.disconnect()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {str(e)}")

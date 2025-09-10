"""
Test configuration and utilities for the Gamifier service tests.
Sets up test database, configurations, and common fixtures.
"""

import os
import pytest
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from mongoengine import connect, disconnect
from config.env_loader import get_config, Config
from config.logger import get_logger
from models.user_game_profile import UserGameProfile
from models.flashcard import Flashcard
from models.question import Question
from models.quiz_session import QuizSession
from models.answer import Answer
from models.activity_log import ActivityLog
from models.achievement import Achievement
from models.similarity_index import SimilarityIndex
from utils.time_utils import now_utc

logger = get_logger(__name__)

# Test database configuration
TEST_DB_NAME = "gamifier_test"
TEST_MONGO_URI = f"mongodb://localhost:27017/{TEST_DB_NAME}"


class TestConfig(Config):
    """Test-specific configuration that inherits from main Config."""
    
    def __init__(self, **kwargs):
        # Load from environment but override for tests
        base_config = get_config()
        
        # Override test-specific values
        super().__init__(
            MONGO_URI=kwargs.get('MONGO_URI', TEST_MONGO_URI),
            SECRET_KEY=kwargs.get('SECRET_KEY', base_config.SECRET_KEY),
            USER_SERVICE_URL=kwargs.get('USER_SERVICE_URL', base_config.USER_SERVICE_URL),
            PINECONE_API_KEY=kwargs.get('PINECONE_API_KEY', base_config.PINECONE_API_KEY),
            PINECONE_ENV=kwargs.get('PINECONE_ENV', base_config.PINECONE_ENV),
            PINECONE_INDEX_NAME=kwargs.get('PINECONE_INDEX_NAME', f"{base_config.PINECONE_INDEX_NAME}_test"),
            EMBEDDING_MODEL=kwargs.get('EMBEDDING_MODEL', base_config.EMBEDDING_MODEL),
            CLAUDE_API_KEY=kwargs.get('CLAUDE_API_KEY', base_config.CLAUDE_API_KEY),
            DEFAULT_TIMEZONE=kwargs.get('DEFAULT_TIMEZONE', base_config.DEFAULT_TIMEZONE),
            MAX_QUIZZES_PER_DAY=kwargs.get('MAX_QUIZZES_PER_DAY', 2),
            QUIZ_SESSION_MAX_MINUTES=kwargs.get('QUIZ_SESSION_MAX_MINUTES', 5),
            SIMILARITY_THRESHOLD=kwargs.get('SIMILARITY_THRESHOLD', 0.6),
            FLASK_ENV=kwargs.get('FLASK_ENV', 'testing')
        )


def get_test_config() -> TestConfig:
    """Get test configuration."""
    return TestConfig()


def setup_test_db():
    """Setup test database connection."""
    try:
        # Disconnect any existing connections
        disconnect()
        
        # Connect to test database
        connect(db=TEST_DB_NAME, host='localhost', port=27017)
        
        logger.info("Connected to test database", extra={
            "extra_fields": {
                "db_name": TEST_DB_NAME,
                "db_uri": TEST_MONGO_URI
            }
        })
        
        # Ensure indexes on all models
        ensure_test_indexes()
        
        return True
        
    except Exception as e:
        logger.error("Failed to setup test database", extra={
            "extra_fields": {
                "error": str(e),
                "db_name": TEST_DB_NAME
            }
        })
        return False


def teardown_test_db():
    """Cleanup test database."""
    try:
        # Clean all test collections
        clean_test_data()
        
        # Disconnect
        disconnect()
        
        logger.info("Test database cleaned and disconnected", extra={
            "extra_fields": {
                "db_name": TEST_DB_NAME
            }
        })
        
    except Exception as e:
        logger.error("Failed to teardown test database", extra={
            "extra_fields": {
                "error": str(e),
                "db_name": TEST_DB_NAME
            }
        })


def clean_test_data():
    """Clean all test data from collections."""
    collections_to_clean = [
        UserGameProfile,
        Flashcard,
        Question,
        QuizSession,
        Answer,
        ActivityLog,
        Achievement,
        SimilarityIndex
    ]
    
    for collection in collections_to_clean:
        try:
            count = collection.objects.count()
            if count > 0:
                collection.drop_collection()
                logger.debug(f"Cleaned {count} documents from {collection.__name__}")
        except Exception as e:
            logger.warning(f"Failed to clean {collection.__name__}: {str(e)}")


def ensure_test_indexes():
    """Ensure all required indexes exist for testing."""
    try:
        # Index creation for each model
        UserGameProfile.ensure_indexes()
        Flashcard.ensure_indexes()
        Question.ensure_indexes()
        QuizSession.ensure_indexes()
        Answer.ensure_indexes()
        ActivityLog.ensure_indexes()
        Achievement.ensure_indexes()
        SimilarityIndex.ensure_indexes()
        
        logger.info("All test indexes ensured")
        
    except Exception as e:
        logger.error("Failed to ensure test indexes", extra={
            "extra_fields": {
                "error": str(e)
            }
        })


def create_test_user_profile(user_id: str, **kwargs) -> UserGameProfile:
    """
    Create a test user profile with sensible defaults.
    
    Args:
        user_id: User ID for the profile
        **kwargs: Override default values
        
    Returns:
        UserGameProfile: Created user profile
    """
    defaults = {
        'user_id': user_id,
        'timezone': 'America/Chicago',
        'current_week': 1,
        'points': {'lifetime': 0, 'today': 0},
        'limits': {
            'quizzes_today': 0,
            'flips_today': 0,
            'last_reset_at': now_utc()
        },
        'current_streak': 0,
        'longest_streak': 0,
        'badges': [],
        'created_at': now_utc(),
        'updated_at': now_utc()
    }
    
    # Merge with overrides
    defaults.update(kwargs)
    
    profile = UserGameProfile(**defaults)
    profile.save()
    
    logger.debug("Created test user profile", extra={
        "extra_fields": {
            "user_id": user_id,
            "current_week": profile.current_week,
            "points": profile.points
        }
    })
    
    return profile


def create_test_flashcard(user_id: str, week: int = 1, **kwargs) -> Flashcard:
    """
    Create a test flashcard with sensible defaults.
    
    Args:
        user_id: User ID for the flashcard
        week: Week number
        **kwargs: Override default values
        
    Returns:
        Flashcard: Created flashcard
    """
    defaults = {
        'user_id': user_id,
        'week': week,
        'section': 'test_section',
        'difficulty': 'medium',
        'front_text': f'Test flashcard front for week {week}',
        'back_text': f'Test flashcard back for week {week}',
        'xml': f'<flashcard><front>Test front {week}</front><back>Test back {week}</back></flashcard>',
        'rag_chunk_ids': [],
        'embedding_vector': [0.1] * 384,  # Standard embedding dimension
        'created_at': now_utc()
    }
    
    defaults.update(kwargs)
    
    flashcard = Flashcard(**defaults)
    flashcard.save()
    
    return flashcard


def create_test_question(user_id: str, week: int = 1, **kwargs) -> Question:
    """
    Create a test question with sensible defaults.
    
    Args:
        user_id: User ID for the question
        week: Week number
        **kwargs: Override default values
        
    Returns:
        Question: Created question
    """
    defaults = {
        'user_id': user_id,
        'week': week,
        'section': 'test_section',
        'difficulty': 'medium',
        'text': f'Test question for week {week}?',
        'option_a': 'Option A',
        'option_b': 'Option B',
        'option_c': 'Option C',
        'option_d': 'Option D',
        'correct_option': 'A',
        'explanation': 'Test explanation',
        'xml': f'<question><text>Test question {week}</text><options><a>A</a><b>B</b><c>C</c><d>D</d></options><answer>A</answer></question>',
        'rag_chunk_ids': [],
        'embedding_vector': [0.1] * 384,
        'created_at': now_utc()
    }
    
    defaults.update(kwargs)
    
    question = Question(**defaults)
    question.save()
    
    return question


def create_test_quiz_session(user_id: str, **kwargs) -> QuizSession:
    """
    Create a test quiz session with sensible defaults.
    
    Args:
        user_id: User ID for the session
        **kwargs: Override default values
        
    Returns:
        QuizSession: Created quiz session
    """
    now = now_utc()
    defaults = {
        'user_id': user_id,
        'difficulty_selected': 'medium',
        'week_at_start': 1,
        'status': 'started',
        'started_at': now,
        'timeout_at': now + timedelta(minutes=5),
        'total_questions': 3,
        'questions': [],
        'answer_attempts': []
    }
    
    defaults.update(kwargs)
    
    session = QuizSession(**defaults)
    session.save()
    
    return session


# Pytest fixtures
@pytest.fixture(scope='function')
def test_db():
    """Fixture to setup and teardown test database for each test."""
    setup_test_db()
    yield
    teardown_test_db()


@pytest.fixture(scope='function')
def test_config():
    """Fixture to provide test configuration."""
    return get_test_config()


@pytest.fixture(scope='function')
def test_user_profile(test_db):
    """Fixture to create a test user profile."""
    user_id = "test_user_123"
    profile = create_test_user_profile(user_id)
    yield profile
    # Cleanup handled by test_db fixture


@pytest.fixture(scope='function')
def test_users(test_db):
    """Fixture to create multiple test users for comprehensive testing."""
    users = []
    
    # User 1: Early pregnancy
    user1 = create_test_user_profile(
        "user_001",
        current_week=8,
        points={'lifetime': 50, 'today': 10},
        current_streak=3
    )
    users.append(user1)
    
    # User 2: Mid pregnancy 
    user2 = create_test_user_profile(
        "user_002", 
        current_week=20,
        points={'lifetime': 150, 'today': 25},
        current_streak=7
    )
    users.append(user2)
    
    # User 3: Late pregnancy
    user3 = create_test_user_profile(
        "user_003",
        current_week=35,
        points={'lifetime': 300, 'today': 0},
        current_streak=0
    )
    users.append(user3)
    
    yield users
    # Cleanup handled by test_db fixture

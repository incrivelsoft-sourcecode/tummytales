"""
Environment configuration loader with validation.
"""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


@dataclass
class Config:
    """Configuration class with typed fields for all environment variables."""
    MONGO_URI: str
    SECRET_KEY: str
    USER_SERVICE_URL: str
    PINECONE_API_KEY: str
    PINECONE_ENV: str
    PINECONE_INDEX_NAME: str
    EMBEDDING_MODEL: str
    CLAUDE_API_KEY: str
    DEFAULT_TIMEZONE: str
    MAX_QUIZZES_PER_DAY: int
    QUIZ_SESSION_MAX_MINUTES: int
    SIMILARITY_THRESHOLD: float
    FLASK_ENV: str


def _get_required_env(key: str) -> str:
    """Get required environment variable or raise error if missing."""
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Required environment variable '{key}' is not set")
    return value


def _get_optional_env(key: str, default: str) -> str:
    """Get optional environment variable with default value."""
    return os.getenv(key, default)


def _get_int_env(key: str, default: int) -> int:
    """Get integer environment variable with default value."""
    try:
        return int(os.getenv(key, str(default)))
    except ValueError:
        raise ValueError(f"Environment variable '{key}' must be a valid integer")


def _get_float_env(key: str, default: float) -> float:
    """Get float environment variable with default value."""
    try:
        return float(os.getenv(key, str(default)))
    except ValueError:
        raise ValueError(f"Environment variable '{key}' must be a valid float")


def get_config() -> Config:
    """
    Load and validate all environment variables.
    
    Returns:
        Config: Configuration object with all validated environment variables
        
    Raises:
        ValueError: If any required environment variables are missing or invalid
    """
    try:
        config = Config(
            MONGO_URI=_get_required_env("MONGO_URI"),
            SECRET_KEY=_get_required_env("SECRET_KEY"),
            USER_SERVICE_URL=_get_required_env("USER_SERVICE_URL"),
            PINECONE_API_KEY=_get_required_env("PINECONE_API_KEY"),
            PINECONE_ENV=_get_required_env("PINECONE_ENV"),
            PINECONE_INDEX_NAME=_get_required_env("PINECONE_INDEX_NAME"),
            EMBEDDING_MODEL=_get_optional_env("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
            CLAUDE_API_KEY=_get_required_env("CLAUDE_API_KEY"),
            DEFAULT_TIMEZONE=_get_optional_env("DEFAULT_TIMEZONE", "America/Chicago"),
            MAX_QUIZZES_PER_DAY=_get_int_env("MAX_QUIZZES_PER_DAY", 2),
            QUIZ_SESSION_MAX_MINUTES=_get_int_env("QUIZ_SESSION_MAX_MINUTES", 5),
            SIMILARITY_THRESHOLD=_get_float_env("SIMILARITY_THRESHOLD", 0.6),
            FLASK_ENV=_get_optional_env("FLASK_ENV", "development")
        )
        
        # Additional validation
        if config.SIMILARITY_THRESHOLD < 0 or config.SIMILARITY_THRESHOLD > 1:
            raise ValueError("SIMILARITY_THRESHOLD must be between 0 and 1")
            
        if config.MAX_QUIZZES_PER_DAY < 0:
            raise ValueError("MAX_QUIZZES_PER_DAY must be non-negative")
            
        if config.QUIZ_SESSION_MAX_MINUTES < 1:
            raise ValueError("QUIZ_SESSION_MAX_MINUTES must be at least 1")
        
        return config
        
    except Exception as e:
        raise ValueError(f"Configuration error: {str(e)}")

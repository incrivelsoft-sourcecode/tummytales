"""
Similarity service for detecting duplicate content using cosine similarity.
Prevents generation of similar quiz questions and flashcards for users.
"""

import hashlib
from typing import List, Optional
import numpy as np
from datetime import datetime

from models.similarity_index import SimilarityIndex, CONTENT_TYPES
from utils.constants import SIMILARITY_THRESHOLD
from config.logger import get_logger

logger = get_logger(__name__)


def is_duplicate(candidate_vector: List[float], user_id: str, week: int, 
                 content_type: str, threshold: float = SIMILARITY_THRESHOLD) -> bool:
    """
    Check if a candidate vector is too similar to existing vectors for the user.
    
    Args:
        candidate_vector: The embedding vector to check for duplicates
        user_id: The user ID to check against
        week: The pregnancy week to check within
        content_type: Type of content ('flashcard' or 'quiz')
        threshold: Similarity threshold (default from constants)
        
    Returns:
        bool: True if candidate is a duplicate (similarity >= threshold), False otherwise
    """
    try:
        # Validate inputs
        if not candidate_vector:
            logger.warning(
                "Empty candidate vector provided",
                extra={
                    "extra_fields": {
                        "user_id": user_id,
                        "week": week,
                        "content_type": content_type
                    }
                }
            )
            return False
        
        if not user_id or not user_id.strip():
            logger.warning("Empty user_id provided for duplicate check")
            return False
        
        if week < 1 or week > 40:
            logger.warning(f"Invalid week provided: {week}")
            return False
        
        if content_type not in CONTENT_TYPES.values():
            logger.warning(f"Invalid content_type provided: {content_type}")
            return False
        
        if not 0 <= threshold <= 1:
            logger.warning(f"Invalid threshold provided: {threshold}")
            threshold = SIMILARITY_THRESHOLD
        
        logger.debug(
            "Checking for duplicate content",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "threshold": threshold,
                    "vector_dimension": len(candidate_vector)
                }
            }
        )
        
        # Fetch existing vectors for the user/week/content_type
        existing_vectors = SimilarityIndex.fetch_vectors_for_user_week(
            user_id=user_id,
            week=week,
            content_type=content_type
        )
        
        if not existing_vectors:
            logger.debug(
                "No existing vectors found, not a duplicate",
                extra={
                    "extra_fields": {
                        "user_id": user_id,
                        "week": week,
                        "content_type": content_type
                    }
                }
            )
            return False
        
        # Convert candidate vector to numpy array for efficient computation
        candidate_np = np.array(candidate_vector, dtype=np.float32)
        
        # Check if vector dimensions match
        if len(existing_vectors) > 0:
            expected_dim = len(existing_vectors[0])
            if len(candidate_vector) != expected_dim:
                logger.error(
                    f"Vector dimension mismatch: candidate={len(candidate_vector)}, expected={expected_dim}",
                    extra={
                        "extra_fields": {
                            "user_id": user_id,
                            "week": week,
                            "content_type": content_type
                        }
                    }
                )
                return False
        
        # Compute cosine similarity with all existing vectors
        max_similarity = 0.0
        similar_count = 0
        
        for existing_vector in existing_vectors:
            try:
                # Convert to numpy array
                existing_np = np.array(existing_vector, dtype=np.float32)
                
                # Compute cosine similarity
                similarity = _cosine_similarity(candidate_np, existing_np)
                
                if similarity >= threshold:
                    similar_count += 1
                    logger.info(
                        "Duplicate content detected",
                        extra={
                            "extra_fields": {
                                "user_id": user_id,
                                "week": week,
                                "content_type": content_type,
                                "similarity": float(similarity),
                                "threshold": threshold
                            }
                        }
                    )
                    return True
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    
            except Exception as e:
                logger.warning(
                    f"Failed to compute similarity for one vector: {e}",
                    extra={
                        "extra_fields": {
                            "user_id": user_id,
                            "week": week,
                            "content_type": content_type
                        }
                    }
                )
                continue
        
        logger.debug(
            "Duplicate check completed",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "max_similarity": float(max_similarity),
                    "threshold": threshold,
                    "vectors_checked": len(existing_vectors),
                    "is_duplicate": False
                }
            }
        )
        
        return False
        
    except Exception as e:
        logger.error(
            "Error during duplicate check",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        # In case of error, assume not duplicate to avoid blocking content generation
        return False


def add_to_index(user_id: str, week: int, content_type: str, 
                 vector: List[float], text_hash: Optional[str] = None) -> bool:
    """
    Add a new embedding vector to the similarity index.
    
    Args:
        user_id: The user ID
        week: The pregnancy week (1-40)
        content_type: Type of content ('flashcard' or 'quiz')
        vector: The embedding vector to store
        text_hash: Optional hash of the original text content
        
    Returns:
        bool: True if successfully added, False otherwise
    """
    try:
        # Validate inputs
        if not vector:
            logger.error("Empty vector provided for indexing")
            return False
        
        if not user_id or not user_id.strip():
            logger.error("Empty user_id provided for indexing")
            return False
        
        if week < 1 or week > 40:
            logger.error(f"Invalid week provided: {week}")
            return False
        
        if content_type not in CONTENT_TYPES.values():
            logger.error(f"Invalid content_type provided: {content_type}")
            return False
        
        # Generate text hash if not provided
        if not text_hash:
            # Create a hash from the vector (as fallback)
            vector_str = ','.join(map(str, vector))
            text_hash = hashlib.md5(vector_str.encode()).hexdigest()
        
        logger.info(
            "Adding vector to similarity index",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "vector_dimension": len(vector),
                    "text_hash": text_hash
                }
            }
        )
        
        # Add to similarity index
        similarity_index = SimilarityIndex.add_vector(
            user_id=user_id,
            week=week,
            content_type=content_type,
            text_hash=text_hash,
            embedding_vector=vector
        )
        
        if similarity_index:
            logger.info(
                "Successfully added vector to similarity index",
                extra={
                    "extra_fields": {
                        "user_id": user_id,
                        "week": week,
                        "content_type": content_type,
                        "index_id": str(similarity_index.id)
                    }
                }
            )
            return True
        else:
            logger.error(
                "Failed to add vector to similarity index",
                extra={
                    "extra_fields": {
                        "user_id": user_id,
                        "week": week,
                        "content_type": content_type
                    }
                }
            )
            return False
        
    except Exception as e:
        logger.error(
            "Error adding vector to similarity index",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return False


def get_recent_vectors(user_id: str, week: int, content_type: str, 
                      limit: int = 200) -> List[List[float]]:
    """
    Get recent vectors for a user, optimized for performance by limiting the number of vectors.
    
    Args:
        user_id: The user ID
        week: The pregnancy week (used for logging, but fetches across all weeks)
        content_type: Type of content ('flashcard' or 'quiz')
        limit: Maximum number of recent vectors to return (default: 200)
        
    Returns:
        List of embedding vectors (each vector is a list of floats)
    """
    try:
        # Validate inputs
        if not user_id or not user_id.strip():
            logger.warning("Empty user_id provided for get_recent_vectors")
            return []
        
        if content_type not in CONTENT_TYPES.values():
            logger.warning(f"Invalid content_type provided: {content_type}")
            return []
        
        if limit <= 0:
            logger.warning(f"Invalid limit provided: {limit}")
            limit = 200
        
        logger.debug(
            "Fetching recent vectors for user",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "limit": limit
                }
            }
        )
        
        # Use the optimized method that samples across all weeks
        recent_vectors = SimilarityIndex.fetch_recent_vectors_for_user(
            user_id=user_id,
            content_type=content_type,
            limit=limit
        )
        
        logger.debug(
            "Retrieved recent vectors",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "vectors_returned": len(recent_vectors),
                    "limit": limit
                }
            }
        )
        
        return recent_vectors
        
    except Exception as e:
        logger.error(
            "Error fetching recent vectors",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return []


def is_duplicate_optimized(candidate_vector: List[float], user_id: str, week: int,
                          content_type: str, threshold: float = SIMILARITY_THRESHOLD,
                          max_vectors: int = 200) -> bool:
    """
    Optimized duplicate check that samples recent vectors instead of checking all vectors.
    This is more efficient for users with many vectors.
    
    Args:
        candidate_vector: The embedding vector to check for duplicates
        user_id: The user ID to check against
        week: The pregnancy week (for logging)
        content_type: Type of content ('flashcard' or 'quiz')
        threshold: Similarity threshold (default from constants)
        max_vectors: Maximum number of recent vectors to check (default: 200)
        
    Returns:
        bool: True if candidate is a duplicate (similarity >= threshold), False otherwise
    """
    try:
        # Validate inputs
        if not candidate_vector:
            logger.warning("Empty candidate vector provided for optimized duplicate check")
            return False
        
        if not user_id or not user_id.strip():
            logger.warning("Empty user_id provided for optimized duplicate check")
            return False
        
        if content_type not in CONTENT_TYPES.values():
            logger.warning(f"Invalid content_type provided: {content_type}")
            return False
        
        logger.debug(
            "Performing optimized duplicate check",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "threshold": threshold,
                    "max_vectors": max_vectors,
                    "vector_dimension": len(candidate_vector)
                }
            }
        )
        
        # Get recent vectors (limited for performance)
        recent_vectors = get_recent_vectors(
            user_id=user_id,
            week=week,
            content_type=content_type,
            limit=max_vectors
        )
        
        if not recent_vectors:
            logger.debug("No recent vectors found, not a duplicate")
            return False
        
        # Convert candidate vector to numpy array
        candidate_np = np.array(candidate_vector, dtype=np.float32)
        
        # Check similarity against recent vectors
        max_similarity = 0.0
        for existing_vector in recent_vectors:
            try:
                existing_np = np.array(existing_vector, dtype=np.float32)
                similarity = _cosine_similarity(candidate_np, existing_np)
                
                if similarity >= threshold:
                    logger.info(
                        "Duplicate content detected (optimized check)",
                        extra={
                            "extra_fields": {
                                "user_id": user_id,
                                "week": week,
                                "content_type": content_type,
                                "similarity": float(similarity),
                                "threshold": threshold,
                                "vectors_checked": len(recent_vectors)
                            }
                        }
                    )
                    return True
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    
            except Exception as e:
                logger.warning(f"Failed to compute similarity for one vector: {e}")
                continue
        
        logger.debug(
            "Optimized duplicate check completed",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "max_similarity": float(max_similarity),
                    "threshold": threshold,
                    "vectors_checked": len(recent_vectors),
                    "is_duplicate": False
                }
            }
        )
        
        return False
        
    except Exception as e:
        logger.error(
            "Error during optimized duplicate check",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return False


def _cosine_similarity(vector1: np.ndarray, vector2: np.ndarray) -> float:
    """
    Compute cosine similarity between two vectors using numpy.
    
    Args:
        vector1: First vector as numpy array
        vector2: Second vector as numpy array
        
    Returns:
        float: Cosine similarity score (0 to 1)
    """
    try:
        # Normalize vectors
        norm1 = np.linalg.norm(vector1)
        norm2 = np.linalg.norm(vector2)
        
        # Handle zero vectors
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        
        # Compute cosine similarity
        similarity = np.dot(vector1, vector2) / (norm1 * norm2)
        
        # Ensure result is in valid range [0, 1]
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return similarity
        
    except Exception as e:
        logger.warning(f"Error computing cosine similarity: {e}")
        return 0.0


def cleanup_old_vectors(user_id: str, content_type: str, keep_recent: int = 1000) -> int:
    """
    Clean up old vectors for a user to prevent unlimited growth.
    This is a maintenance function that should be called periodically.
    
    Args:
        user_id: The user ID
        content_type: Type of content ('flashcard' or 'quiz')
        keep_recent: Number of recent vectors to keep (default: 1000)
        
    Returns:
        int: Number of vectors deleted
    """
    try:
        logger.info(
            "Cleaning up old vectors",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "keep_recent": keep_recent
                }
            }
        )
        
        deleted_count = SimilarityIndex.cleanup_old_vectors(
            user_id=user_id,
            content_type=content_type,
            keep_recent=keep_recent
        )
        
        logger.info(
            "Vector cleanup completed",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "deleted_count": deleted_count
                }
            }
        )
        
        return deleted_count
        
    except Exception as e:
        logger.error(
            "Error during vector cleanup",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return 0


def check_duplicate_with_details(candidate_vector: List[float], user_id: str, week: int, 
                                 content_type: str, threshold: float = SIMILARITY_THRESHOLD) -> dict:
    """
    Check if a candidate vector is too similar to existing vectors and return detailed information.
    
    Args:
        candidate_vector: The embedding vector to check for duplicates
        user_id: The user ID to check against
        week: The pregnancy week to check within
        content_type: Type of content ('flashcard' or 'quiz')
        threshold: Similarity threshold (default from constants)
        
    Returns:
        dict: {
            'is_duplicate': bool,
            'max_similarity': float,
            'similarity_scores': List[float],
            'duplicate_count': int,
            'reason': str
        }
    """
    try:
        # Validate inputs
        if not candidate_vector:
            return {
                'is_duplicate': False,
                'max_similarity': 0.0,
                'similarity_scores': [],
                'duplicate_count': 0,
                'reason': 'Empty candidate vector'
            }
        
        if not user_id or not user_id.strip():
            return {
                'is_duplicate': False,
                'max_similarity': 0.0,
                'similarity_scores': [],
                'duplicate_count': 0,
                'reason': 'Empty user_id'
            }
        
        if week < 1 or week > 40:
            return {
                'is_duplicate': False,
                'max_similarity': 0.0,
                'similarity_scores': [],
                'duplicate_count': 0,
                'reason': f'Invalid week: {week}'
            }
        
        if content_type not in CONTENT_TYPES.values():
            return {
                'is_duplicate': False,
                'max_similarity': 0.0,
                'similarity_scores': [],
                'duplicate_count': 0,
                'reason': f'Invalid content_type: {content_type}'
            }
        
        logger.debug(
            "Checking for duplicate content with details",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "threshold": threshold,
                    "vector_dimension": len(candidate_vector)
                }
            }
        )
        
        # Fetch existing vectors for the user/week/content_type
        existing_vectors = SimilarityIndex.fetch_vectors_for_user_week(
            user_id=user_id,
            week=week,
            content_type=content_type
        )
        
        if not existing_vectors:
            return {
                'is_duplicate': False,
                'max_similarity': 0.0,
                'similarity_scores': [],
                'duplicate_count': 0,
                'reason': 'No existing vectors found'
            }
        
        # Convert candidate vector to numpy array for efficient computation
        candidate_np = np.array(candidate_vector, dtype=np.float32)
        
        # Check if vector dimensions match
        if len(existing_vectors) > 0:
            expected_dim = len(existing_vectors[0])
            if len(candidate_vector) != expected_dim:
                return {
                    'is_duplicate': False,
                    'max_similarity': 0.0,
                    'similarity_scores': [],
                    'duplicate_count': 0,
                    'reason': f'Vector dimension mismatch: candidate={len(candidate_vector)}, expected={expected_dim}'
                }
        
        # Compute cosine similarity with all existing vectors
        similarity_scores = []
        duplicate_count = 0
        max_similarity = 0.0
        
        for existing_vector in existing_vectors:
            try:
                # Convert to numpy array
                existing_np = np.array(existing_vector, dtype=np.float32)
                
                # Compute cosine similarity
                similarity = _cosine_similarity(candidate_np, existing_np)
                similarity_scores.append(float(similarity))
                
                if similarity >= threshold:
                    duplicate_count += 1
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    
            except Exception as e:
                logger.warning(
                    f"Failed to compute similarity for one vector: {e}",
                    extra={
                        "extra_fields": {
                            "user_id": user_id,
                            "week": week,
                            "content_type": content_type
                        }
                    }
                )
                continue
        
        is_duplicate = duplicate_count > 0
        reason = f"Found {duplicate_count} vectors above threshold {threshold}" if is_duplicate else "No duplicates detected"
        
        logger.debug(
            "Duplicate check completed with details",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "is_duplicate": is_duplicate,
                    "max_similarity": max_similarity,
                    "duplicate_count": duplicate_count,
                    "total_comparisons": len(similarity_scores)
                }
            }
        )
        
        return {
            'is_duplicate': is_duplicate,
            'max_similarity': max_similarity,
            'similarity_scores': similarity_scores,
            'duplicate_count': duplicate_count,
            'reason': reason
        }
        
    except Exception as e:
        logger.error(
            "Error checking duplicate with details",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "week": week,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return {
            'is_duplicate': False,
            'max_similarity': 0.0,
            'similarity_scores': [],
            'duplicate_count': 0,
            'reason': f'Error during check: {str(e)}'
        }


def get_similarity_stats(user_id: str, content_type: Optional[str] = None) -> dict:
    """
    Get statistics about similarity vectors for a user.
    
    Args:
        user_id: The user ID
        content_type: Optional content type filter
        
    Returns:
        dict: Statistics about the user's vectors
    """
    try:
        stats = {
            "user_id": user_id,
            "content_type": content_type,
            "total_vectors": 0,
            "by_content_type": {}
        }
        
        if content_type:
            # Get stats for specific content type
            count = SimilarityIndex.get_user_vector_count(user_id, content_type)
            stats["total_vectors"] = count
            stats["by_content_type"][content_type] = count
        else:
            # Get stats for all content types
            for ct in CONTENT_TYPES.values():
                count = SimilarityIndex.get_user_vector_count(user_id, ct)
                stats["by_content_type"][ct] = count
                stats["total_vectors"] += count
        
        logger.debug(
            "Retrieved similarity stats",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "stats": stats
                }
            }
        )
        
        return stats
        
    except Exception as e:
        logger.error(
            "Error retrieving similarity stats",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "error": str(e)
                }
            }
        )
        return {
            "user_id": user_id,
            "content_type": content_type,
            "total_vectors": 0,
            "by_content_type": {},
            "error": str(e)
        }

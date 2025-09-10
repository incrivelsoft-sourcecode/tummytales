"""
Unit tests for similarity service.
Tests duplicate detection functionality with synthetic vectors.
"""

import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from services.similarity_service import is_duplicate, add_to_index, get_recent_vectors, check_duplicate_with_details
from models.similarity_index import SimilarityIndex
from utils.constants import SIMILARITY_THRESHOLD
from tests.conftest import test_db


class TestSimilarityService:
    """Test cases for similarity service."""
    
    def test_is_duplicate_identical_vectors(self, test_db):
        """Test that identical vectors are detected as duplicates."""
        user_id = "test_similarity_001"
        week = 12
        content_type = "flashcard"
        
        # Create base vector in similarity index
        base_vector = [0.5, 0.6, 0.7, 0.8]
        add_to_index(user_id, week, content_type, base_vector, "hash123")
        
        # Test with identical vector
        identical_vector = [0.5, 0.6, 0.7, 0.8]
        result = is_duplicate(identical_vector, user_id, week, content_type)
        
        assert result is True, "Identical vectors should be detected as duplicates"
    
    def test_is_duplicate_very_similar_vectors(self, test_db):
        """Test that very similar vectors are detected as duplicates."""
        user_id = "test_similarity_002"
        week = 15
        content_type = "quiz"
        
        # Create base vector
        base_vector = [0.5, 0.6, 0.7, 0.8]
        add_to_index(user_id, week, content_type, base_vector, "hash456")
        
        # Test with very similar vector (slight variation)
        similar_vector = [0.51, 0.59, 0.71, 0.79]
        result = is_duplicate(similar_vector, user_id, week, content_type, threshold=0.95)
        
        assert result is True, "Very similar vectors should be detected as duplicates"
    
    def test_is_duplicate_different_vectors(self, test_db):
        """Test that different vectors are not detected as duplicates."""
        user_id = "test_similarity_003"
        week = 20
        content_type = "flashcard"
        
        # Create base vector (pointing in positive x direction)
        base_vector = [1.0, 0.0, 0.0, 0.0]
        add_to_index(user_id, week, content_type, base_vector, "hash789")
        
        # Test with orthogonal vector (pointing in y direction, should have ~0 similarity)
        different_vector = [0.0, 1.0, 0.0, 0.0]
        result = is_duplicate(different_vector, user_id, week, content_type)
        
        assert result is False, "Different vectors should not be detected as duplicates"
    
    def test_is_duplicate_no_existing_vectors(self, test_db):
        """Test duplicate detection when no vectors exist for user/week/type."""
        user_id = "test_similarity_004"
        week = 25
        content_type = "quiz"
        
        # Test with vector when no existing vectors
        test_vector = [0.3, 0.4, 0.5, 0.6]
        result = is_duplicate(test_vector, user_id, week, content_type)
        
        assert result is False, "Should not be duplicate when no existing vectors"
    
    def test_is_duplicate_different_threshold(self, test_db):
        """Test duplicate detection with different similarity thresholds."""
        user_id = "test_similarity_005"
        week = 8
        content_type = "flashcard"
        
        # Create base vector
        base_vector = [0.5, 0.5, 0.5, 0.5]
        add_to_index(user_id, week, content_type, base_vector, "hashABC")
        
        # Test with moderately similar vector
        similar_vector = [0.6, 0.6, 0.4, 0.4]  # Will have moderate cosine similarity
        
        # Test with high threshold (should not be duplicate)
        result_high = is_duplicate(similar_vector, user_id, week, content_type, threshold=0.99)
        assert result_high is False, "Should not be duplicate with very high threshold"
        
        # Test with low threshold (should be duplicate)
        result_low = is_duplicate(similar_vector, user_id, week, content_type, threshold=0.5)
        assert result_low is True, "Should be duplicate with low threshold"
    
    def test_is_duplicate_different_user(self, test_db):
        """Test that vectors from different users don't interfere."""
        week = 10
        content_type = "quiz"
        
        # Create vector for user 1
        user1 = "test_user_001"
        base_vector = [0.7, 0.6, 0.5, 0.4]
        add_to_index(user1, week, content_type, base_vector, "user1hash")
        
        # Test duplicate detection for user 2 with identical vector
        user2 = "test_user_002"
        identical_vector = [0.7, 0.6, 0.5, 0.4]
        result = is_duplicate(identical_vector, user2, week, content_type)
        
        assert result is False, "Should not be duplicate for different user"
    
    def test_is_duplicate_different_week(self, test_db):
        """Test that vectors from different weeks don't interfere."""
        user_id = "test_similarity_006"
        content_type = "flashcard"
        
        # Create vector for week 5
        week1 = 5
        base_vector = [0.8, 0.7, 0.6, 0.5]
        add_to_index(user_id, week1, content_type, base_vector, "week5hash")
        
        # Test duplicate detection for week 6 with identical vector
        week2 = 6
        identical_vector = [0.8, 0.7, 0.6, 0.5]
        result = is_duplicate(identical_vector, user_id, week2, content_type)
        
        assert result is False, "Should not be duplicate for different week"
    
    def test_is_duplicate_different_content_type(self, test_db):
        """Test that vectors from different content types don't interfere."""
        user_id = "test_similarity_007"
        week = 18
        
        # Create vector for flashcard content
        base_vector = [0.9, 0.8, 0.7, 0.6]
        add_to_index(user_id, week, "flashcard", base_vector, "flashcardhash")
        
        # Test duplicate detection for quiz content with identical vector
        identical_vector = [0.9, 0.8, 0.7, 0.6]
        result = is_duplicate(identical_vector, user_id, week, "quiz")
        
        assert result is False, "Should not be duplicate for different content type"
    
    def test_add_to_index_basic(self, test_db):
        """Test basic functionality of add_to_index."""
        user_id = "test_add_001"
        week = 14
        content_type = "quiz"
        vector = [0.2, 0.3, 0.4, 0.5]
        text_hash = "testhash123"
        
        # Add vector to index
        add_to_index(user_id, week, content_type, vector, text_hash)
        
        # Verify it was added
        indexes = SimilarityIndex.objects(
            user_id=user_id,
            week=week,
            content_type=content_type
        )
        
        assert indexes.count() == 1
        index = indexes.first()
        assert index.text_hash == text_hash
        assert index.embedding_vector == vector
    
    def test_add_to_index_without_hash(self, test_db):
        """Test add_to_index when text_hash is not provided."""
        user_id = "test_add_002"
        week = 22
        content_type = "flashcard"
        vector = [0.1, 0.4, 0.7, 0.9]
        
        # Add vector without text_hash
        add_to_index(user_id, week, content_type, vector)
        
        # Verify it was added
        indexes = SimilarityIndex.objects(
            user_id=user_id,
            week=week,
            content_type=content_type
        )
        
        assert indexes.count() == 1
        index = indexes.first()
        assert index.embedding_vector == vector
    
    def test_get_recent_vectors_basic(self, test_db):
        """Test get_recent_vectors functionality."""
        user_id = "test_recent_001"
        week = 16
        content_type = "quiz"
        
        # Add multiple vectors
        vectors = [
            [0.1, 0.2, 0.3, 0.4],
            [0.2, 0.3, 0.4, 0.5],
            [0.3, 0.4, 0.5, 0.6]
        ]
        
        for i, vector in enumerate(vectors):
            add_to_index(user_id, week, content_type, vector, f"hash{i}")
        
        # Get recent vectors
        recent_vectors = get_recent_vectors(user_id, week, content_type)
        
        assert len(recent_vectors) == 3
        assert all(isinstance(v, list) for v in recent_vectors)
    
    def test_check_duplicate_with_details(self, test_db):
        """Test check_duplicate_with_details for detailed similarity information."""
        user_id = "test_details_001"
        week = 13
        content_type = "flashcard"
        
        # Create base vector
        base_vector = [1.0, 0.0, 0.0, 0.0]  # Unit vector for easy calculation
        add_to_index(user_id, week, content_type, base_vector, "basehash")
        
        # Test with known similarity vector
        test_vector = [0.8, 0.6, 0.0, 0.0]  # Will have calculable cosine similarity
        
        result = check_duplicate_with_details(
            test_vector, user_id, week, content_type, threshold=0.5
        )
        
        assert isinstance(result, dict)
        assert 'is_duplicate' in result
        assert 'max_similarity' in result
        assert 'similarity_scores' in result
        assert 'duplicate_count' in result
        assert 'reason' in result
        
        is_dup = result['is_duplicate']
        max_similarity = result['max_similarity']
        
        assert isinstance(is_dup, bool)
        assert isinstance(max_similarity, float)
        assert 0.0 <= max_similarity <= 1.0
        
    def test_cosine_similarity_calculation(self, test_db):
        """Test cosine similarity calculation with known vectors."""
        user_id = "test_cosine_001"
        week = 11
        content_type = "quiz"
        
        # Create orthogonal vectors (should have 0 similarity)
        vector1 = [1.0, 0.0, 0.0, 0.0]
        vector2 = [0.0, 1.0, 0.0, 0.0]
        
        add_to_index(user_id, week, content_type, vector1, "ortho1")
        
        result = is_duplicate(vector2, user_id, week, content_type, threshold=0.1)
        assert result is False, "Orthogonal vectors should have low similarity"
        
        # Test with parallel vectors (should have 1.0 similarity)
        vector3 = [1.0, 0.0, 0.0, 0.0]  # Same as vector1
        result = is_duplicate(vector3, user_id, week, content_type, threshold=0.99)
        assert result is True, "Parallel vectors should have high similarity"
    
    def test_multiple_similar_vectors(self, test_db):
        """Test behavior when multiple similar vectors exist."""
        user_id = "test_multiple_001"
        week = 9
        content_type = "flashcard"
        
        # Add multiple similar vectors
        base_vectors = [
            [0.5, 0.5, 0.5, 0.5],
            [0.6, 0.6, 0.4, 0.4],
            [0.7, 0.3, 0.7, 0.3]
        ]
        
        for i, vector in enumerate(base_vectors):
            add_to_index(user_id, week, content_type, vector, f"multi{i}")
        
        # Test with vector similar to first one
        test_vector = [0.51, 0.49, 0.51, 0.49]
        
        result = check_duplicate_with_details(
            test_vector, user_id, week, content_type, threshold=0.7
        )
        
        # Should find the most similar vector
        is_dup = result['is_duplicate']
        max_similarity = result['max_similarity']
        
        if is_dup:
            assert max_similarity >= 0.7
    
    def test_vector_normalization_handling(self, test_db):
        """Test handling of vectors with different magnitudes."""
        user_id = "test_norm_001"
        week = 7
        content_type = "quiz"
        
        # Add normalized vector
        normalized_vector = [0.5, 0.5, 0.5, 0.5]
        add_to_index(user_id, week, content_type, normalized_vector, "norm")
        
        # Test with scaled version (same direction, different magnitude)
        scaled_vector = [1.0, 1.0, 1.0, 1.0]  # Same direction, 2x magnitude
        
        result = is_duplicate(scaled_vector, user_id, week, content_type, threshold=0.99)
        assert result is True, "Vectors with same direction should have high cosine similarity"
    
    def test_empty_vector_handling(self, test_db):
        """Test handling of edge cases like empty or zero vectors."""
        user_id = "test_empty_001"
        week = 4
        content_type = "flashcard"
        
        # Add normal vector
        normal_vector = [0.5, 0.6, 0.7, 0.8]
        add_to_index(user_id, week, content_type, normal_vector, "normal")
        
        # Test with zero vector
        zero_vector = [0.0, 0.0, 0.0, 0.0]
        
        # This should handle gracefully (might return False or handle division by zero)
        try:
            result = is_duplicate(zero_vector, user_id, week, content_type)
            # Should not crash and should return a boolean
            assert isinstance(result, bool)
        except (ValueError, ZeroDivisionError):
            # This is acceptable behavior for zero vectors
            pass
    
    def test_large_vector_set_performance(self, test_db):
        """Test performance with larger sets of vectors."""
        user_id = "test_performance_001"
        week = 30
        content_type = "quiz"
        
        # Add many vectors
        num_vectors = 50
        for i in range(num_vectors):
            vector = [i/num_vectors, (i+1)/num_vectors, (i+2)/num_vectors, (i+3)/num_vectors]
            add_to_index(user_id, week, content_type, vector, f"perf{i}")
        
        # Test duplicate detection (should complete in reasonable time)
        test_vector = [0.25, 0.26, 0.27, 0.28]
        
        import time
        start_time = time.time()
        result = is_duplicate(test_vector, user_id, week, content_type)
        end_time = time.time()
        
        # Should complete within reasonable time (adjust as needed)
        assert end_time - start_time < 5.0, "Duplicate detection should be reasonably fast"
        assert isinstance(result, bool)
    
    def test_similarity_threshold_edge_cases(self, test_db):
        """Test edge cases for similarity thresholds."""
        user_id = "test_threshold_edge"
        week = 6
        content_type = "flashcard"
        
        base_vector = [0.6, 0.8, 0.0, 0.0]  # Unit vector
        add_to_index(user_id, week, content_type, base_vector, "edge")
        
        test_vector = [0.8, 0.6, 0.0, 0.0]  # Different but similar unit vector
        
        # Calculate expected cosine similarity: (0.6*0.8 + 0.8*0.6) / (1.0 * 1.0) = 0.96
        
        # Test with threshold just below expected similarity
        result_below = is_duplicate(test_vector, user_id, week, content_type, threshold=0.95)
        assert result_below is True
        
        # Test with threshold just above expected similarity
        result_above = is_duplicate(test_vector, user_id, week, content_type, threshold=0.97)
        assert result_above is False

"""
Integration tests for flashcard service flow.
Tests flashcard generation, flipping, limits, and points tracking.
Uses real API calls with mocked external services.
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from tests.conftest import test_db, test_config
from models.user_game_profile import UserGameProfile
from models.flashcard import Flashcard
from models.activity_log import ActivityLog, ACTIVITY_TYPES
from utils.time_utils import now_utc
from utils.constants import FLASHCARD_FLIPS_PER_DAY
from config.logger import get_logger

logger = get_logger(__name__)


class TestFlashcardFlow:
    """Integration tests for complete flashcard workflow."""
    
    @pytest.fixture
    def test_user_profile(self, test_db):
        """Create a test user profile."""
        profile = UserGameProfile(
            user_id="flashcard_test_user",
            timezone="America/Chicago",
            current_week=16,
            points={'lifetime': 100, 'today': 5},  # Start with 5 points so flashcard flips can still earn points
            limits={
                'quizzes_today': 2,
                'flips_today': 0,
                'last_reset_at': now_utc()
            },
            current_streak=3,
            longest_streak=5,
            badges=["first_quiz"],
            created_at=now_utc(),
            updated_at=now_utc()
        )
        profile.save()
        return profile
    
    def setup_mock_services(self):
        """Setup mock responses for external services."""
        def mock_get_user_profile(user_id):
            return {
                "user_id": user_id,
                "current_week": 16,
                "user_details": {
                    "name": "Flashcard Test User",
                    "email": "flashcard@test.com",
                    "age": 28
                },
                "survey_data": {
                    "pregnancyStatus": {
                        "lmp": "2024-03-01",
                        "current_week": 16
                    },
                    "healthProfile": {
                        "age": 28,
                        "first_pregnancy": True,
                        "health_conditions": []
                    }
                }
            }
        
        def mock_rag_search(query_text, week, top_k=10, section=None):
            return [
                {
                    "text": "Second trimester is often called the 'golden period' of pregnancy due to reduced nausea and increased energy.",
                    "week": 16,
                    "section": "general",
                    "metadata": {"source": "pregnancy_guide", "confidence": 0.92}
                },
                {
                    "text": "Anatomy ultrasound typically occurs between weeks 18-22 to check baby's development.",
                    "week": 16,
                    "section": "health",
                    "metadata": {"source": "medical_guidelines", "confidence": 0.90}
                },
                {
                    "text": "Proper nutrition during second trimester supports rapid fetal growth and development.",
                    "week": 16,
                    "section": "nutrition",
                    "metadata": {"source": "nutrition_guide", "confidence": 0.88}
                }
            ]
        
        def mock_llm_generate_flashcards(user_profile, rag_contexts, num_cards=3):
            return '''<flashcards>
                <flashcard>
                    <front>What is the second trimester often called?</front>
                    <back>The second trimester is often called the 'golden period' of pregnancy because morning sickness typically subsides and energy levels increase.</back>
                </flashcard>
                <flashcard>
                    <front>When does the anatomy ultrasound typically occur?</front>
                    <back>The anatomy ultrasound usually occurs between weeks 18-22 to check the baby's growth and development, and to detect any potential abnormalities.</back>
                </flashcard>
                <flashcard>
                    <front>Why is nutrition important during the second trimester?</front>
                    <back>Proper nutrition during the second trimester is crucial because this is when rapid fetal growth occurs, requiring increased calories and nutrients.</back>
                </flashcard>
                <flashcard>
                    <front>What physical changes occur in the second trimester?</front>
                    <back>Common changes include a growing belly, weight gain, possible stretch marks, and the beginning of fetal movement (quickening).</back>
                </flashcard>
                <flashcard>
                    <front>What prenatal tests are recommended in the second trimester?</front>
                    <back>Recommended tests include the anatomy ultrasound, glucose screening for gestational diabetes, and potentially amniocentesis if indicated.</back>
                </flashcard>
            </flashcards>'''
        
        return mock_get_user_profile, mock_rag_search, mock_llm_generate_flashcards
    
    def test_flashcard_generation_flow(self, test_user_profile):
        """Test complete flashcard generation with various limits."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        # Setup mocks
        mock_user_service, mock_rag_search, mock_llm_flashcards = self.setup_mock_services()
        
        with patch('services.user_data_service.get_user_profile', side_effect=mock_user_service), \
             patch('services.rag_service.RAGService.search_by_week', side_effect=mock_rag_search), \
             patch('services.llm_client.LLMClient.generate_flashcards', side_effect=mock_llm_flashcards):
            
            from services.flashcard_service import get_personalized_flashcards
            
            # Test 1: Generate default number of flashcards
            logger.info("Testing default flashcard generation")
            
            flashcards = get_personalized_flashcards(
                user_id=user_id,
                week=current_week,
                limit=3
            )
            
            assert len(flashcards) == 3, "Should generate 3 flashcards by default"
            
            # Verify flashcard content
            for flashcard in flashcards:
                assert flashcard.user_id == user_id
                assert flashcard.week == current_week
                assert flashcard.front_text is not None and len(flashcard.front_text) > 0
                assert flashcard.back_text is not None and len(flashcard.back_text) > 0
                assert flashcard.created_at is not None
                assert flashcard.flipped_at is None  # Should not be flipped yet
                assert flashcard.difficulty in ["easy", "medium", "hard"]
            
            logger.info(f"Successfully generated {len(flashcards)} flashcards")
            
            # Test 2: Generate custom number of flashcards
            logger.info("Testing custom flashcard limit")
            
            more_flashcards = get_personalized_flashcards(
                user_id=user_id,
                week=current_week,
                limit=5
            )
            
            assert len(more_flashcards) == 5, "Should generate 5 flashcards when requested"
            
            # Test 3: Check flashcard uniqueness
            logger.info("Testing flashcard uniqueness")
            
            all_flashcards = Flashcard.objects(user_id=user_id)
            fronts = [card.front_text for card in all_flashcards]
            
            # Should not have exact duplicates
            assert len(fronts) == len(set(fronts)), "Flashcards should be unique"
            
            logger.info("Flashcard generation tests completed successfully")
    
    def test_flashcard_flipping_and_limits(self, test_user_profile):
        """Test flashcard flipping with daily limit enforcement."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        # Setup mocks and generate flashcards first
        mock_user_service, mock_rag_search, mock_llm_flashcards = self.setup_mock_services()
        
        with patch('services.user_data_service.get_user_profile', side_effect=mock_user_service), \
             patch('services.rag_service.RAGService.search_by_week', side_effect=mock_rag_search), \
             patch('services.llm_client.LLMClient.generate_flashcards', side_effect=mock_llm_flashcards):
            
            from services.flashcard_service import get_personalized_flashcards, flip_flashcard
            
            # Generate flashcards for testing
            flashcards = get_personalized_flashcards(user_id, current_week, 5)
            
            # Test 1: Flip flashcards within daily limit
            logger.info("Testing flashcard flipping within daily limit")
            
            initial_lifetime_points = test_user_profile.points["lifetime"]
            initial_today_points = test_user_profile.points["today"]
            
            for i in range(min(FLASHCARD_FLIPS_PER_DAY, len(flashcards))):
                flashcard = flashcards[i]
                
                logger.info(f"Flipping flashcard {i+1}: {flashcard.front_text[:50]}...")
                
                flip_result = flip_flashcard(user_id, str(flashcard.id))
                
                # Verify flip result
                assert "points_awarded" in flip_result
                assert "total_points" in flip_result
                assert "flips_remaining" in flip_result
                assert flip_result["points_awarded"] > 0
                
                # Check that flashcard was marked as flipped
                flashcard.reload()
                assert flashcard.flipped_at is not None
                # Convert flipped_at to timezone-aware for comparison
                flipped_at_utc = flashcard.flipped_at.replace(tzinfo=timezone.utc) if flashcard.flipped_at.tzinfo is None else flashcard.flipped_at
                assert flipped_at_utc <= now_utc()
                
                # Check profile updates
                test_user_profile.reload()
                assert test_user_profile.limits["flips_today"] == i + 1
                assert test_user_profile.points["lifetime"] > initial_lifetime_points
                assert test_user_profile.points["today"] > initial_today_points
                
                # Check remaining flips
                expected_remaining = FLASHCARD_FLIPS_PER_DAY - (i + 1)
                assert flip_result["flips_remaining"] == expected_remaining
            
            logger.info(f"Successfully flipped {FLASHCARD_FLIPS_PER_DAY} flashcards")
            
            # Test 2: Try to exceed daily limit
            logger.info("Testing daily limit enforcement")
            
            if len(flashcards) > FLASHCARD_FLIPS_PER_DAY:
                extra_flashcard = flashcards[FLASHCARD_FLIPS_PER_DAY]
                
                # Should raise LimitExceeded exception
                with pytest.raises(Exception):  # LimitExceeded or similar
                    flip_flashcard(user_id, str(extra_flashcard.id))
                
                logger.info("Daily limit enforcement working correctly")
            
            # Test 3: Try to flip the same flashcard twice
            logger.info("Testing duplicate flip prevention")
            
            already_flipped = flashcards[0]
            
            # Should raise exception for already flipped card
            with pytest.raises(Exception):
                flip_flashcard(user_id, str(already_flipped.id))
            
            logger.info("Duplicate flip prevention working correctly")
    
    def test_flashcard_points_calculation(self, test_user_profile):
        """Test points calculation for flashcard flipping."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        from services.flashcard_service import get_personalized_flashcards, flip_flashcard
        from utils.constants import POINTS_PER_FLASHCARD_FLIP
        
        logger.info("Testing points calculation for flashcard flipping")
        
        # Generate flashcards
        flashcards = get_personalized_flashcards(user_id, current_week, 3)
        
        # Record initial points
        initial_lifetime_points = test_user_profile.points.get("lifetime", 0)
        initial_today_points = test_user_profile.points.get("today", 0)
        
        total_points_earned = 0
        
        for i, flashcard in enumerate(flashcards):
            logger.info(f"Flipping flashcard {i+1}: {flashcard.front_text[:50]}...")
            
            flip_result = flip_flashcard(user_id, str(flashcard.id))
            points_awarded = flip_result["points_awarded"]
            
            # Verify points were calculated correctly (should be constant per flip)
            assert points_awarded == POINTS_PER_FLASHCARD_FLIP, \
                f"Points mismatch: expected {POINTS_PER_FLASHCARD_FLIP}, got {points_awarded}"
            
            test_user_profile.reload()
            expected_lifetime = initial_lifetime_points + (i + 1) * POINTS_PER_FLASHCARD_FLIP
            assert test_user_profile.points["lifetime"] == expected_lifetime
            
            total_points_earned += points_awarded
            
            logger.info(f"Awarded {points_awarded} points for flashcard flip {i+1}")
        
        # Verify total points earned
        assert total_points_earned == len(flashcards) * POINTS_PER_FLASHCARD_FLIP
        
        logger.info(f"Total points earned from flashcards: {total_points_earned}")
    
    def test_activity_logging_for_flashcards(self, test_user_profile):
        """Test that flashcard activities are properly logged."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        # Clear existing activity logs
        ActivityLog.objects(user_id=user_id).delete()
        
        from services.flashcard_service import get_personalized_flashcards, flip_flashcard
        
        # Generate and flip flashcards
        flashcards = get_personalized_flashcards(user_id, current_week, 3)
        
        logger.info("Testing activity logging for flashcard operations")
        
        # Flip each flashcard and verify logging
        for i, flashcard in enumerate(flashcards):
            initial_activity_count = ActivityLog.objects(user_id=user_id).count()
            
            flip_flashcard(user_id, str(flashcard.id))
            
            # Check that activity was logged
            final_activity_count = ActivityLog.objects(user_id=user_id).count()
            assert final_activity_count == initial_activity_count + 1
            
            # Check activity details - get the specific activity for this flashcard
            flashcard_activity = ActivityLog.objects(
                user_id=user_id, 
                type=ACTIVITY_TYPES["FLASHCARD_FLIP"]
            ).filter(details__flashcard_id=str(flashcard.id)).first()
            
            assert flashcard_activity is not None
            assert flashcard_activity.details["flashcard_id"] == str(flashcard.id)
            assert "points_awarded" in flashcard_activity.details
            # Convert created_at to timezone-aware for comparison
            created_at_utc = flashcard_activity.created_at.replace(tzinfo=timezone.utc) if flashcard_activity.created_at.tzinfo is None else flashcard_activity.created_at
            assert created_at_utc <= now_utc()
            
            logger.info(f"Activity logged for flashcard flip {i+1}")
        
        # Verify total activity count
        total_activities = ActivityLog.objects(user_id=user_id).count()
        assert total_activities == len(flashcards)
        
        logger.info(f"Successfully logged {total_activities} flashcard activities")
    
    def test_flashcard_persistence_and_retrieval(self, test_user_profile):
        """Test flashcard persistence and retrieval functionality."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        from services.flashcard_service import get_personalized_flashcards, get_user_flashcards
        
        logger.info("Testing flashcard persistence and retrieval")
        
        # Generate initial flashcards
        initial_flashcards = get_personalized_flashcards(user_id, current_week, 3)
        initial_count = len(initial_flashcards)
        logger.info(f"Generated {initial_count} flashcards for week {current_week}")
        
        # Generate more flashcards for different week
        different_week_flashcards = get_personalized_flashcards(user_id, current_week + 2, 3)
        different_week_count = len(different_week_flashcards)
        logger.info(f"Generated {different_week_count} flashcards for week {current_week + 2}")
        
        # Test retrieval by user (should get all flashcards for this user)
        all_user_flashcards = get_user_flashcards(user_id)
        expected_total = initial_count + different_week_count
        assert len(all_user_flashcards) == expected_total, f"Expected {expected_total} total flashcards, got {len(all_user_flashcards)}"
        
        # Test retrieval by week
        week_specific_flashcards = get_user_flashcards(user_id, week=current_week)
        assert len(week_specific_flashcards) == initial_count, f"Expected {initial_count} flashcards for week {current_week}, got {len(week_specific_flashcards)}"
        
        different_week_retrieved = get_user_flashcards(user_id, week=current_week + 2)
        assert len(different_week_retrieved) == different_week_count, f"Expected {different_week_count} flashcards for week {current_week + 2}, got {len(different_week_retrieved)}"
        
        # Test retrieval with flipped status
        from services.flashcard_service import flip_flashcard
        
        # Flip one flashcard
        flip_flashcard(user_id, str(initial_flashcards[0].id))
        
        flipped_cards = get_user_flashcards(user_id, flipped_only=True)
        assert len(flipped_cards) == 1, f"Expected 1 flipped card, got {len(flipped_cards)}"
        assert flipped_cards[0].flipped_at is not None
        
        unflipped_cards = get_user_flashcards(user_id, flipped_only=False)
        expected_unflipped = expected_total - 1  # Total minus flipped
        assert len(unflipped_cards) == expected_unflipped, f"Expected {expected_unflipped} unflipped cards, got {len(unflipped_cards)}"
        
        logger.info("Flashcard persistence and retrieval tests completed successfully")
    
    def test_flashcard_error_handling(self, test_user_profile):
        """Test error handling in flashcard operations."""
        user_id = test_user_profile.user_id
        
        logger.info("Testing flashcard error handling")
        
        # Test 1: Flip non-existent flashcard
        from services.flashcard_service import flip_flashcard
        from utils.errors import NotFoundError, ValidationError
        from mongoengine.errors import ValidationError as MongoValidationError
        
        with pytest.raises((ValidationError, ValueError, MongoValidationError)):  # Should raise validation error for invalid ObjectId
            flip_flashcard(user_id, "non_existent_flashcard_id")
        
        # Test 2: Flip flashcard that doesn't belong to user
        # First create a flashcard for another user
        from services.flashcard_service import get_personalized_flashcards
        other_user_flashcards = get_personalized_flashcards("other_test_user", 16, 1)
        
        if other_user_flashcards:
            with pytest.raises(NotFoundError):  # Should raise NotFoundError for flashcard not belonging to user
                flip_flashcard(user_id, str(other_user_flashcards[0].id))
        
        # Test 3: Handle LLM service failure - but service has retry logic so it may succeed on retry
        mock_user_service, mock_rag_search, _ = self.setup_mock_services()
        
        with patch('services.user_data_service.get_user_profile', side_effect=mock_user_service), \
             patch('services.rag_service.RAGService.search_by_week', side_effect=mock_rag_search), \
             patch('services.llm_client.LLMClient.generate_flashcards') as mock_llm:
            
            # Make LLM fail on all attempts to test true failure case
            mock_llm.side_effect = Exception("LLM service unavailable")
            
            # Also patch the regeneration method to ensure it fails too
            with patch('services.llm_client.LLMClient.generate_flashcards_with_regeneration_context') as mock_regen:
                mock_regen.side_effect = Exception("LLM service unavailable")
                
                with pytest.raises(Exception):
                    get_personalized_flashcards(user_id, 10, 3)
        
        logger.info("Error handling tests completed successfully")
    
    def test_flashcard_daily_reset(self, test_user_profile):
        """Test daily limit reset functionality."""
        user_id = test_user_profile.user_id
        current_week = test_user_profile.current_week
        
        # Setup mocks
        mock_user_service, mock_rag_search, mock_llm_flashcards = self.setup_mock_services()
        
        with patch('services.user_data_service.get_user_profile', side_effect=mock_user_service), \
             patch('services.rag_service.RAGService.search_by_week', side_effect=mock_rag_search), \
             patch('services.llm_client.LLMClient.generate_flashcards', side_effect=mock_llm_flashcards):
            
            from services.flashcard_service import get_personalized_flashcards, flip_flashcard
            
            logger.info("Testing daily limit reset functionality")
            
            # Generate flashcards and flip to daily limit
            flashcards = get_personalized_flashcards(user_id, current_week, FLASHCARD_FLIPS_PER_DAY + 2)
            
            # Flip to daily limit
            for i in range(FLASHCARD_FLIPS_PER_DAY):
                flip_flashcard(user_id, str(flashcards[i].id))
            
            # Verify limit reached
            test_user_profile.reload()
            assert test_user_profile.limits["flips_today"] == FLASHCARD_FLIPS_PER_DAY
            
            # Simulate day change by updating last_reset_at
            yesterday = now_utc() - timedelta(days=1)
            test_user_profile.limits["last_reset_at"] = yesterday
            test_user_profile.save()
            
            # Try to flip another flashcard (should work after reset)
            flip_result = flip_flashcard(user_id, str(flashcards[FLASHCARD_FLIPS_PER_DAY].id))
            
            assert flip_result["points_awarded"] > 0
            
            # Verify limits were reset
            test_user_profile.reload()
            assert test_user_profile.limits["flips_today"] == 1  # Should be 1 after reset and one flip
            # Convert last_reset_at to timezone-aware for comparison
            last_reset_at = test_user_profile.limits["last_reset_at"]
            last_reset_at_utc = last_reset_at.replace(tzinfo=timezone.utc) if last_reset_at.tzinfo is None else last_reset_at
            assert last_reset_at_utc > yesterday
            
            logger.info("Daily reset functionality working correctly")

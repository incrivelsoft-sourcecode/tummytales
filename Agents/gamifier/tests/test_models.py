"""
Unit tests for Gamifier service models.
Tests model creation, validation, indexes, and helper methods.
"""

import pytest
from datetime import datetime, timedelta, timezone
from mongoengine import ValidationError, NotUniqueError
from models.user_game_profile import UserGameProfile
from models.flashcard import Flashcard
from models.question import Question
from models.quiz_session import QuizSession
from models.answer import Answer
from models.activity_log import ActivityLog, ACTIVITY_TYPES
from models.achievement import Achievement
from models.similarity_index import SimilarityIndex
from utils.time_utils import now_utc
from utils.constants import SESSION_STATUS, DIFFICULTY_LEVELS
from tests.conftest import (
    create_test_user_profile, 
    create_test_flashcard, 
    create_test_question,
    create_test_quiz_session
)


class TestUserGameProfile:
    """Test cases for UserGameProfile model."""
    
    def test_user_profile_creation(self, test_db):
        """Test basic user profile creation with required fields."""
        user_id = "test_user_profile_001"
        
        profile = UserGameProfile(
            user_id=user_id,
            timezone="America/New_York",
            current_week=10
        )
        profile.save()
        
        # Verify creation
        assert profile.id is not None
        assert profile.user_id == user_id
        assert profile.timezone == "America/New_York"
        assert profile.current_week == 10
        
        # Verify defaults
        assert profile.points == {'lifetime': 0, 'today': 0}
        assert profile.current_streak == 0
        assert profile.longest_streak == 0
        assert profile.badges == []
        assert profile.created_at is not None
        assert profile.updated_at is not None
    
    def test_user_profile_unique_constraint(self, test_db):
        """Test that user_id must be unique."""
        user_id = "duplicate_user"
        
        # Create first profile
        profile1 = UserGameProfile(user_id=user_id)
        profile1.save()
        
        # Attempt to create duplicate
        profile2 = UserGameProfile(user_id=user_id)
        
        with pytest.raises(NotUniqueError):
            profile2.save()
    
    def test_user_profile_validation(self, test_db):
        """Test field validation."""
        # Test required field validation
        with pytest.raises(ValidationError):
            profile = UserGameProfile()
            profile.save()
        
        # Test current_week minimum value
        with pytest.raises(ValidationError):
            profile = UserGameProfile(user_id="test", current_week=0)
            profile.save()
    
    def test_increment_points_atomic(self, test_db):
        """Test atomic points increment method."""
        profile = create_test_user_profile("test_points_001")
        initial_points = profile.points.copy()
        
        # Test increment
        profile.increment_points(15)
        profile.reload()
        
        assert profile.points['lifetime'] == initial_points['lifetime'] + 15
        assert profile.points['today'] == initial_points['today'] + 15
    
    def test_increment_daily_limits(self, test_db):
        """Test atomic daily limit increment methods."""
        profile = create_test_user_profile("test_limits_001")
        
        # Test quiz increment
        initial_quizzes = profile.limits.get('quizzes_today', 0)
        profile.increment_quizzes_today()
        profile.reload()
        
        assert profile.limits['quizzes_today'] == initial_quizzes + 1
        
        # Test flips increment
        initial_flips = profile.limits.get('flips_today', 0)
        profile.increment_flips_today()
        profile.reload()
        
        assert profile.limits['flips_today'] == initial_flips + 1
    
    def test_user_profile_indexes(self, test_db):
        """Test that indexes are properly created."""
        # Create a profile to ensure collection exists
        profile = create_test_user_profile("test_index_001")
        
        # Get collection info
        collection = UserGameProfile._get_collection()
        indexes = collection.list_indexes()
        
        # Check that user_id index exists
        index_names = [idx['key'] for idx in indexes]
        user_id_indexed = any('user_id' in idx for idx in index_names)
        
        assert user_id_indexed, "user_id should be indexed"


class TestFlashcard:
    """Test cases for Flashcard model."""
    
    def test_flashcard_creation(self, test_db):
        """Test basic flashcard creation."""
        user_id = "test_flashcard_user"
        
        flashcard = Flashcard(
            user_id=user_id,
            week=12,
            section="nutrition",
            difficulty="medium",
            front_text="What vitamin is important for fetal development?",
            back_text="Folic acid is crucial for preventing neural tube defects.",
            xml="<flashcard><front>Test</front><back>Test</back></flashcard>",
            rag_chunk_ids=["chunk_1", "chunk_2"],
            embedding_vector=[0.1, 0.2, 0.3]
        )
        flashcard.save()
        
        # Verify creation
        assert flashcard.id is not None
        assert flashcard.user_id == user_id
        assert flashcard.week == 12
        assert flashcard.section == "nutrition"
        assert flashcard.difficulty == "medium"
        assert flashcard.created_at is not None
    
    def test_flashcard_validation(self, test_db):
        """Test flashcard field validation."""
        # Test required fields
        with pytest.raises(ValidationError):
            flashcard = Flashcard()
            flashcard.save()
        
        # Test week validation
        with pytest.raises(ValidationError):
            flashcard = Flashcard(
                user_id="test",
                week=0,  # Invalid week
                front_text="test",
                back_text="test"
            )
            flashcard.save()
    
    def test_flashcard_to_dict(self, test_db):
        """Test to_dict helper method."""
        flashcard = create_test_flashcard("test_user", week=15)
        
        dict_result = flashcard.to_dict()
        
        # Verify API-safe fields are included
        assert 'id' in dict_result
        assert 'user_id' in dict_result
        assert 'week' in dict_result
        assert 'front_text' in dict_result
        assert 'back_text' in dict_result
        
        # Verify embedding_vector is excluded by default
        assert 'embedding_vector' not in dict_result
    
    def test_flashcard_compound_index(self, test_db):
        """Test compound index on user_id and week."""
        # Create flashcard to ensure collection exists
        create_test_flashcard("test_user", week=1)
        
        collection = Flashcard._get_collection()
        indexes = collection.list_indexes()
        
        # Check for compound index
        compound_index_exists = any(
            'user_id' in idx['key'] and 'week' in idx['key'] 
            for idx in indexes
        )
        
        assert compound_index_exists, "Compound index on user_id and week should exist"


class TestQuestion:
    """Test cases for Question model."""
    
    def test_question_creation(self, test_db):
        """Test basic question creation."""
        user_id = "test_question_user"
        
        question = Question(
            user_id=user_id,
            week=8,
            section="health",
            difficulty="hard",
            text="Which nutrient deficiency can cause anemia during pregnancy?",
            option_a="Iron",
            option_b="Calcium", 
            option_c="Vitamin D",
            option_d="Protein",
            correct_option="A",
            explanation="Iron deficiency is the leading cause of anemia in pregnancy.",
            xml="<question><text>Test</text></question>",
            rag_chunk_ids=["chunk_1"],
            embedding_vector=[0.5, 0.6, 0.7]
        )
        question.save()
        
        # Verify creation
        assert question.id is not None
        assert question.user_id == user_id
        assert question.week == 8
        assert question.correct_option == "A"
        assert question.created_at is not None
    
    def test_question_validation(self, test_db):
        """Test question field validation."""
        # Test correct_option validation
        with pytest.raises(ValidationError):
            question = Question(
                user_id="test",
                week=1,
                text="Test question?",
                option_a="A",
                option_b="B", 
                option_c="C",
                option_d="D",
                correct_option="E"  # Invalid option
            )
            question.save()
    
    def test_question_snapshot_dict(self, test_db):
        """Test snapshot_dict method for quiz sessions."""
        question = create_test_question("test_user", week=5)
        
        snapshot = question.snapshot_dict()
        
        # Verify required fields for quiz sessions
        assert 'question_id' in snapshot
        assert 'text' in snapshot
        assert 'options' in snapshot
        
        # Verify correct_option is excluded
        assert 'correct_option' not in snapshot
        
        # Verify options dictionary structure
        options = snapshot['options']
        assert 'A' in options
        assert 'B' in options
        assert 'C' in options
        assert 'D' in options


class TestQuizSession:
    """Test cases for QuizSession model."""
    
    def test_quiz_session_creation(self, test_db):
        """Test basic quiz session creation."""
        user_id = "test_session_user"
        now = now_utc()
        
        session = QuizSession(
            user_id=user_id,
            difficulty_selected="medium",
            week_at_start=10,
            status=SESSION_STATUS["STARTED"],
            started_at=now,
            timeout_at=now + timedelta(minutes=5),
            total_questions=3,
            questions=[],
            answer_attempts=[]
        )
        session.save()
        
        # Verify creation
        assert session.id is not None
        assert session.user_id == user_id
        assert session.status == SESSION_STATUS["STARTED"]
        assert session.total_questions == 3
    
    def test_quiz_session_timeout_methods(self, test_db):
        """Test timeout-related helper methods."""
        now = now_utc()
        
        # Create session that's not timed out
        session = create_test_quiz_session(
            "test_user",
            timeout_at=now + timedelta(minutes=3)
        )
        
        assert not session.is_timed_out(now)
        assert session.get_remaining_seconds(now) > 0
        
        # Test timed out session - use timezone-aware datetime
        past_time = now - timedelta(minutes=10)
        # Ensure past_time maintains timezone info
        if past_time.tzinfo is None:
            past_time = past_time.replace(tzinfo=timezone.utc)
        session.timeout_at = past_time
        session.save()
        
        assert session.is_timed_out(now)
        assert session.get_remaining_seconds(now) <= 0
    
    def test_quiz_session_answer_attempts(self, test_db):
        """Test answer attempts tracking."""
        session = create_test_quiz_session("test_user")
        
        # Add answer attempt
        attempt = {
            'question_id': 'q1',
            'selected_option': 'A',
            'is_correct': True,
            'answered_at': now_utc().isoformat()
        }
        
        session.append_answer_attempt(attempt)
        session.reload()
        
        assert len(session.answer_attempts) == 1
        assert session.answer_attempts[0]['question_id'] == 'q1'
    
    def test_quiz_session_finalization(self, test_db):
        """Test session finalization method."""
        session = create_test_quiz_session("test_user")
        
        # Finalize session
        score = 20
        awarded_points = 15
        session.finalize_session(score, awarded_points)
        session.reload()
        
        assert session.status == SESSION_STATUS["COMPLETED"]
        assert session.score == score
        assert session.awarded_points == awarded_points
        assert session.completed_at is not None


class TestAnswer:
    """Test cases for Answer model."""
    
    def test_answer_creation(self, test_db):
        """Test basic answer creation."""
        session = create_test_quiz_session("test_user")
        question = create_test_question("test_user")
        
        now = now_utc()
        answer = Answer(
            session_id=str(session.id),
            question_id=str(question.id),
            selected_option="A",
            is_correct=True,
            retry_index=0,
            started_at=now,
            answered_at=now + timedelta(seconds=30),
            time_taken_seconds=30
        )
        answer.save()
        
        # Verify creation
        assert answer.id is not None
        assert answer.session_id == str(session.id)
        assert answer.is_correct is True
        assert answer.time_taken_seconds == 30


class TestActivityLog:
    """Test cases for ActivityLog model."""
    
    def test_activity_log_creation(self, test_db):
        """Test basic activity log creation."""
        user_id = "test_activity_user"
        
        log = ActivityLog(
            user_id=user_id,
            type=ACTIVITY_TYPES["QUIZ_START"],
            details={'session_id': 'session_123'},
            points_delta=0
        )
        log.save()
        
        # Verify creation
        assert log.id is not None
        assert log.user_id == user_id
        assert log.type == ACTIVITY_TYPES["QUIZ_START"]
        assert log.ts is not None
    
    def test_activity_log_helper_function(self, test_db):
        """Test log_activity helper function."""
        from models.activity_log import log_activity
        
        user_id = "test_helper_user"
        log_activity(
            user_id=user_id,
            activity_type=ACTIVITY_TYPES["FLASHCARD_FLIP"],
            metadata={'flashcard_id': 'fc_123'},
            points_delta=5
        )
        
        # Verify log was created
        logs = ActivityLog.objects(user_id=user_id)
        assert logs.count() == 1
        
        log = logs.first()
        assert log.type == ACTIVITY_TYPES["FLASHCARD_FLIP"]
        assert log.points_delta == 5


class TestAchievement:
    """Test cases for Achievement model."""
    
    def test_achievement_creation(self, test_db):
        """Test basic achievement creation."""
        achievement = Achievement(
            code="WEEKLY_STREAK_2024_W10",
            name="Weekly Streak",
            description="Completed quiz for 7 consecutive days"
        )
        achievement.save()
        
        # Verify creation
        assert achievement.id is not None
        assert achievement.code == "WEEKLY_STREAK_2024_W10"
        assert achievement.created_at is not None
    
    def test_achievement_unique_code(self, test_db):
        """Test that achievement code must be unique."""
        code = "UNIQUE_ACHIEVEMENT"
        
        # Create first achievement
        achievement1 = Achievement(code=code, name="Test", description="Test")
        achievement1.save()
        
        # Attempt to create duplicate
        achievement2 = Achievement(code=code, name="Test2", description="Test2")
        
        with pytest.raises(NotUniqueError):
            achievement2.save()


class TestSimilarityIndex:
    """Test cases for SimilarityIndex model."""
    
    def test_similarity_index_creation(self, test_db):
        """Test basic similarity index creation."""
        user_id = "test_similarity_user"
        
        index = SimilarityIndex(
            user_id=user_id,
            week=15,
            content_type="flashcard",
            text_hash="abc123def456",
            embedding_vector=[0.1, 0.2, 0.3, 0.4],
            created_at=now_utc()
        )
        index.save()
        
        # Verify creation
        assert index.id is not None
        assert index.user_id == user_id
        assert index.week == 15
        assert index.content_type == "flashcard"
    
    def test_similarity_index_fetch_vectors(self, test_db):
        """Test fetch_vectors_for_user_week static method."""
        user_id = "test_vectors_user"
        week = 12
        content_type = "quiz"
        
        # Create multiple similarity indexes
        for i in range(3):
            index = SimilarityIndex(
                user_id=user_id,
                week=week,
                content_type=content_type,
                text_hash=f"hash_{i}",
                embedding_vector=[0.1 * i, 0.2 * i, 0.3 * i]
            )
            index.save()
        
        # Fetch vectors
        vectors = SimilarityIndex.fetch_vectors_for_user_week(user_id, week, content_type)
        
        assert len(vectors) == 3
        assert all(isinstance(v, list) for v in vectors)
    
    def test_similarity_index_compound_index(self, test_db):
        """Test compound index on user_id, week, and content_type."""
        # Create index entry to ensure collection exists
        index = SimilarityIndex(
            user_id="test",
            week=1,
            content_type="flashcard",
            text_hash="test",
            embedding_vector=[0.1]
        )
        index.save()
        
        collection = SimilarityIndex._get_collection()
        indexes = collection.list_indexes()
        
        # Check for compound index
        compound_index_exists = any(
            'user_id' in idx['key'] and 'week' in idx['key'] and 'content_type' in idx['key']
            for idx in indexes
        )
        
        assert compound_index_exists, "Compound index on user_id, week, and content_type should exist"


class TestModelIndexes:
    """Test cases for verifying all model indexes are properly created."""
    
    def test_all_indexes_exist(self, test_db):
        """Test that all models have their required indexes."""
        # Create one instance of each model to ensure collections exist
        profile = create_test_user_profile("index_test_user")
        flashcard = create_test_flashcard("index_test_user")
        question = create_test_question("index_test_user")
        session = create_test_quiz_session("index_test_user")
        
        # Create answer
        answer = Answer(
            session_id=str(session.id),
            question_id=str(question.id),
            selected_option="A",
            is_correct=True,
            retry_index=0,
            started_at=now_utc(),
            answered_at=now_utc()
        )
        answer.save()
        
        # Create activity log
        activity = ActivityLog(
            user_id="index_test_user",
            type=ACTIVITY_TYPES["QUIZ_START"]
        )
        activity.save()
        
        # Create achievement
        achievement = Achievement(
            code="TEST_ACHIEVEMENT",
            name="Test",
            description="Test"
        )
        achievement.save()
        
        # Create similarity index
        similarity = SimilarityIndex(
            user_id="index_test_user",
            week=1,
            content_type="flashcard",
            text_hash="test",
            embedding_vector=[0.1]
        )
        similarity.save()
        
        # Verify all collections have indexes
        models_to_check = [
            UserGameProfile,
            Flashcard,
            Question,
            QuizSession,
            Answer,
            ActivityLog,
            Achievement,
            SimilarityIndex
        ]
        
        for model in models_to_check:
            collection = model._get_collection()
            indexes = list(collection.list_indexes())
            
            # Every collection should have at least the default _id index
            assert len(indexes) >= 1, f"{model.__name__} should have at least one index"
            
            # Check that _id index exists
            id_index_exists = any('_id' in idx['key'] for idx in indexes)
            assert id_index_exists, f"{model.__name__} should have _id index"

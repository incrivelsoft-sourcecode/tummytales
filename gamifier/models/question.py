"""
Question model for gamification quiz features.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from mongoengine import (
    Document, StringField, IntField, ListField, 
    FloatField, DateTimeField, ValidationError
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


class Question(Document):
    """
    Question document for storing user-generated quiz questions.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core identification
    user_id = StringField(required=True, max_length=255)
    week = IntField(required=True, min_value=1)
    
    # Content organization
    section = StringField(max_length=200)
    difficulty = StringField(
        choices=['easy', 'medium', 'hard'],
        default='medium',
        max_length=10
    )
    
    # Question content
    text = StringField(required=True, min_length=1, max_length=1000)
    
    # Multiple choice options
    option_a = StringField(required=True, min_length=1, max_length=500)
    option_b = StringField(required=True, min_length=1, max_length=500)
    option_c = StringField(required=True, min_length=1, max_length=500)
    option_d = StringField(required=True, min_length=1, max_length=500)
    
    # Correct answer and explanation
    correct_option = StringField(
        required=True,
        choices=['A', 'B', 'C', 'D'],
        max_length=1
    )
    explanation = StringField(max_length=2000)
    
    # RAG and AI processing
    xml = StringField()  # Original XML representation
    rag_chunk_ids = ListField(StringField(max_length=100), default=list)
    embedding_vector = ListField(FloatField(), default=list)
    
    # Timestamps
    created_at = DateTimeField(default=now_utc)
    
    # MongoDB collection settings
    meta = {
        'collection': 'questions',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            ('user_id', 'week'),  # Primary compound index for user-week queries
            'user_id',  # User lookup index
            'created_at',  # For temporal queries
            ('user_id', 'difficulty'),  # For difficulty filtering
            ('user_id', 'section'),  # For section filtering
        ]
    }
    
    def __str__(self):
        return f"Question(user_id={self.user_id}, week={self.week}, difficulty={self.difficulty})"
    
    def clean(self):
        """
        Validate question data before saving.
        
        Raises:
            ValidationError: If validation fails
        """
        try:
            # Validate that correct_option is one of A, B, C, D
            if self.correct_option not in ['A', 'B', 'C', 'D']:
                raise ValidationError(f"correct_option must be one of A, B, C, D, got: {self.correct_option}")
            
            # Ensure all options are provided and non-empty
            options = [self.option_a, self.option_b, self.option_c, self.option_d]
            if not all(option and option.strip() for option in options):
                raise ValidationError("All options (A, B, C, D) must be provided and non-empty")
            
            # Ensure question text is provided
            if not self.text or not self.text.strip():
                raise ValidationError("Question text must be provided and non-empty")
            
            logger.debug(f"Question validation passed for user {self.user_id}, week {self.week}")
            
        except Exception as e:
            logger.error(f"Question validation failed for user {self.user_id}: {str(e)}")
            raise
    
    def snapshot_dict(self) -> Dict[str, Any]:
        """
        Convert question to snapshot dictionary for storing in QuizSession.
        This excludes the correct answer and sensitive information.
        
        Returns:
            dict: Snapshot representation for quiz sessions
        """
        try:
            result = {
                'question_id': str(self.id),
                'text': self.text,
                'options': {
                    'A': self.option_a,
                    'B': self.option_b,
                    'C': self.option_c,
                    'D': self.option_d
                },
                'difficulty': self.difficulty,
                'section': self.section or '',
                'week': self.week
            }
            
            logger.debug(f"Created snapshot for question {self.id} (no correct_option included)")
            return result
            
        except Exception as e:
            logger.error(f"Failed to create snapshot for question {self.id}: {str(e)}")
            raise
    
    def to_dict(self, include_correct_answer: bool = False, include_embedding: bool = False) -> Dict[str, Any]:
        """
        Convert question to API-safe dictionary.
        
        Args:
            include_correct_answer: Whether to include the correct answer
            include_embedding: Whether to include embedding vector
            
        Returns:
            dict: API-safe representation of question
        """
        try:
            result = {
                'id': str(self.id),
                'user_id': self.user_id,
                'week': self.week,
                'section': self.section or '',
                'difficulty': self.difficulty,
                'text': self.text,
                'options': {
                    'A': self.option_a,
                    'B': self.option_b,
                    'C': self.option_c,
                    'D': self.option_d
                },
                'explanation': self.explanation or '',
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'rag_chunk_ids': list(self.rag_chunk_ids) if self.rag_chunk_ids else []
            }
            
            # Include correct answer only if explicitly requested
            if include_correct_answer:
                result['correct_option'] = self.correct_option
            
            # Include embedding only if explicitly requested
            if include_embedding and self.embedding_vector:
                result['embedding_vector'] = list(self.embedding_vector)
            
            # Include XML if present
            if self.xml:
                result['xml'] = self.xml
            
            logger.debug(f"Converted question {self.id} to dict (correct_answer={include_correct_answer}, embedding={include_embedding})")
            return result
            
        except Exception as e:
            logger.error(f"Failed to convert question {self.id} to dict: {str(e)}")
            raise
    
    def is_correct_answer(self, selected_option: str) -> bool:
        """
        Check if the selected option is correct.
        
        Args:
            selected_option: The option selected by user (A, B, C, or D)
            
        Returns:
            bool: True if correct, False otherwise
        """
        try:
            if not selected_option:
                logger.warning(f"Empty selected_option for question {self.id}")
                return False
            
            selected_normalized = selected_option.upper().strip()
            if selected_normalized not in ['A', 'B', 'C', 'D']:
                logger.warning(f"Invalid selected_option '{selected_option}' for question {self.id}")
                return False
            
            is_correct = selected_normalized == self.correct_option
            logger.debug(f"Question {self.id}: selected='{selected_normalized}', correct='{self.correct_option}', result={is_correct}")
            return is_correct
            
        except Exception as e:
            logger.error(f"Error checking answer for question {self.id}: {str(e)}")
            return False
    
    @classmethod
    def get_by_user_and_week(cls, user_id: str, week: int, 
                           difficulty: Optional[str] = None,
                           section: Optional[str] = None,
                           limit: Optional[int] = None) -> List['Question']:
        """
        Get questions for a specific user and week.
        
        Args:
            user_id: User identifier
            week: Week number
            difficulty: Optional difficulty filter
            section: Optional section filter
            limit: Optional limit on number of questions
            
        Returns:
            List[Question]: List of matching questions
        """
        try:
            query = cls.objects(user_id=user_id, week=week)
            
            if difficulty:
                query = query.filter(difficulty=difficulty)
            
            if section:
                query = query.filter(section=section)
            
            # Order by creation time for consistent results
            query = query.order_by('-created_at')
            
            if limit:
                query = query.limit(limit)
            
            questions = list(query)
            logger.debug(f"Retrieved {len(questions)} questions for user {user_id}, week {week}")
            return questions
            
        except Exception as e:
            logger.error(f"Failed to get questions for user {user_id}, week {week}: {str(e)}")
            raise
    
    @classmethod
    def create_question(cls, user_id: str, week: int, text: str,
                       option_a: str, option_b: str, option_c: str, option_d: str,
                       correct_option: str, difficulty: str = 'medium',
                       section: Optional[str] = None, explanation: Optional[str] = None,
                       xml: Optional[str] = None, rag_chunk_ids: Optional[List[str]] = None,
                       embedding_vector: Optional[List[float]] = None) -> 'Question':
        """
        Create a new question with validation.
        
        Args:
            user_id: User identifier
            week: Week number
            text: Question text
            option_a: Option A text
            option_b: Option B text
            option_c: Option C text
            option_d: Option D text
            correct_option: Correct option (A, B, C, or D)
            difficulty: Question difficulty level
            section: Optional section
            explanation: Optional explanation text
            xml: Optional XML representation
            rag_chunk_ids: Optional RAG chunk IDs
            embedding_vector: Optional embedding vector
            
        Returns:
            Question: Created question instance
            
        Raises:
            ValidationError: If validation fails
        """
        try:
            logger.info(f"Creating question for user {user_id}, week {week}, difficulty {difficulty}")
            
            question = cls(
                user_id=user_id,
                week=week,
                text=text.strip(),
                option_a=option_a.strip(),
                option_b=option_b.strip(),
                option_c=option_c.strip(),
                option_d=option_d.strip(),
                correct_option=correct_option.upper().strip(),
                difficulty=difficulty,
                section=section.strip() if section else None,
                explanation=explanation.strip() if explanation else None,
                xml=xml,
                rag_chunk_ids=rag_chunk_ids or [],
                embedding_vector=embedding_vector or [],
                created_at=now_utc()
            )
            
            # Validate before saving
            question.clean()
            question.save()
            
            logger.info(f"Successfully created question {question.id} for user {user_id}")
            return question
            
        except Exception as e:
            logger.error(f"Failed to create question for user {user_id}: {str(e)}")
            raise

"""
LLM Audit Log model for tracking LLM generation attempts and outputs.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from mongoengine import (
    Document, StringField, DateTimeField, DictField, IntField, ListField, 
    BooleanField, FloatField
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


class LLMAuditLog(Document):
    """
    LLM audit log document for tracking all LLM generation attempts.
    Used for debugging, auditing, and analyzing LLM performance.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core identification
    user_id = StringField(required=True, max_length=255)
    content_type = StringField(required=True, choices=['quiz', 'flashcard'])
    attempt_number = IntField(required=True, min_value=1, max_value=3)
    
    # Generation context
    week = IntField(required=True, min_value=1, max_value=40)
    difficulty = StringField(max_length=50)
    rag_context_ids = ListField(StringField(max_length=255))
    
    # LLM interaction data
    prompt_hash = StringField(required=True, max_length=64)  # SHA256 of prompt for deduplication
    raw_response = StringField(required=True)  # Raw LLM output
    tokens_used = IntField(default=0)
    response_time_ms = IntField(default=0)
    
    # Processing results
    parsing_success = BooleanField(default=False)
    validation_success = BooleanField(default=False)
    duplicate_detected = BooleanField(default=False)
    similarity_scores = ListField(FloatField())  # Similarity scores against existing content
    
    # Error information
    error_type = StringField(max_length=100)  # parsing_error, validation_error, duplicate_error
    error_message = StringField(max_length=1000)
    
    # Metadata
    metadata = DictField(default=dict)
    created_at = DateTimeField(default=now_utc)
    
    meta = {
        'collection': 'llm_audit_logs',
        'indexes': [
            ('user_id', 'created_at'),
            ('content_type', 'created_at'),
            ('prompt_hash',),
            ('user_id', 'week', 'content_type'),
        ]
    }
    
    def to_dict(self, include_raw_response: bool = False) -> Dict[str, Any]:
        """
        Convert to dictionary for API responses.
        
        Args:
            include_raw_response: Whether to include raw LLM response (admin only)
        
        Returns:
            Dictionary representation
        """
        result = {
            'id': str(self.id),
            'user_id': self.user_id,
            'content_type': self.content_type,
            'attempt_number': self.attempt_number,
            'week': self.week,
            'difficulty': self.difficulty,
            'tokens_used': self.tokens_used,
            'response_time_ms': self.response_time_ms,
            'parsing_success': self.parsing_success,
            'validation_success': self.validation_success,
            'duplicate_detected': self.duplicate_detected,
            'similarity_scores': self.similarity_scores,
            'error_type': self.error_type,
            'error_message': self.error_message,
            'created_at': self.created_at
        }
        
        if include_raw_response:
            result['raw_response'] = self.raw_response
            result['prompt_hash'] = self.prompt_hash
            
        return result


def log_llm_attempt(user_id: str, content_type: str, attempt_number: int, 
                   week: int, prompt_hash: str, raw_response: str,
                   difficulty: Optional[str] = None, rag_context_ids: Optional[list] = None,
                   tokens_used: int = 0, response_time_ms: int = 0,
                   parsing_success: bool = False, validation_success: bool = False,
                   duplicate_detected: bool = False, similarity_scores: Optional[list] = None,
                   error_type: Optional[str] = None, error_message: Optional[str] = None,
                   metadata: Optional[Dict[str, Any]] = None) -> Optional[LLMAuditLog]:
    """
    Helper function to log an LLM generation attempt.
    
    Args:
        user_id: User identifier
        content_type: Type of content ('quiz' or 'flashcard')
        attempt_number: Attempt number (1-3)
        week: Pregnancy week
        prompt_hash: SHA256 hash of the prompt
        raw_response: Raw LLM response
        difficulty: Difficulty level
        rag_context_ids: List of RAG context IDs used
        tokens_used: Number of tokens used
        response_time_ms: Response time in milliseconds
        parsing_success: Whether XML parsing succeeded
        validation_success: Whether validation succeeded
        duplicate_detected: Whether duplicates were detected
        similarity_scores: List of similarity scores
        error_type: Type of error if any
        error_message: Error message if any
        metadata: Additional metadata
    
    Returns:
        Created LLMAuditLog instance
    """
    try:
        # Redact sensitive information from raw response
        redacted_response = _redact_sensitive_info(raw_response)
        
        audit_log = LLMAuditLog(
            user_id=user_id,
            content_type=content_type,
            attempt_number=attempt_number,
            week=week,
            difficulty=difficulty or '',
            rag_context_ids=rag_context_ids or [],
            prompt_hash=prompt_hash,
            raw_response=redacted_response,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
            parsing_success=parsing_success,
            validation_success=validation_success,
            duplicate_detected=duplicate_detected,
            similarity_scores=similarity_scores or [],
            error_type=error_type,
            error_message=error_message,
            metadata=metadata or {}
        )
        
        audit_log.save()
        
        logger.debug(
            "LLM attempt logged",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "attempt_number": attempt_number,
                    "week": week,
                    "parsing_success": parsing_success,
                    "duplicate_detected": duplicate_detected
                }
            }
        )
        
        return audit_log
        
    except Exception as e:
        logger.error(
            "Failed to log LLM attempt",
            extra={
                "extra_fields": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "attempt_number": attempt_number,
                    "error": str(e)
                }
            }
        )
        # Don't raise - audit logging should not break the main flow
        return None


def _redact_sensitive_info(raw_response: str) -> str:
    """
    Redact sensitive information from raw LLM response.
    
    Args:
        raw_response: Raw response from LLM
        
    Returns:
        Redacted response
    """
    if not raw_response:
        return raw_response
    
    # For now, we'll keep the full response since it's educational content
    # In the future, we might redact personal information if present
    # This is a placeholder for more sophisticated redaction logic
    
    # Basic redaction of potential sensitive patterns
    import re
    
    # Redact email-like patterns
    redacted = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]', raw_response)
    
    # Redact phone-like patterns
    redacted = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE_REDACTED]', redacted)
    
    # Redact SSN-like patterns
    redacted = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]', redacted)
    
    return redacted

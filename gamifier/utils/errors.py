"""
Custom exceptions for the Gamifier service.
"""


class GamifierError(Exception):
    """Base exception for all gamifier-related errors."""
    pass


class LimitExceeded(GamifierError):
    """Raised when user has exceeded daily limits (quizzes, flashcards, etc.)."""
    pass


class DuplicateContentError(GamifierError):
    """Raised when content is too similar to existing content."""
    pass


class NotFoundError(GamifierError):
    """Raised when a requested resource is not found."""
    pass


class BadRequestError(GamifierError):
    """Raised when a request contains invalid data."""
    pass


class UnauthorizedError(GamifierError):
    """Raised when user is not authorized to perform an action."""
    pass


class ValidationError(GamifierError):
    """Raised when data validation fails."""
    pass


class ServiceUnavailableError(GamifierError):
    """Raised when external services are unavailable."""
    pass


class SessionTimeoutError(GamifierError):
    """Raised when a quiz session has timed out."""
    pass

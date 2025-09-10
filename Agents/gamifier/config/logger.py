"""
Logger configuration for the Gamifier service.
"""

import os
import logging
import json
from datetime import datetime, timezone
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "module": record.name,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)
            
        return json.dumps(log_entry)


def _get_log_level() -> int:
    """Get log level from environment variable."""
    env_level = os.getenv("LOG_LEVEL", "INFO").upper()
    level_map = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL
    }
    return level_map.get(env_level, logging.INFO)


def _setup_logging() -> None:
    """Set up logging configuration."""
    # Remove existing handlers to avoid duplication
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    
    # Configure root logger
    logging.basicConfig(
        level=_get_log_level(),
        handlers=[console_handler],
        force=True
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name (typically __name__ of the module)
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Ensure logging is configured
    if not logging.getLogger().handlers:
        _setup_logging()
    
    logger = logging.getLogger(name)
    
    # Add convenience method for logging with extra fields
    def log_with_extra(level: int, msg: str, extra_fields: Dict[str, Any] = None):
        """Log message with extra fields."""
        if extra_fields:
            old_factory = logging.getLogRecordFactory()
            
            def record_factory(*args, **kwargs):
                record = old_factory(*args, **kwargs)
                record.extra_fields = extra_fields
                return record
            
            logging.setLogRecordFactory(record_factory)
            logger.log(level, msg)
            logging.setLogRecordFactory(old_factory)
        else:
            logger.log(level, msg)
    
    # Add the extra method to logger
    logger.log_with_extra = log_with_extra
    
    return logger


# Initialize logging on module import
_setup_logging()

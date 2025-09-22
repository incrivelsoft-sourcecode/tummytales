"""
Main Flask application factory for the Gamifier service.
"""


from flask import Flask, jsonify, request, redirect, url_for
from typing import Optional
from config.env_loader import get_config, Config
from config.db import init_db
from config.logger import get_logger
from utils.errors import (
    LimitExceeded, DuplicateContentError, NotFoundError, 
    UnauthorizedError, BadRequestError, ServiceUnavailableError,
    SessionTimeoutError, ValidationError
)

logger = get_logger(__name__)

# Try to import CORS, but don't fail if not available
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    logger.warning("flask-cors not available, CORS headers will not be set")


def create_app(config: Optional[Config] = None):
    """
    Create and configure the Flask application using factory pattern.
    
    Args:
        config: Configuration object. If None, loads from environment.
        
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    if config is None:
        config = get_config()
    app.config.update(config.__dict__)
    
    # Initialize logger first
    logger.info("Initializing Gamifier service", extra={
        "extra_fields": {
            "flask_env": config.FLASK_ENV,
            "debug_mode": config.FLASK_ENV == "development"
        }
    })
    
    # Initialize database
    init_db(config)
    logger.info("Database initialized successfully")
    
    # Initialize Pinecone (RAG service)
    try:
        from services.rag_service import RAGService
        rag_service = RAGService()
        rag_service.init_index()
        logger.info("Pinecone RAG service initialized successfully")
    except Exception as e:
        logger.warning("Failed to initialize Pinecone RAG service", extra={
            "extra_fields": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
    
    # Initialize embedding model
    try:
        from services.embeddings import EmbeddingService
        embedding_service = EmbeddingService()
        logger.info("Embedding service initialized successfully")
    except ImportError:
        logger.warning("Embedding service not available, skipping initialization")
    except Exception as e:
        logger.warning("Failed to initialize embedding service", extra={
            "extra_fields": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
    
    # Configure CORS
    cors_origins = getattr(config, 'CORS_ORIGINS', 'http://localhost:3000').split(',')
    if CORS_AVAILABLE:
        CORS(app, origins=cors_origins, supports_credentials=True)
        logger.info("CORS configured with flask-cors", extra={
            "extra_fields": {
                "allowed_origins": cors_origins
            }
        })
    else:
        # Manual CORS headers if flask-cors not available
        @app.after_request
        def after_request(response):
            origin = request.headers.get('Origin')
            if origin in cors_origins or cors_origins == ['*']:
                response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
        
        logger.info("CORS configured manually", extra={
            "extra_fields": {
                "allowed_origins": cors_origins
            }
        })
    
    # HTTPS redirect for production
    @app.before_request
    def force_https():
        if config.FLASK_ENV != 'development':
            if not request.is_secure and 'localhost' not in request.host:
                return redirect(request.url.replace('http://', 'https://'))
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    register_blueprints(app)
    
    logger.info("Gamifier service started successfully", extra={
        "extra_fields": {
            "blueprints_registered": [
                "health", "flashcard", "quiz", "streak", "rewards", "stats"
            ]
        }
    })
    
    return app


def register_blueprints(app: Flask):
    """Register all application blueprints."""
    from controllers.health_controller import health_bp
    from controllers.flashcard_controller import flashcard_bp
    from controllers.quiz_controller import quiz_bp
    from controllers.streak_controller import streak_bp
    from controllers.rewards_controller import rewards_bp
    from controllers.stats_controller import stats_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(flashcard_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(streak_bp)
    app.register_blueprint(rewards_bp)
    app.register_blueprint(stats_bp)


def register_error_handlers(app: Flask):
    """Register custom error handlers for common exceptions."""
    
    @app.errorhandler(LimitExceeded)
    def handle_limit_exceeded(error):
        logger.warning("Rate limit exceeded", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint,
                "user_agent": request.headers.get('User-Agent', '')
            }
        })
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': str(error),
            'error_code': 'LIMIT_EXCEEDED'
        }), 429
    
    @app.errorhandler(DuplicateContentError)
    def handle_duplicate_content(error):
        logger.warning("Duplicate content detected", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint
            }
        })
        return jsonify({
            'error': 'Duplicate content',
            'message': str(error),
            'error_code': 'DUPLICATE_CONTENT'
        }), 409
    
    @app.errorhandler(NotFoundError)
    def handle_not_found(error):
        logger.info("Resource not found", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint,
                "path": request.path
            }
        })
        return jsonify({
            'error': 'Resource not found',
            'message': str(error),
            'error_code': 'NOT_FOUND'
        }), 404
    
    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized(error):
        logger.warning("Unauthorized access attempt", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint,
                "ip_address": request.remote_addr
            }
        })
        return jsonify({
            'error': 'Unauthorized',
            'message': str(error),
            'error_code': 'UNAUTHORIZED'
        }), 401
    
    @app.errorhandler(BadRequestError)
    def handle_bad_request(error):
        logger.warning("Bad request received", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint
            }
        })
        return jsonify({
            'error': 'Bad request',
            'message': str(error),
            'error_code': 'BAD_REQUEST'
        }), 400
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        logger.warning("Validation error", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint
            }
        })
        return jsonify({
            'error': 'Validation failed',
            'message': str(error),
            'error_code': 'VALIDATION_ERROR'
        }), 400
    
    @app.errorhandler(SessionTimeoutError)
    def handle_session_timeout(error):
        logger.info("Session timeout occurred", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint
            }
        })
        return jsonify({
            'error': 'Session timeout',
            'message': str(error),
            'error_code': 'SESSION_TIMEOUT'
        }), 408
    
    @app.errorhandler(ServiceUnavailableError)
    def handle_service_unavailable(error):
        logger.error("Service unavailable", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint
            }
        })
        return jsonify({
            'error': 'Service unavailable',
            'message': str(error),
            'error_code': 'SERVICE_UNAVAILABLE'
        }), 503
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.error("Internal server error", extra={
            "extra_fields": {
                "error_message": str(error),
                "endpoint": request.endpoint,
                "path": request.path
            }
        })
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred',
            'error_code': 'INTERNAL_ERROR'
        }), 500


if __name__ == "__main__":
    app = create_app()
    # Use port 5002 to avoid conflict with macOS AirPlay on port 5000
    app.run(debug=True, host="0.0.0.0", port=5002)

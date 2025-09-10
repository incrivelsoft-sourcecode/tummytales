"""
Authentication middleware for JWT token validation in the Gamifier service.
Provides decorators for Flask routes requiring authentication.
"""

import os
try:
    import jwt
except ImportError:
    import PyJWT as jwt
from functools import wraps
from typing import List, Union
from flask import request, jsonify, g
from config.logger import get_logger

logger = get_logger(__name__)


def auth_required(f):
    """
    Decorator that requires valid JWT token.
    Sets g.user_id from the decoded JWT payload.
    
    Args:
        f: Flask route function to protect
        
    Returns:
        Decorated function with authentication check
        
    Raises:
        401: If no token provided or token is invalid
        403: If token is valid but user lacks required permissions
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning("No authorization header provided", extra={
                "extra_fields": {
                    "endpoint": request.endpoint,
                    "method": request.method,
                    "path": request.path
                }
            })
            return jsonify({'error': 'No token, authorization denied'}), 401
        
        try:
            # Extract Bearer token
            token_parts = auth_header.split(' ')
            if len(token_parts) != 2 or token_parts[0].lower() != 'bearer':
                logger.warning("Invalid authorization header format", extra={
                    "extra_fields": {
                        "auth_header": auth_header[:20] + "..." if len(auth_header) > 20 else auth_header,
                        "endpoint": request.endpoint
                    }
                })
                return jsonify({'error': 'Invalid authorization header format'}), 401
            
            token = token_parts[1]
            
            # Decode JWT token
            jwt_secret = os.getenv('JWT_SECRET') or os.getenv('SECRET_KEY')
            if not jwt_secret:
                logger.error("JWT_SECRET environment variable not set")
                return jsonify({'error': 'Authentication service unavailable'}), 503
            
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # Extract user ID from token payload
            user_id = decoded.get('userId')
            if not user_id:
                logger.warning("Token missing userId field", extra={
                    "extra_fields": {
                        "token_payload_keys": list(decoded.keys()),
                        "endpoint": request.endpoint
                    }
                })
                return jsonify({'error': 'Invalid token payload'}), 401
            
            # Set user context for route handlers
            g.user_id = str(user_id)
            g.user_role = decoded.get('role')
            g.user_email = decoded.get('email')
            g.user_name = decoded.get('user_name') or decoded.get('name')
            g.permissions = decoded.get('permissions', [])
            
            logger.info("Authentication successful", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "user_role": g.user_role,
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired", extra={
                "extra_fields": {
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            return jsonify({'error': 'Token has expired'}), 401
            
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid token provided", extra={
                "extra_fields": {
                    "error": str(e),
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            return jsonify({'error': 'Token is not valid'}), 401
            
        except Exception as e:
            logger.error("Authentication error", extra={
                "extra_fields": {
                    "error": str(e),
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            return jsonify({'error': 'Authentication service error'}), 500
    
    return decorated


def auth_optional(f):
    """
    Decorator that allows optional JWT token authentication.
    Sets g.user_id if token is present and valid, otherwise continues without auth.
    
    Args:
        f: Flask route function to optionally protect
        
    Returns:
        Decorated function with optional authentication check
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            # No token provided, continue without authentication
            g.user_id = None
            g.user_role = None
            g.user_email = None
            g.user_name = None
            return f(*args, **kwargs)
        
        try:
            # Extract Bearer token
            token_parts = auth_header.split(' ')
            if len(token_parts) != 2 or token_parts[0].lower() != 'bearer':
                # Invalid format, continue without authentication
                g.user_id = None
                g.user_role = None
                g.user_email = None
                g.user_name = None
                return f(*args, **kwargs)
            
            token = token_parts[1]
            
            # Decode JWT token
            jwt_secret = os.getenv('JWT_SECRET')
            if not jwt_secret:
                logger.warning("JWT_SECRET environment variable not set for optional auth")
                g.user_id = None
                g.user_role = None
                g.user_email = None
                g.user_name = None
                return f(*args, **kwargs)
            
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # Extract user information from token payload
            user_id = decoded.get('userId')
            if user_id:
                g.user_id = str(user_id)
                g.user_role = decoded.get('role')
                g.user_email = decoded.get('email')
                g.user_name = decoded.get('user_name')
                
                logger.info("Optional authentication successful", extra={
                    "extra_fields": {
                        "user_id": g.user_id,
                        "user_role": g.user_role,
                        "endpoint": request.endpoint,
                        "method": request.method
                    }
                })
            else:
                g.user_id = None
                g.user_role = None
                g.user_email = None
                g.user_name = None
            
            return f(*args, **kwargs)
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            # Token invalid or expired, continue without authentication
            logger.info("Optional authentication failed, continuing without auth", extra={
                "extra_fields": {
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            g.user_id = None
            g.user_role = None
            g.user_email = None
            g.user_name = None
            return f(*args, **kwargs)
            
        except Exception as e:
            # Unexpected error, continue without authentication
            logger.warning("Optional authentication error, continuing without auth", extra={
                "extra_fields": {
                    "error": str(e),
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            g.user_id = None
            g.user_role = None
            g.user_email = None
            g.user_name = None
            return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """
    Decorator that requires admin role or internal service token.
    Used for administrative endpoints like flashcard generation.
    
    Args:
        f: Flask route function requiring admin access
        
    Returns:
        Decorated function with admin check
        
    Raises:
        401: If no token provided or token is invalid
        403: If token is valid but user is not admin
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # First check for authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token, authorization denied'}), 401
        
        try:
            # Extract Bearer token
            token_parts = auth_header.split(' ')
            if len(token_parts) != 2 or token_parts[0].lower() != 'bearer':
                return jsonify({'error': 'Invalid authorization header format'}), 401
            
            token = token_parts[1]
            
            # Check for internal service token first
            internal_token = os.getenv('INTERNAL_SERVICE_TOKEN')
            if internal_token and token == internal_token:
                g.user_id = 'internal_service'
                g.user_role = 'admin'
                g.user_email = None
                g.user_name = 'Internal Service'
                
                logger.info("Internal service authentication successful", extra={
                    "extra_fields": {
                        "endpoint": request.endpoint,
                        "method": request.method
                    }
                })
                
                return f(*args, **kwargs)
            
            # Decode JWT token for user authentication
            jwt_secret = os.getenv('JWT_SECRET')
            if not jwt_secret:
                return jsonify({'error': 'Authentication service unavailable'}), 503
            
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # Check if user has admin role
            user_role = decoded.get('role')
            if user_role != 'admin':
                logger.warning("Non-admin user attempted admin access", extra={
                    "extra_fields": {
                        "user_id": decoded.get('userId'),
                        "user_role": user_role,
                        "endpoint": request.endpoint
                    }
                })
                return jsonify({'error': 'Admin access required'}), 403
            
            # Set user context for route handlers
            g.user_id = str(decoded.get('userId'))
            g.user_role = user_role
            g.user_email = decoded.get('email')
            g.user_name = decoded.get('user_name')
            
            logger.info("Admin authentication successful", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "endpoint": request.endpoint,
                    "method": request.method
                }
            })
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
            
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is not valid'}), 401
            
        except Exception as e:
            logger.error("Admin authentication error", extra={
                "extra_fields": {
                    "error": str(e),
                    "endpoint": request.endpoint
                }
            })
            return jsonify({'error': 'Authentication service error'}), 500
    
    return decorated


def require_roles(allowed_roles: Union[List[str], str]):
    """
    Decorator factory that enforces role-based access control.
    Must be used in combination with auth_required.
    
    Args:
        allowed_roles: Single role string or list of allowed roles
        
    Returns:
        Decorator function that checks user roles
        
    Usage:
        @auth_required
        @require_roles(['admin', 'moderator'])
        def admin_endpoint():
            pass
            
        @auth_required
        @require_roles('admin')
        def admin_only_endpoint():
            pass
    """
    # Convert single role to list for consistency
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Check if user is authenticated (should be done by auth_required)
            if not hasattr(g, 'user_id') or not g.user_id:
                logger.warning("Role check attempted without authentication", extra={
                    "extra_fields": {
                        "endpoint": request.endpoint,
                        "required_roles": allowed_roles
                    }
                })
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = getattr(g, 'user_role', None)
            user_permissions = getattr(g, 'permissions', [])
            
            # Check if user has required role
            has_role = user_role in allowed_roles if user_role else False
            
            # Also check permissions (for more granular control)
            has_permission = any(perm in allowed_roles for perm in user_permissions)
            
            if not (has_role or has_permission):
                logger.warning("Access denied - insufficient permissions", extra={
                    "extra_fields": {
                        "user_id": g.user_id,
                        "user_role": user_role,
                        "user_permissions": user_permissions,
                        "required_roles": allowed_roles,
                        "endpoint": request.endpoint
                    }
                })
                return jsonify({
                    'error': 'Access denied',
                    'message': f'Requires one of: {", ".join(allowed_roles)}',
                    'user_role': user_role
                }), 403
            
            logger.info("Role authorization successful", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "user_role": user_role,
                    "required_roles": allowed_roles,
                    "endpoint": request.endpoint
                }
            })
            
            return f(*args, **kwargs)
            
        return decorated
    return decorator

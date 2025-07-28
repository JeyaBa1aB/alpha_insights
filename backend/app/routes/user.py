"""
User profile routes blueprint.
Handles user profile management and settings.
"""

import jwt
import logging
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash

from .auth import decode_jwt

logger = logging.getLogger(__name__)

user_bp = Blueprint('user_bp', __name__)

def require_auth():
    """Helper function to require authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
        
    token = auth_header.split(' ')[1]
    payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
    return payload

@user_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """Get current user's profile"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Get user from database
        from bson import ObjectId
        user = current_app.db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Format user profile response
        profile = {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'role': user.get('role', 'user'),
            'createdAt': user.get('createdAt', user.get('_id').generation_time).isoformat() + 'Z',
            'lastLogin': user.get('lastLogin').isoformat() + 'Z' if user.get('lastLogin') else None,
            'isActive': user.get('isActive', True)
        }
        
        return jsonify({
            'success': True,
            'data': profile
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to fetch profile'}), 500

@user_bp.route('/profile', methods=['PUT'])
def update_user_profile():
    """Update current user's profile"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Build update document
        update_fields = {}
        
        # Validate and update username
        if 'username' in data:
            username = data['username'].strip()
            if not username:
                return jsonify({'error': 'Username cannot be empty'}), 400
            if len(username) < 3:
                return jsonify({'error': 'Username must be at least 3 characters'}), 400
            
            # Check if username is already taken by another user
            from bson import ObjectId
            existing_user = current_app.db.users.find_one({
                'username': username,
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return jsonify({'error': 'Username already taken'}), 409
            
            update_fields['username'] = username
        
        # Validate and update email
        if 'email' in data:
            email = data['email'].strip().lower()
            if not email:
                return jsonify({'error': 'Email cannot be empty'}), 400
            
            # Basic email validation
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken by another user
            from bson import ObjectId
            existing_user = current_app.db.users.find_one({
                'email': email,
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return jsonify({'error': 'Email already taken'}), 409
            
            update_fields['email'] = email
        
        # Handle password change
        if 'currentPassword' in data and 'newPassword' in data:
            current_password = data['currentPassword']
            new_password = data['newPassword']
            
            if not current_password or not new_password:
                return jsonify({'error': 'Both current and new passwords are required'}), 400
            
            # Get current user to verify password
            from bson import ObjectId
            user = current_app.db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Verify current password
            if not check_password_hash(user['password_hash'], current_password):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            # Validate new password
            if len(new_password) < 6:
                return jsonify({'error': 'New password must be at least 6 characters'}), 400
            
            # Hash new password
            update_fields['password_hash'] = generate_password_hash(new_password)
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add updated timestamp
        update_fields['updatedAt'] = datetime.utcnow()
        
        # Update user in database
        from bson import ObjectId
        result = current_app.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"Profile updated for user: {user_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Profile updated successfully'}
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@user_bp.route('/settings', methods=['GET'])
def get_user_settings():
    """Get user settings and preferences"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Get user settings from database or return defaults
        from bson import ObjectId
        user = current_app.db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Default settings
        settings = user.get('settings', {
            'notifications': {
                'email': True,
                'push': True,
                'priceAlerts': True,
                'portfolioUpdates': True,
                'marketNews': False
            },
            'display': {
                'theme': 'light',
                'currency': 'USD',
                'dateFormat': 'MM/DD/YYYY',
                'timeFormat': '12h'
            },
            'privacy': {
                'profileVisible': False,
                'portfolioVisible': False,
                'activityVisible': False
            }
        })
        
        return jsonify({
            'success': True,
            'data': settings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Get settings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch settings'}), 500

@user_bp.route('/settings', methods=['PUT'])
def update_user_settings():
    """Update user settings and preferences"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No settings data provided'}), 400
        
        # Update user settings in database
        from bson import ObjectId
        result = current_app.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'settings': data,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"Settings updated for user: {user_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Settings updated successfully'}
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Update settings error: {str(e)}")
        return jsonify({'error': 'Failed to update settings'}), 500
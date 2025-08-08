"""
Authentication routes blueprint.
Handles user signup, login, and password reset functionality.
"""

import jwt
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash

from ..models import create_user, get_user_collection, update_user_login

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth_bp', __name__)

def generate_jwt(user):
    """Generate JWT token for authenticated user"""
    payload = {
        'user_id': str(user['_id']),
        'username': user['username'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=current_app.config['JWT_EXPIRATION_HOURS'])
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm=current_app.config['JWT_ALGORITHM'])
    return token

def decode_jwt(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
        logger.info(f"JWT decode successful, payload type: {type(payload)}, value: {payload}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT token invalid: {e}")
        return None

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        # Always force role to 'user' for public signup
        role = 'user'
        
        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if get_user_collection(current_app.db).find_one({'email': email}):
            return jsonify({'error': 'Email already exists'}), 409
        
        password_hash = generate_password_hash(password)
        user_id = create_user(current_app.db, username, email, password_hash, role)
        
        logger.info(f"New user created: {username} ({email})")
        return jsonify({'message': 'User created', 'user_id': str(user_id)}), 201
        
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        user = get_user_collection(current_app.db).find_one({'email': email})
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login timestamp
        update_user_login(current_app.db, user['_id'])
        
        token = generate_jwt(user)
        
        logger.info(f"User logged in: {user['username']}")
        return jsonify({
            'message': 'Login successful', 
            'token': token, 
            'user': {
                'username': user['username'], 
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Password reset endpoint"""
    try:
        data = request.json
        email = data.get('email')
        new_password = data.get('new_password')
        
        user = get_user_collection(current_app.db).find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        password_hash = generate_password_hash(new_password)
        get_user_collection(current_app.db).update_one(
            {'email': email}, 
            {'$set': {'password_hash': password_hash}}
        )
        
        logger.info(f"Password reset for user: {email}")
        return jsonify({'message': 'Password updated'}), 200
        
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        return jsonify({'error': 'Password reset failed'}), 500
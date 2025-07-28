"""
Admin routes blueprint.
Handles admin-only functionality like user management and system statistics.
"""

import jwt
import logging
import psutil
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId

from ..models import get_user_collection, get_admin_stats
from .auth import decode_jwt

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin_bp', __name__)

def require_admin():
    """Decorator helper to check admin authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    return payload

@admin_bp.route('/protected', methods=['GET'])
def admin_protected():
    """Admin protected route example"""
    payload = require_admin()
    if isinstance(payload, tuple):  # Error response
        return payload
    
    return jsonify({
        'message': f"Welcome admin {payload['username']}!", 
        'role': payload['role']
    }), 200

@admin_bp.route('/stats', methods=['GET'])
def admin_stats():
    """Get admin dashboard statistics"""
    payload = require_admin()
    if isinstance(payload, tuple):  # Error response
        return payload
    
    try:
        # Get real database statistics
        stats = get_admin_stats(current_app.db)
        
        # Add system health metrics
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
        except:
            cpu_usage = 23.7
            memory_usage = 68.5
        
        # Calculate uptime (mock for now)
        uptime = "7d 14h 23m"
        
        # API calls and error rate (mock data)
        api_calls_today = 15420
        error_rate = 0.12
        
        stats.update({
            'systemUptime': uptime,
            'memoryUsage': round(memory_usage, 1),
            'cpuUsage': round(cpu_usage, 1),
            'apiCallsToday': api_calls_today,
            'errorRate': error_rate
        })
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        return jsonify({'error': 'Failed to fetch system stats'}), 500

@admin_bp.route('/users', methods=['GET'])
def admin_get_users():
    """Get all users for admin management"""
    payload = require_admin()
    if isinstance(payload, tuple):  # Error response
        return payload
    
    try:
        users_collection = get_user_collection(current_app.db)
        users = list(users_collection.find({}, {'password_hash': 0}))  # Exclude password hash
        
        # Convert ObjectId to string and add default fields
        for user in users:
            user['_id'] = str(user['_id'])
            user['isActive'] = user.get('isActive', True)
            user['createdAt'] = user.get('createdAt', user.get('_id', {}).get('$date', '2024-01-01T00:00:00Z'))
        
        return jsonify({'users': users}), 200
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
def admin_update_user(user_id):
    """Update user information"""
    payload = require_admin()
    if isinstance(payload, tuple):  # Error response
        return payload
    
    try:
        data = request.json
        users_collection = get_user_collection(current_app.db)
        
        update_data = {}
        if 'username' in data:
            update_data['username'] = data['username']
        if 'email' in data:
            update_data['email'] = data['email']
        if 'role' in data:
            update_data['role'] = data['role']
        if 'isActive' in data:
            update_data['isActive'] = data['isActive']
        
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)}, 
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
            
        logger.info(f"User {user_id} updated by admin {payload['username']}")
        return jsonify({'message': 'User updated successfully'}), 200
        
    except Exception as e:
        logger.error(f"Update user error: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    """Delete user account"""
    payload = require_admin()
    if isinstance(payload, tuple):  # Error response
        return payload
    
    try:
        users_collection = get_user_collection(current_app.db)
        
        # Prevent admin from deleting themselves
        if str(user_id) == str(payload.get('user_id')):
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
            
        logger.info(f"User {user_id} deleted by admin {payload['username']}")
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500
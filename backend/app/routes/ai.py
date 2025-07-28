"""
AI routes blueprint.
Handles AI chat functionality, conversation history, and analytics.
"""

import logging
from flask import Blueprint, request, jsonify, current_app

from ..services.ai_service import ai_service
from .auth import decode_jwt

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai_bp', __name__)

@ai_bp.route('/chat', methods=['POST'])
def ai_chat():
    """AI chat endpoint"""
    try:
        data = request.json
        user_message = data.get('message', '')
        user_context = data.get('context', {})
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get user ID from JWT if available
        auth_header = request.headers.get('Authorization')
        user_id = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = decode_jwt(token)
            if payload:
                user_id = payload.get('user_id')
                user_context['user_id'] = user_id
        
        response = ai_service.route_query(user_message, user_context)
        return jsonify({'success': True, 'data': response}), 200
        
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return jsonify({'error': 'Failed to process AI request'}), 500

@ai_bp.route('/history', methods=['GET'])
def get_ai_history():
    """Get AI conversation history"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        agent_name = request.args.get('agent')
        history = ai_service.get_conversation_history(agent_name)
        
        return jsonify({'success': True, 'data': history}), 200
        
    except Exception as e:
        logger.error(f"AI history error: {e}")
        return jsonify({'error': 'Failed to fetch conversation history'}), 500

@ai_bp.route('/clear-history', methods=['POST'])
def clear_ai_history():
    """Clear AI conversation history"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.json
        agent_name = data.get('agent') if data else None
        
        ai_service.clear_conversation_history(agent_name)
        return jsonify({'success': True, 'message': 'History cleared'}), 200
        
    except Exception as e:
        logger.error(f"Clear history error: {e}")
        return jsonify({'error': 'Failed to clear history'}), 500

@ai_bp.route('/analytics', methods=['GET'])
def get_ai_analytics():
    """Get user's AI conversation analytics"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        analytics = ai_service.get_user_conversation_analytics(user_id)
        
        return jsonify({'success': True, 'data': analytics}), 200
        
    except Exception as e:
        logger.error(f"AI analytics error: {e}")
        return jsonify({'error': 'Failed to get analytics'}), 500

@ai_bp.route('/suggestions', methods=['POST'])
def get_ai_suggestions():
    """Get AI-powered next action suggestions"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.json
        current_query = data.get('current_query', '') if data else ''
        user_id = payload.get('user_id')
        
        suggestions = ai_service.suggest_next_actions(user_id, current_query)
        
        return jsonify({
            'success': True,
            'data': {
                'suggestions': suggestions,
                'based_on_query': current_query
            }
        }), 200
        
    except Exception as e:
        logger.error(f"AI suggestions error: {e}")
        return jsonify({'error': 'Failed to get suggestions'}), 500

@ai_bp.route('/export-history', methods=['GET'])
def export_ai_history():
    """Export user's conversation history"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        agent_name = request.args.get('agent_name')  # Optional query parameter
        user_id = payload.get('user_id')
        
        history = ai_service.export_conversation_history(user_id, agent_name)
        
        return jsonify({'success': True, 'data': history}), 200
        
    except Exception as e:
        logger.error(f"AI export history error: {e}")
        return jsonify({'error': 'Failed to export history'}), 500

@ai_bp.route('/conversation-flow', methods=['GET'])
def get_conversation_flow():
    """Get conversation flow analysis"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        session_id = request.args.get('session_id')  # Optional
        
        flow_analysis = ai_service.get_conversation_flow_analysis(user_id, session_id)
        
        return jsonify({'success': True, 'data': flow_analysis}), 200
        
    except Exception as e:
        logger.error(f"Conversation flow analysis error: {e}")
        return jsonify({'error': 'Failed to analyze conversation flow'}), 500
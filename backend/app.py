from flask import Flask, request, jsonify, g
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pymongo import MongoClient
import redis
import os
import jwt
import logging
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from models import create_user, get_user_collection

# Import new services
from services.market_data import market_service
from services.ai_service import ai_service
from services.websocket_service import NotificationService, setup_websocket_handlers

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')

mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
mongo_client = MongoClient(mongo_uri)
db = mongo_client.get_database()

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = int(os.getenv('REDIS_PORT', 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)

# Initialize notification service
notification_service = NotificationService(socketio)
setup_websocket_handlers(socketio, notification_service)

@app.route('/')
def home():
    return 'Alpha Insights Flask Backend is running!'

# Signup endpoint
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    # Always force role to 'user' for public signup
    role = 'user'
    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if get_user_collection(db).find_one({'email': email}):
        return jsonify({'error': 'Email already exists'}), 409
    password_hash = generate_password_hash(password)
    user_id = create_user(db, username, email, password_hash, role)
    return jsonify({'message': 'User created', 'user_id': str(user_id)}), 201


# JWT utility functions
def generate_jwt(user):
    payload = {
        'user_id': str(user['_id']),
        'username': user['username'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

def decode_jwt(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = get_user_collection(db).find_one({'email': email})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = generate_jwt(user)
    return jsonify({'message': 'Login successful', 'token': token, 'user': {'username': user['username'], 'role': user['role']}}), 200


# Admin protected route example
@app.route('/admin/protected', methods=['GET'])
def admin_protected():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return jsonify({'message': f"Welcome admin {payload['username']}!", 'role': payload['role']}), 200

# Admin stats endpoint
@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get user statistics
        users_collection = get_user_collection(db)
        total_users = users_collection.count_documents({})
        
        # Calculate active users (users who logged in within last 24 hours)
        # For now, we'll use a mock value since we don't track login times yet
        active_users = max(1, int(total_users * 0.15))  # Assume 15% are active
        
        # Mock portfolio count (would come from portfolios collection)
        total_portfolios = max(0, int(total_users * 0.7))  # Assume 70% have portfolios
        
        # System health metrics (mock data for now)
        import psutil
        import time
        
        # Get actual system metrics if psutil is available
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
        except:
            # Fallback to mock data if psutil not available
            cpu_usage = 23.7
            memory_usage = 68.5
        
        # Calculate uptime (mock for now)
        uptime = "7d 14h 23m"
        
        # API calls and error rate (mock data)
        api_calls_today = 15420
        error_rate = 0.12
        
        stats = {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalPortfolios': total_portfolios,
            'systemUptime': uptime,
            'memoryUsage': round(memory_usage, 1),
            'cpuUsage': round(cpu_usage, 1),
            'apiCallsToday': api_calls_today,
            'errorRate': error_rate
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch system stats'}), 500

# Admin users management endpoints
@app.route('/admin/users', methods=['GET'])
def admin_get_users():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        users_collection = get_user_collection(db)
        users = list(users_collection.find({}, {'password_hash': 0}))  # Exclude password hash
        
        # Convert ObjectId to string and add default fields
        for user in users:
            user['_id'] = str(user['_id'])
            user['isActive'] = user.get('isActive', True)
            user['createdAt'] = user.get('createdAt', user.get('_id', {}).get('$date', '2024-01-01T00:00:00Z'))
        
        return jsonify({'users': users}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/admin/users/<user_id>', methods=['PUT'])
def admin_update_user(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        from bson import ObjectId
        data = request.json
        users_collection = get_user_collection(db)
        
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
            
        return jsonify({'message': 'User updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/admin/users/<user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    token = auth_header.split(' ')[1]
    payload = decode_jwt(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    if payload['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        from bson import ObjectId
        users_collection = get_user_collection(db)
        
        # Prevent admin from deleting themselves
        if str(user_id) == str(payload.get('user_id')):
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete user'}), 500

# Password reset endpoint (stub)
@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')
    user = get_user_collection(db).find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    password_hash = generate_password_hash(new_password)
    get_user_collection(db).update_one({'email': email}, {'$set': {'password_hash': password_hash}})
    return jsonify({'message': 'Password updated'}), 200

# ================================
# MARKET DATA API ENDPOINTS
# ================================

@app.route('/api/stocks/quote/<symbol>', methods=['GET'])
def get_stock_quote(symbol):
    """Get real-time stock quote"""
    try:
        quote = market_service.get_stock_quote(symbol.upper())
        if quote:
            return jsonify({'success': True, 'data': quote}), 200
        else:
            return jsonify({'error': 'Stock not found or data unavailable'}), 404
    except Exception as e:
        logger.error(f"Stock quote error: {e}")
        return jsonify({'error': 'Failed to fetch stock quote'}), 500

@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    """Search for stocks"""
    try:
        query = request.args.get('q', '')
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        results = market_service.search_stocks(query, limit)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        logger.error(f"Stock search error: {e}")
        return jsonify({'error': 'Failed to search stocks'}), 500

@app.route('/api/stocks/historical/<symbol>', methods=['GET'])
def get_historical_data(symbol):
    """Get historical stock data"""
    try:
        days = min(int(request.args.get('days', 30)), 365)
        data = market_service.get_historical_data(symbol.upper(), days)
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        logger.error(f"Historical data error: {e}")
        return jsonify({'error': 'Failed to fetch historical data'}), 500

@app.route('/api/stocks/company/<symbol>', methods=['GET'])
def get_company_info(symbol):
    """Get company information"""
    try:
        info = market_service.get_company_info(symbol.upper())
        if info:
            return jsonify({'success': True, 'data': info}), 200
        else:
            return jsonify({'error': 'Company information not available'}), 404
    except Exception as e:
        logger.error(f"Company info error: {e}")
        return jsonify({'error': 'Failed to fetch company information'}), 500

@app.route('/api/market/status', methods=['GET'])
def get_market_status():
    """Get market status and indices"""
    try:
        status = market_service.get_market_status()
        return jsonify({'success': True, 'data': status}), 200
    except Exception as e:
        logger.error(f"Market status error: {e}")
        return jsonify({'error': 'Failed to fetch market status'}), 500

# ================================
# AI CHAT API ENDPOINTS
# ================================

@app.route('/api/ai/chat', methods=['POST'])
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

@app.route('/api/ai/history', methods=['GET'])
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

@app.route('/api/ai/clear-history', methods=['POST'])
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

@app.route('/api/ai/analytics', methods=['GET'])
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

@app.route('/api/ai/suggestions', methods=['POST'])
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

@app.route('/api/ai/export-history', methods=['GET'])
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

@app.route('/api/ai/conversation-flow', methods=['GET'])
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

# ================================
# NOTIFICATIONS API ENDPOINTS
# ================================

@app.route('/api/notifications/alerts', methods=['GET'])
def get_user_alerts():
    """Get user's price alerts"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        alerts = notification_service.get_user_alerts(user_id)
        
        return jsonify({'success': True, 'data': alerts}), 200
        
    except Exception as e:
        logger.error(f"Get alerts error: {e}")
        return jsonify({'error': 'Failed to fetch alerts'}), 500

@app.route('/api/notifications/alerts', methods=['POST'])
def create_price_alert():
    """Create a price alert"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        data = request.json
        
        required_fields = ['symbol', 'condition', 'target_price']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        alert_id = notification_service.add_price_alert(user_id, data)
        return jsonify({'success': True, 'alert_id': alert_id}), 201
        
    except Exception as e:
        logger.error(f"Create alert error: {e}")
        return jsonify({'error': 'Failed to create alert'}), 500

@app.route('/api/notifications/alerts/<alert_id>', methods=['DELETE'])
def delete_price_alert(alert_id):
    """Delete a price alert"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        success = notification_service.remove_price_alert(user_id, alert_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Alert deleted'}), 200
        else:
            return jsonify({'error': 'Alert not found or unauthorized'}), 404
        
    except Exception as e:
        logger.error(f"Delete alert error: {e}")
        return jsonify({'error': 'Failed to delete alert'}), 500

# ================================
# SYSTEM HEALTH API ENDPOINTS
# ================================

@app.route('/api/health', methods=['GET'])
def system_health():
    """System health check"""
    try:
        health = {
            'timestamp': datetime.now().isoformat(),
            'services': {
                'database': True,
                'redis': True,
                'market_data': market_service.health_check(),
                'ai_service': ai_service.health_check(),
                'notifications': notification_service.get_stats()
            }
        }
        
        # Test database
        try:
            db.command('ping')
        except:
            health['services']['database'] = False
        
        # Test Redis
        try:
            redis_client.ping()
        except:
            health['services']['redis'] = False
        
        return jsonify({'success': True, 'data': health}), 200
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({'error': 'Health check failed'}), 500

# WebSocket event for notifications
@socketio.on('send_notification')
def handle_notification(data):
    emit('receive_notification', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5003, use_reloader=False)

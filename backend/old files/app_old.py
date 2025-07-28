# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

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
from models import (
    create_user, get_user_collection, update_user_login,
    get_user_portfolio, create_portfolio, update_portfolio_value,
    create_transaction, get_portfolio_transactions, get_user_transactions,
    update_transaction, delete_transaction, calculate_holdings,
    get_all_articles, get_article_by_id, create_article,
    get_portfolio_stats, calculate_portfolio_performance,
    get_admin_stats, create_price_alert, get_user_price_alerts, delete_price_alert
)
from bson import ObjectId

# Import new services
from services.market_data import market_service
from services.ai_service import ai_service
from services.websocket_service import NotificationService, setup_websocket_handlers

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

# Initialize notification service with database
notification_service = NotificationService(socketio, db)
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
    
    # Update last login timestamp
    update_user_login(db, user['_id'])
    
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
        # Get real database statistics
        stats = get_admin_stats(db)
        
        # Add system health metrics
        import psutil
        
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
# PORTFOLIO API ENDPOINTS
# ================================

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio_summary():
    """Get portfolio summary with performance metrics - DATABASE DRIVEN"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get real portfolio stats from database
        portfolio_stats = get_portfolio_stats(db, user_id)
        
        # Format response to match frontend expectations
        portfolio_summary = {
            'totalValue': portfolio_stats['summary']['totalValue'],
            'dailyChange': 0,  # Would need market data integration for real-time changes
            'dailyChangePercent': 0,
            'totalGainLoss': portfolio_stats['summary']['totalGainLoss'],
            'totalGainLossPercent': portfolio_stats['summary']['totalGainLossPercent'],
            'cashBalance': 0,  # Would be stored separately in a real system
            'holdings': [],
            'performance': calculate_portfolio_performance(db, portfolio_stats['portfolio']['_id'])
        }
        
        # Format holdings for frontend
        for holding in portfolio_stats['holdings']:
            portfolio_summary['holdings'].append({
                'symbol': holding['symbol'],
                'name': holding['symbol'],  # Would get from market data service
                'shares': holding['totalShares'],
                'currentPrice': holding['averageCost'],  # Would get from market data
                'totalValue': holding['totalShares'] * holding['averageCost'],
                'dayChange': 0,  # Would calculate from market data
                'totalReturn': 0  # Would calculate from current vs average price
            })
        
        return jsonify({
            'success': True,
            'data': portfolio_summary
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio summary error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio summary'}), 500

@app.route('/api/portfolio/holdings', methods=['GET'])
def get_portfolio_holdings():
    """Get detailed portfolio holdings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Mock holdings data
        holdings = [
            {
                'id': '1',
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'shares': 150,
                'avgCost': 148.20,
                'currentPrice': 175.50,
                'totalValue': 26325.00,
                'totalCost': 22230.00,
                'unrealizedGain': 4095.00,
                'unrealizedGainPercent': 18.42,
                'dayChange': 2.1,
                'sector': 'Technology'
            },
            {
                'id': '2',
                'symbol': 'MSFT',
                'name': 'Microsoft Corp.',
                'shares': 80,
                'avgCost': 340.25,
                'currentPrice': 415.80,
                'totalValue': 33264.00,
                'totalCost': 27220.00,
                'unrealizedGain': 6044.00,
                'unrealizedGainPercent': 22.20,
                'dayChange': -0.8,
                'sector': 'Technology'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': holdings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio holdings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio holdings'}), 500

@app.route('/api/portfolio/risk-analysis', methods=['GET'])
def get_portfolio_risk_analysis():
    """Get portfolio risk analysis"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Mock risk analysis data
        risk_analysis = {
            'riskScore': 6.8,
            'volatility': 18.5,
            'sharpeRatio': 1.24,
            'beta': 1.15,
            'diversificationScore': 7.2,
            'recommendations': [
                'Consider reducing tech sector exposure from 75% to 60%',
                'Add defensive stocks like utilities or consumer staples',
                'International diversification recommended - currently 0%',
                'Consider adding bonds for stability (recommended 20-30%)'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': risk_analysis
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Risk analysis error: {str(e)}")
        return jsonify({'error': 'Failed to fetch risk analysis'}), 500

@app.route('/api/portfolio/performance', methods=['GET'])
def get_portfolio_performance():
    """Get portfolio performance data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        timeframe = request.args.get('timeframe', '6M')
        
        # Mock performance data based on timeframe
        if timeframe == '1M':
            performance_data = [
                {'date': '2025-06-27', 'value': 122500},
                {'date': '2025-07-04', 'value': 123800},
                {'date': '2025-07-11', 'value': 121200},
                {'date': '2025-07-18', 'value': 124600},
                {'date': '2025-07-27', 'value': 125847}
            ]
        elif timeframe == '3M':
            performance_data = [
                {'date': '2025-04-27', 'value': 108000},
                {'date': '2025-05-27', 'value': 115000},
                {'date': '2025-06-27', 'value': 122000},
                {'date': '2025-07-27', 'value': 125847}
            ]
        else:  # Default 6M
            performance_data = [
                {'date': '2025-01-27', 'value': 95000},
                {'date': '2025-02-27', 'value': 102000},
                {'date': '2025-03-27', 'value': 98000},
                {'date': '2025-04-27', 'value': 108000},
                {'date': '2025-05-27', 'value': 115000},
                {'date': '2025-06-27', 'value': 122000},
                {'date': '2025-07-27', 'value': 125847}
            ]
        
        return jsonify({
            'success': True,
            'data': performance_data
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio performance error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio performance'}), 500

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

@app.route('/api/create-test-user', methods=['POST'])
def create_test_user():
    """Create a test user for development purposes"""
    try:
        # Create test user
        test_user = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': generate_password_hash('password123')
        }
        
        users = get_user_collection()
        
        # Check if user already exists
        existing_user = users.find_one({'email': test_user['email']})
        if existing_user:
            return jsonify({'message': 'Test user already exists', 'email': test_user['email']}), 200
        
        # Insert test user
        result = users.insert_one(test_user)
        
        return jsonify({
            'message': 'Test user created successfully',
            'user_id': str(result.inserted_id),
            'email': test_user['email'],
            'password': 'password123'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create test user: {str(e)}")
        return jsonify({'error': 'Failed to create test user'}), 500

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

# ================================
# NEW DATABASE-DRIVEN API ENDPOINTS
# ================================

# Portfolio Holdings - Database Driven
@app.route('/api/portfolio/holdings', methods=['GET'])
def get_portfolio_holdings_db():
    """Get detailed portfolio holdings from database"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get portfolio stats from database
        portfolio_stats = get_portfolio_stats(db, user_id)
        holdings = []
        
        # Format holdings for frontend
        for i, holding in enumerate(portfolio_stats['holdings']):
            holdings.append({
                'id': str(i + 1),
                'symbol': holding['symbol'],
                'name': holding['symbol'],  # Would get company name from market data
                'shares': holding['totalShares'],
                'avgCost': holding['averageCost'],
                'currentPrice': holding['averageCost'],  # Would get from market data
                'totalValue': holding['totalShares'] * holding['averageCost'],
                'totalCost': holding['totalCost'],
                'unrealizedGain': 0,  # Would calculate with real market prices
                'unrealizedGainPercent': 0,
                'dayChange': 0,  # Would get from market data
                'sector': 'Unknown'  # Would get from market data
            })
        
        return jsonify({
            'success': True,
            'data': holdings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio holdings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio holdings'}), 500

# Portfolio Activity - Database Driven
@app.route('/api/portfolio/activity', methods=['GET'])
def get_portfolio_activity():
    """Get recent portfolio transactions"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get recent transactions
        transactions = get_user_transactions(db, user_id, limit=20)
        
        # Format for frontend
        activity = []
        for transaction in transactions:
            activity.append({
                'id': str(transaction['_id']),
                'symbol': transaction['symbol'],
                'type': transaction['type'],
                'shares': transaction['shares'],
                'price': transaction['price'],
                'totalValue': transaction['shares'] * transaction['price'],
                'date': transaction['transactionDate'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': activity
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio activity error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio activity'}), 500

# ================================
# TRANSACTION ENDPOINTS
# ================================

@app.route('/api/transactions', methods=['POST'])
def create_new_transaction():
    """Create a new buy/sell transaction"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        data = request.json
        symbol = data.get('symbol', '').upper()
        transaction_type = data.get('type', '').lower()
        shares = data.get('shares')
        price = data.get('price')
        
        # Validation
        if not symbol or not transaction_type or not shares or not price:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if transaction_type not in ['buy', 'sell']:
            return jsonify({'error': 'Transaction type must be buy or sell'}), 400
        
        try:
            shares = float(shares)
            price = float(price)
            if shares <= 0 or price <= 0:
                raise ValueError()
        except ValueError:
            return jsonify({'error': 'Shares and price must be positive numbers'}), 400
        
        # Get or create user's portfolio
        portfolio = get_user_portfolio(db, user_id)
        
        # Create transaction
        transaction_id = create_transaction(db, portfolio['_id'], symbol, transaction_type, shares, price)
        
        # Update portfolio total value (simplified calculation)
        portfolio_stats = get_portfolio_stats(db, user_id)
        update_portfolio_value(db, portfolio['_id'], portfolio_stats['summary']['totalValue'])
        
        return jsonify({
            'success': True,
            'message': 'Transaction created successfully',
            'transaction_id': str(transaction_id)
        }), 201
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Create transaction error: {str(e)}")
        return jsonify({'error': 'Failed to create transaction'}), 500

@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_existing_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        data = request.json
        updates = {}
        
        if 'symbol' in data:
            updates['symbol'] = data['symbol'].upper()
        if 'type' in data:
            if data['type'].lower() not in ['buy', 'sell']:
                return jsonify({'error': 'Transaction type must be buy or sell'}), 400
            updates['type'] = data['type'].lower()
        if 'shares' in data:
            try:
                shares = float(data['shares'])
                if shares <= 0:
                    raise ValueError()
                updates['shares'] = shares
            except ValueError:
                return jsonify({'error': 'Shares must be a positive number'}), 400
        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    raise ValueError()
                updates['price'] = price
            except ValueError:
                return jsonify({'error': 'Price must be a positive number'}), 400
        
        # Update transaction
        success = update_transaction(db, transaction_id, updates)
        
        if not success:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Update portfolio total value
        portfolio = get_user_portfolio(db, user_id)
        portfolio_stats = get_portfolio_stats(db, user_id)
        update_portfolio_value(db, portfolio['_id'], portfolio_stats['summary']['totalValue'])
        
        return jsonify({
            'success': True,
            'message': 'Transaction updated successfully'
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Update transaction error: {str(e)}")
        return jsonify({'error': 'Failed to update transaction'}), 500

@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_existing_transaction(transaction_id):
    """Delete a transaction"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Delete transaction
        success = delete_transaction(db, transaction_id)
        
        if not success:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Update portfolio total value
        portfolio = get_user_portfolio(db, user_id)
        portfolio_stats = get_portfolio_stats(db, user_id)
        update_portfolio_value(db, portfolio['_id'], portfolio_stats['summary']['totalValue'])
        
        return jsonify({
            'success': True,
            'message': 'Transaction deleted successfully'
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Delete transaction error: {str(e)}")
        return jsonify({'error': 'Failed to delete transaction'}), 500

# ================================
# EDUCATION ENDPOINTS
# ================================

@app.route('/api/education/articles', methods=['GET'])
def get_education_articles():
    """Get all education articles"""
    try:
        category = request.args.get('category')
        articles = get_all_articles(db, category)
        
        # Format for frontend
        formatted_articles = []
        for article in articles:
            formatted_articles.append({
                'id': str(article['_id']),
                'title': article['title'],
                'summary': article['summary'],
                'category': article['category'],
                'createdAt': article['createdAt'].isoformat(),
                'updatedAt': article.get('updatedAt', article['createdAt']).isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': formatted_articles
        })
        
    except Exception as e:
        logger.error(f"Get articles error: {str(e)}")
        return jsonify({'error': 'Failed to fetch articles'}), 500

@app.route('/api/education/articles/<article_id>', methods=['GET'])
def get_single_article(article_id):
    """Get a single article by ID"""
    try:
        article = get_article_by_id(db, article_id)
        
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        formatted_article = {
            'id': str(article['_id']),
            'title': article['title'],
            'summary': article['summary'],
            'content': article['content'],
            'category': article['category'],
            'createdAt': article['createdAt'].isoformat(),
            'updatedAt': article.get('updatedAt', article['createdAt']).isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': formatted_article
        })
        
    except Exception as e:
        logger.error(f"Get article error: {str(e)}")
        return jsonify({'error': 'Failed to fetch article'}), 500

# ================================
# USER PROFILE ENDPOINTS
# ================================

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get current user's profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        user = get_user_collection(db).find_one({'_id': ObjectId(user_id)}, {'password_hash': 0})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Format user data
        profile = {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'createdAt': user.get('createdAt', datetime.now()).isoformat(),
            'lastLogin': user.get('lastLogin').isoformat() if user.get('lastLogin') else None,
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

@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    """Update current user's profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        data = request.json
        updates = {}
        
        if 'username' in data:
            updates['username'] = data['username']
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = get_user_collection(db).find_one({
                'email': data['email'],
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return jsonify({'error': 'Email already taken'}), 409
            updates['email'] = data['email']
        
        if not updates:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update user
        result = get_user_collection(db).update_one(
            {'_id': ObjectId(user_id)},
            {'$set': updates}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

if __name__ == '__main__':
    # Add some sample education articles if none exist
    try:
        if get_all_articles(db) == []:
            sample_articles = [
                {
                    'title': 'Introduction to Stock Market Investing',
                    'summary': 'Learn the basics of stock market investing, including key concepts and terminology.',
                    'content': '# Introduction to Stock Market Investing\n\nThe stock market is a platform where shares of publicly traded companies are bought and sold...',
                    'category': 'Basics'
                },
                {
                    'title': 'Understanding Portfolio Diversification',
                    'summary': 'Discover how diversification can help reduce risk in your investment portfolio.',
                    'content': '# Understanding Portfolio Diversification\n\nDiversification is a risk management strategy that mixes a wide variety of investments...',
                    'category': 'Portfolio Management'
                },
                {
                    'title': 'Technical Analysis Fundamentals',
                    'summary': 'Learn the basics of technical analysis and how to read stock charts.',
                    'content': '# Technical Analysis Fundamentals\n\nTechnical analysis is the study of past market data, primarily price and volume...',
                    'category': 'Analysis'
                }
            ]
            
            for article_data in sample_articles:
                create_article(db, article_data['title'], article_data['summary'], 
                             article_data['content'], article_data['category'])
            
            logger.info("Sample education articles created")
    except Exception as e:
        logger.error(f"Failed to create sample articles: {e}")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
# ================================

# Initialize portfolio and analytics services
from services.portfolio_service import get_portfolio_service
from services.analytics_service import get_analytics_service

# Update notification service initialization to include database
notification_service = NotificationService(socketio, db)
setup_websocket_handlers(socketio, notification_service)

@app.route('/api/portfolio/real-time', methods=['GET'])
def get_real_time_portfolio():
    """Get real-time portfolio summary with live market data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get real-time portfolio data using the new service
        portfolio_service = get_portfolio_service(db)
        portfolio_summary = portfolio_service.get_portfolio_summary(user_id)
        
        return jsonify({
            'success': True,
            'data': portfolio_summary
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Real-time portfolio error: {str(e)}")
        return jsonify({'error': 'Failed to fetch real-time portfolio data'}), 500

@app.route('/api/portfolio/holdings/real-time', methods=['GET'])
def get_real_time_holdings():
    """Get portfolio holdings with real-time market prices"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get real-time holdings data
        portfolio_service = get_portfolio_service(db)
        holdings = portfolio_service.get_portfolio_holdings(user_id)
        
        return jsonify({
            'success': True,
            'data': holdings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Real-time holdings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch real-time holdings'}), 500

@app.route('/api/portfolio/analytics', methods=['GET'])
def get_portfolio_analytics():
    """Get comprehensive portfolio analytics including risk metrics and asset allocation"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get comprehensive analytics
        analytics_service = get_analytics_service(db)
        analytics = analytics_service.get_portfolio_analytics(user_id)
        
        return jsonify({
            'success': True,
            'data': analytics
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio analytics error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio analytics'}), 500

@app.route('/api/portfolio/asset-allocation', methods=['GET'])
def get_asset_allocation():
    """Get portfolio asset allocation by sector"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get asset allocation
        analytics_service = get_analytics_service(db)
        allocation = analytics_service.get_asset_allocation(user_id)
        
        return jsonify({
            'success': True,
            'data': allocation
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Asset allocation error: {str(e)}")
        return jsonify({'error': 'Failed to fetch asset allocation'}), 500

@app.route('/api/portfolio/risk-metrics', methods=['GET'])
def get_risk_metrics():
    """Get detailed portfolio risk metrics including Beta and Sharpe ratio"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
            
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get optional period parameter
        period_days = min(int(request.args.get('period', 252)), 365)  # Default 1 year, max 1 year
        
        # Get risk metrics
        analytics_service = get_analytics_service(db)
        risk_metrics = analytics_service.calculate_risk_metrics(user_id, period_days)
        
        return jsonify({
            'success': True,
            'data': risk_metrics
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Risk metrics error: {str(e)}")
        return jsonify({'error': 'Failed to fetch risk metrics'}), 500

# ================================
# DATABASE-DRIVEN NOTIFICATIONS API ENDPOINTS
# ================================

@app.route('/api/notifications/alerts', methods=['POST'])
def create_price_alert_db():
    """Create a price alert - DATABASE DRIVEN"""
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
        
        # Validate input
        symbol = data.get('symbol', '').upper()
        condition = data.get('condition', '').lower()
        target_price = data.get('target_price')
        
        if not symbol or condition not in ['above', 'below'] or not target_price:
            return jsonify({'error': 'Invalid alert configuration'}), 400
        
        try:
            target_price = float(target_price)
            if target_price <= 0:
                raise ValueError()
        except ValueError:
            return jsonify({'error': 'Target price must be a positive number'}), 400
        
        # Create alert using notification service
        alert_config = {
            'symbol': symbol,
            'condition': condition,
            'target_price': target_price
        }
        
        alert_id = notification_service.add_price_alert(user_id, alert_config)
        
        return jsonify({
            'success': True,
            'data': {'alert_id': alert_id},
            'message': f'Price alert created for {symbol}'
        }), 201
        
    except Exception as e:
        logger.error(f"Create alert error: {e}")
        return jsonify({'error': 'Failed to create alert'}), 500

@app.route('/api/notifications/alerts/<alert_id>', methods=['DELETE'])
def delete_price_alert_db(alert_id):
    """Delete a price alert - DATABASE DRIVEN"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload.get('user_id')
        
        # Delete alert using notification service
        success = notification_service.remove_price_alert(user_id, alert_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Alert deleted successfully'
            })
        else:
            return jsonify({'error': 'Alert not found or unauthorized'}), 404
        
    except Exception as e:
        logger.error(f"Delete alert error: {e}")
        return jsonify({'error': 'Failed to delete alert'}), 500

@app.route('/api/notifications/alerts', methods=['GET'])
def get_user_alerts_db():
    """Get user's price alerts - DATABASE DRIVEN"""
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

@app.route('/api/notifications/stats', methods=['GET'])
def get_notification_stats():
    """Get notification service statistics"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        stats = notification_service.get_stats()
        
        return jsonify({'success': True, 'data': stats}), 200
        
    except Exception as e:
        logger.error(f"Notification stats error: {e}")
        return jsonify({'error': 'Failed to fetch notification stats'}), 500

if __name__ == '__main__':
    # Add some sample education articles if none exist
    try:
        if get_all_articles(db) == []:
            sample_articles = [
                {
                    'title': 'Introduction to Stock Market Investing',
                    'summary': 'Learn the basics of stock market investing, including key concepts and terminology.',
                    'content': '# Introduction to Stock Market Investing\n\nThe stock market is a platform where shares of publicly traded companies are bought and sold...',
                    'category': 'Basics'
                },
                {
                    'title': 'Understanding Portfolio Diversification',
                    'summary': 'Discover how diversification can help reduce risk in your investment portfolio.',
                    'content': '# Understanding Portfolio Diversification\n\nDiversification is a risk management strategy that mixes a wide variety of investments...',
                    'category': 'Portfolio Management'
                },
                {
                    'title': 'Technical Analysis Fundamentals',
                    'summary': 'Learn the basics of technical analysis and how to read stock charts.',
                    'content': '# Technical Analysis Fundamentals\n\nTechnical analysis is the study of past market data, primarily price and volume...',
                    'category': 'Analysis'
                },
                {
                    'title': 'Risk Management in Investing',
                    'summary': 'Understanding and managing investment risk for better portfolio performance.',
                    'content': '# Risk Management in Investing\n\nRisk management is crucial for long-term investment success. Learn about Beta, Sharpe ratio, and diversification strategies...',
                    'category': 'Risk Management'
                },
                {
                    'title': 'Asset Allocation Strategies',
                    'summary': 'Learn how to allocate your investments across different asset classes and sectors.',
                    'content': '# Asset Allocation Strategies\n\nAsset allocation is the process of dividing your investment portfolio among different asset categories...',
                    'category': 'Portfolio Management'
                }
            ]
            
            for article_data in sample_articles:
                create_article(db, article_data['title'], article_data['summary'], 
                             article_data['content'], article_data['category'])
            
            logger.info("Sample education articles created")
    except Exception as e:
        logger.error(f"Failed to create sample articles: {e}")
    
    logger.info("Starting Alpha Insights with real-time portfolio analytics and database-driven notifications")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
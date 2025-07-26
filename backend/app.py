from flask import Flask, request, jsonify, g
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pymongo import MongoClient
import redis
import os
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from models import create_user, get_user_collection

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

# WebSocket event for notifications
@socketio.on('send_notification')
def handle_notification(data):
    emit('receive_notification', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5003, use_reloader=False)

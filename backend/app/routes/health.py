"""
Health and testing routes blueprint.
Handles system health checks and development utilities.
"""

import logging
import psutil
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash

from ..models import create_user, get_user_collection

logger = logging.getLogger(__name__)

health_bp = Blueprint('health_bp', __name__)

@health_bp.route('/health', methods=['GET'])
def system_health():
    """System health check"""
    try:
        # Database connectivity check
        try:
            current_app.db.command('ping')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        # Redis connectivity check
        try:
            current_app.redis_client.ping()
            redis_status = 'connected'
        except Exception as e:
            redis_status = f'error: {str(e)}'
        
        # System metrics
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent
        except Exception:
            cpu_usage = 0
            memory_usage = 0
            disk_usage = 0
        
        # Application metrics
        try:
            user_count = current_app.db.users.count_documents({})
            portfolio_count = current_app.db.portfolios.count_documents({})
            transaction_count = current_app.db.transactions.count_documents({})
        except Exception:
            user_count = 0
            portfolio_count = 0
            transaction_count = 0
        
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'services': {
                'database': db_status,
                'redis': redis_status,
                'api': 'running'
            },
            'system': {
                'cpu_usage': round(cpu_usage, 1),
                'memory_usage': round(memory_usage, 1),
                'disk_usage': round(disk_usage, 1)
            },
            'application': {
                'users': user_count,
                'portfolios': portfolio_count,
                'transactions': transaction_count
            },
            'version': '1.0.0'
        }
        
        # Determine overall health status
        if db_status != 'connected' or redis_status != 'connected':
            health_data['status'] = 'degraded'
        
        if cpu_usage > 90 or memory_usage > 90 or disk_usage > 90:
            health_data['status'] = 'warning'
        
        return jsonify({
            'success': True,
            'data': health_data
        }), 200
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'error': 'Health check failed',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

@health_bp.route('/create-test-user', methods=['POST'])
def create_test_user():
    """Create a test user for development purposes"""
    try:
        data = request.json or {}
        
        # Default test user data
        username = data.get('username', 'testuser')
        email = data.get('email', 'test@example.com')
        password = data.get('password', 'testpass123')
        role = data.get('role', 'user')
        
        # Check if user already exists
        if get_user_collection(current_app.db).find_one({'email': email}):
            return jsonify({'error': 'Test user already exists'}), 409
        
        # Create test user
        password_hash = generate_password_hash(password)
        user_id = create_user(current_app.db, username, email, password_hash, role)
        
        # Create test portfolio for the user
        try:
            from ..models import create_portfolio
            portfolio_id = create_portfolio(current_app.db, str(user_id))
            
            # Add some test transactions
            from ..models import create_transaction
            test_transactions = [
                {
                    'symbol': 'AAPL',
                    'type': 'buy',
                    'shares': 100,
                    'price': 150.00
                },
                {
                    'symbol': 'MSFT',
                    'type': 'buy',
                    'shares': 50,
                    'price': 300.00
                },
                {
                    'symbol': 'GOOGL',
                    'type': 'buy',
                    'shares': 25,
                    'price': 2500.00
                }
            ]
            
            for transaction in test_transactions:
                create_transaction(
                    current_app.db,
                    str(user_id),
                    transaction['symbol'],
                    transaction['type'],
                    transaction['shares'],
                    transaction['price']
                )
                
        except Exception as portfolio_error:
            logger.warning(f"Failed to create test portfolio: {portfolio_error}")
        
        logger.info(f"Test user created: {username} ({email})")
        
        return jsonify({
            'success': True,
            'message': 'Test user created successfully',
            'data': {
                'user_id': str(user_id),
                'username': username,
                'email': email,
                'role': role
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Create test user error: {e}")
        return jsonify({'error': 'Failed to create test user'}), 500

@health_bp.route('/database-stats', methods=['GET'])
def get_database_stats():
    """Get database statistics"""
    try:
        stats = {}
        
        # Collection stats
        collections = ['users', 'portfolios', 'transactions', 'articles', 'price_alerts']
        
        for collection_name in collections:
            try:
                collection = getattr(current_app.db, collection_name)
                count = collection.count_documents({})
                stats[collection_name] = {
                    'count': count,
                    'size_bytes': current_app.db.command('collStats', collection_name).get('size', 0)
                }
            except Exception as e:
                stats[collection_name] = {
                    'count': 0,
                    'size_bytes': 0,
                    'error': str(e)
                }
        
        # Database info
        try:
            db_stats = current_app.db.command('dbStats')
            stats['database'] = {
                'name': current_app.db.name,
                'collections': db_stats.get('collections', 0),
                'data_size': db_stats.get('dataSize', 0),
                'storage_size': db_stats.get('storageSize', 0),
                'indexes': db_stats.get('indexes', 0)
            }
        except Exception as e:
            stats['database'] = {'error': str(e)}
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Database stats error: {e}")
        return jsonify({'error': 'Failed to fetch database stats'}), 500

@health_bp.route('/clear-test-data', methods=['POST'])
def clear_test_data():
    """Clear test data from database (development only)"""
    try:
        # Safety check - only allow in development
        if current_app.config.get('DEBUG') != True:
            return jsonify({'error': 'This endpoint is only available in development mode'}), 403
        
        data = request.json or {}
        confirm = data.get('confirm', False)
        
        if not confirm:
            return jsonify({'error': 'Must confirm data deletion with "confirm": true'}), 400
        
        # Clear test data
        collections_cleared = {}
        
        # Clear test users (keep admin users)
        result = current_app.db.users.delete_many({'role': {'$ne': 'admin'}})
        collections_cleared['users'] = result.deleted_count
        
        # Clear all portfolios
        result = current_app.db.portfolios.delete_many({})
        collections_cleared['portfolios'] = result.deleted_count
        
        # Clear all transactions
        result = current_app.db.transactions.delete_many({})
        collections_cleared['transactions'] = result.deleted_count
        
        # Clear all price alerts
        result = current_app.db.price_alerts.delete_many({})
        collections_cleared['price_alerts'] = result.deleted_count
        
        logger.info("Test data cleared from database")
        
        return jsonify({
            'success': True,
            'message': 'Test data cleared successfully',
            'data': collections_cleared
        }), 200
        
    except Exception as e:
        logger.error(f"Clear test data error: {e}")
        return jsonify({'error': 'Failed to clear test data'}), 500
"""
Application factory for Alpha Insights Flask application.
"""

import logging
from flask import Flask
from pymongo import MongoClient
import redis

from .extensions import socketio, cors, mongo_client, db, redis_client
from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app(config_name='default'):
    """
    Application factory function.
    
    Args:
        config_name (str): Configuration name ('development', 'production', 'testing')
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
    
    # Initialize database connections
    global mongo_client, db, redis_client
    mongo_client = MongoClient(app.config['MONGO_URI'])
    db = mongo_client.get_database()
    redis_client = redis.Redis(
        host=app.config['REDIS_HOST'], 
        port=app.config['REDIS_PORT'], 
        decode_responses=True
    )
    
    # Store database connections in app context for access in blueprints
    app.mongo_client = mongo_client
    app.db = db
    app.redis_client = redis_client
    
    # Initialize services
    from .services.websocket_service import NotificationService, setup_websocket_handlers
    notification_service = NotificationService(socketio, db)
    setup_websocket_handlers(socketio, notification_service)
    app.notification_service = notification_service
    
    # Register blueprints
    register_blueprints(app)
    
    # Add basic route
    @app.route('/')
    def home():
        return 'Alpha Insights Flask Backend is running!'
    
    logger.info(f"Application created with config: {config_name}")
    return app

def register_blueprints(app):
    """Register all application blueprints"""
    
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.portfolio import portfolio_bp
    from .routes.market import market_bp
    from .routes.ai import ai_bp
    from .routes.transactions import transactions_bp
    from .routes.education import education_bp
    from .routes.user import user_bp
    from .routes.health import health_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(market_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(education_bp, url_prefix='/api/education')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(health_bp, url_prefix='/api')
    
    logger.info("All blueprints registered successfully")
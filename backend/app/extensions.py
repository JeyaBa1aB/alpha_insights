"""
Flask extensions initialization.
Extensions are initialized here without being bound to the app instance
to prevent circular dependencies.
"""

from flask_socketio import SocketIO
from flask_cors import CORS
from pymongo import MongoClient
import redis

# Initialize extensions without app binding
socketio = SocketIO(cors_allowed_origins="*")
cors = CORS()

# Database connections (will be initialized in factory)
mongo_client = None
db = None
redis_client = None
"""
Entry point for Alpha Insights Flask application.
This is the new, clean entry point that uses the application factory pattern.
"""

import os
from app import create_app
from app.extensions import socketio

# Determine configuration based on environment
config_name = os.getenv('FLASK_ENV', 'development')

# Create application instance
app = create_app(config_name)

if __name__ == '__main__':
    # Run the application with SocketIO support
    socketio.run(
        app, 
        debug=app.config['DEBUG'], 
        host=app.config['HOST'],
        port=app.config['PORT'], 
        use_reloader=False
    )
#!/usr/bin/env python3
"""
Simple server startup script for testing
"""

if __name__ == '__main__':
    print("🚀 Starting Alpha Insights Backend Server...")
    print("Server will run on http://localhost:5000")
    print("Press Ctrl+C to stop")
    
    try:
        from app import create_app
        from app.extensions import socketio
        print("✅ App imported successfully")
        print("🌐 Starting server...")
        
        # Create the Flask app using the factory
        flask_app = create_app('development')
        
        # Run with socketio
        socketio.run(flask_app, debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")
        import traceback
        traceback.print_exc()
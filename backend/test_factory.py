"""
Test script to verify the application factory works correctly.
"""

from app import create_app

def test_app_creation():
    """Test that the application can be created successfully"""
    try:
        app = create_app('development')
        print(f"✅ Application created successfully")
        print(f"✅ App name: {app.name}")
        print(f"✅ Debug mode: {app.config['DEBUG']}")
        print(f"✅ Secret key configured: {'SECRET_KEY' in app.config}")
        print(f"✅ Database configured: {hasattr(app, 'db')}")
        print(f"✅ Redis configured: {hasattr(app, 'redis_client')}")
        
        # Test that blueprints are registered
        blueprint_names = [bp.name for bp in app.blueprints.values()]
        print(f"✅ Registered blueprints: {blueprint_names}")
        
        return True
    except Exception as e:
        print(f"❌ Error creating application: {e}")
        return False

if __name__ == '__main__':
    success = test_app_creation()
    if success:
        print("\n🎉 Application factory test passed!")
    else:
        print("\n💥 Application factory test failed!")
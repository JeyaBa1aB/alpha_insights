#!/usr/bin/env python3
"""
Quick test to verify backend is working
"""

import requests
import json
import sys

def test_backend():
    """Test if backend is running and working"""
    
    print("🧪 Testing Alpha Insights Backend")
    print("=" * 50)
    
    BASE_URL = 'http://localhost:5000'
    
    # Test 1: Health check
    print("1. Testing server connection...")
    try:
        response = requests.get(f'{BASE_URL}/', timeout=5)
        if response.status_code == 200:
            print("   ✅ Server is running")
        else:
            print(f"   ❌ Server responded with status {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to server")
        print("   💡 Make sure to run: python start_server.py")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Test 2: Create test user
    print("\n2. Creating test user...")
    signup_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/signup', json=signup_data, timeout=5)
        if response.status_code == 201:
            print("   ✅ Test user created")
        elif response.status_code == 409:
            print("   ℹ️ Test user already exists")
        else:
            print(f"   ❌ Signup failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Signup error: {e}")
        return False
    
    # Test 3: Login
    print("\n3. Testing login...")
    login_data = {
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/login', json=login_data, timeout=5)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print("   ✅ Login successful")
            print(f"   🔑 Token: {token[:30]}...")
            return token
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False

def test_portfolio_endpoints(token):
    """Test portfolio endpoints"""
    if not token:
        return
    
    print("\n4. Testing portfolio endpoints...")
    BASE_URL = 'http://localhost:5000'
    headers = {'Authorization': f'Bearer {token}'}
    
    endpoints = [
        '/api/portfolio',
        '/api/portfolio/holdings',
        '/api/portfolio/activity'
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'{BASE_URL}{endpoint}', headers=headers, timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {endpoint}")
            else:
                print(f"   ❌ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {e}")

if __name__ == '__main__':
    token = test_backend()
    if token:
        test_portfolio_endpoints(token)
        print("\n" + "=" * 50)
        print("🎉 Backend is working!")
        print("\n📝 Next steps:")
        print("1. Start the frontend: cd frontend && npm start")
        print("2. Go to http://localhost:5173")
        print("3. Sign up with: test@example.com / testpass123")
        print("4. Or create a new account")
    else:
        print("\n" + "=" * 50)
        print("❌ Backend test failed")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure MongoDB is running")
        print("2. Start the backend: python start_server.py")
        print("3. Check for any error messages")
        sys.exit(1)


        
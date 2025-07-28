#!/usr/bin/env python3
"""
Test script to verify authentication and API endpoints
"""

import requests
import json

BASE_URL = 'http://localhost:5000'

def test_signup_and_login():
    """Test user signup and login"""
    
    # Test signup
    signup_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword123'
    }
    
    print("Testing signup...")
    try:
        response = requests.post(f'{BASE_URL}/signup', json=signup_data)
        print(f"Signup response: {response.status_code}")
        if response.status_code == 201:
            print("✅ Signup successful")
        elif response.status_code == 409:
            print("ℹ️ User already exists")
        else:
            print(f"❌ Signup failed: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the backend is running on port 5000")
        return None
    
    # Test login
    login_data = {
        'email': 'test@example.com',
        'password': 'testpassword123'
    }
    
    print("\nTesting login...")
    try:
        response = requests.post(f'{BASE_URL}/login', json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print("✅ Login successful")
            print(f"Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        return None

def test_portfolio_endpoints(token):
    """Test portfolio endpoints with authentication"""
    if not token:
        print("❌ No token available for testing")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test portfolio endpoint
    print("\nTesting portfolio endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/api/portfolio', headers=headers)
        print(f"Portfolio response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Portfolio endpoint working")
        else:
            print(f"❌ Portfolio endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Portfolio endpoint error: {e}")
    
    # Test holdings endpoint
    print("\nTesting holdings endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/api/portfolio/holdings', headers=headers)
        print(f"Holdings response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Holdings endpoint working")
        else:
            print(f"❌ Holdings endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Holdings endpoint error: {e}")

if __name__ == '__main__':
    print("🧪 Testing Alpha Insights Backend")
    print("=" * 40)
    
    token = test_signup_and_login()
    test_portfolio_endpoints(token)
    
    print("\n" + "=" * 40)
    print("Test completed!")
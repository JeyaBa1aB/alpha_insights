#!/usr/bin/env python3
"""
Test script to check if AI service can access portfolio data
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_EMAIL = "john.doe@example.com"
TEST_PASSWORD = "password123"

def test_portfolio_ai():
    """Test the AI service portfolio data access"""
    
    print("🧪 Testing AI Portfolio Data Access")
    print("=" * 50)
    
    # Step 1: Login to get JWT token
    print("1. Logging in...")
    login_response = requests.post(f"{BASE_URL}/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_data.get('token')
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Step 2: Test regular portfolio endpoint first
    print("\n2. Testing regular portfolio endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    regular_portfolio_response = requests.get(f"{BASE_URL}/api/portfolio", headers=headers)
    print(f"Regular portfolio status: {regular_portfolio_response.status_code}")
    if regular_portfolio_response.status_code == 200:
        print(f"✅ Regular portfolio works: {regular_portfolio_response.json()}")
    else:
        print(f"❌ Regular portfolio failed: {regular_portfolio_response.text}")
    
    # Step 3: Test AI chat with portfolio query
    print("\n3. Testing AI chat with portfolio query...")
    
    ai_response = requests.post(f"{BASE_URL}/api/ai/chat", 
        headers=headers,
        json={
            "message": "Analyze my portfolio",
            "context": {}
        }
    )
    
    if ai_response.status_code != 200:
        print(f"❌ AI chat failed: {ai_response.text}")
        return
    
    ai_data = ai_response.json()
    print(f"✅ AI chat response: {json.dumps(ai_data, indent=2)}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")

if __name__ == "__main__":
    test_portfolio_ai()
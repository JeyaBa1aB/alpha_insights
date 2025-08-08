#!/usr/bin/env python3
"""
Test script to debug the full AI service flow
"""

import requests
import json
import os
from pymongo import MongoClient
from dotenv import load_dotenv

def test_ai_full_flow():
    """Test the complete AI service flow with debugging"""
    
    load_dotenv()
    
    print("🧪 Testing Complete AI Service Flow")
    print("=" * 60)
    
    # Step 1: Login to get JWT token
    print("1. Logging in...")
    login_response = requests.post("http://localhost:5000/login", json={
        "email": "john.doe@example.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_data.get('token')
    print(f"✅ Login successful")
    
    # Step 2: Test direct database access
    print("\n2. Testing direct database access...")
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    
    # Test user ID from JWT
    import jwt
    payload = jwt.decode(token, options={"verify_signature": False})
    user_id = payload.get('user_id')
    print(f"User ID from JWT: {user_id}")
    
    # Test get_portfolio_stats directly
    try:
        import sys
        sys.path.append('.')
        from app.models import get_portfolio_stats
        
        portfolio_stats = get_portfolio_stats(db, user_id)
        print(f"✅ Direct portfolio stats: {bool(portfolio_stats)}")
        print(f"   - Total Value: ${portfolio_stats['summary']['totalValue']:,.2f}")
        print(f"   - Holdings: {len(portfolio_stats['holdings'])}")
    except Exception as e:
        print(f"❌ Direct portfolio stats failed: {e}")
    
    # Step 3: Test AI service directly with Flask app database
    print("\n3. Testing AI service with Flask app database...")
    try:
        from app.services.ai_service import ai_service
        
        # Set the database connection
        ai_service.db = db
        
        # Test portfolio data retrieval
        portfolio_data = ai_service._get_user_portfolio_data(user_id)
        print(f"✅ AI service portfolio data: {len(portfolio_data) if portfolio_data else 0} chars")
        if portfolio_data:
            print(f"   First 100 chars: {portfolio_data[:100]}...")
        
        # Test full AI query
        user_context = {'user_id': user_id}
        response = ai_service.route_query("Analyze my portfolio", user_context)
        print(f"✅ AI service response: {response.get('agent', 'unknown')} agent")
        print(f"   Response length: {len(response.get('response', ''))}")
        
    except Exception as e:
        print(f"❌ AI service test failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Step 4: Test API call
    print("\n4. Testing API call...")
    headers = {"Authorization": f"Bearer {token}"}
    
    ai_response = requests.post("http://localhost:5000/api/ai/chat", 
        headers=headers,
        json={
            "message": "Analyze my portfolio",
            "context": {}
        }
    )
    
    if ai_response.status_code == 200:
        ai_data = ai_response.json()
        print(f"✅ API call successful")
        print(f"   Agent: {ai_data['data'].get('agent_name', 'unknown')}")
        print(f"   Response: {ai_data['data'].get('response', '')[:100]}...")
    else:
        print(f"❌ API call failed: {ai_response.text}")
    
    client.close()
    print("\n" + "=" * 60)
    print("🎉 Test completed!")

if __name__ == "__main__":
    test_ai_full_flow()
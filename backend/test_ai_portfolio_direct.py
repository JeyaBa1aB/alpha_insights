#!/usr/bin/env python3
"""
Test script to check if AI service can access portfolio data directly
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

def test_ai_portfolio_direct():
    """Test the AI service portfolio data access directly"""
    
    load_dotenv()
    
    # Connect to database
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    
    # Test user ID from seed data
    test_user_id = "689561024d26a226d0d99998"  # John Doe
    
    print(f"🧪 Testing AI service portfolio data access for user: {test_user_id}")
    print("=" * 70)
    
    try:
        # Import the AI service
        import sys
        sys.path.append('.')
        from app.services.ai_service import AIService
        
        # Create AI service instance
        ai_service = AIService()
        ai_service.db = db  # Set the database connection
        
        # Test the portfolio data retrieval method directly
        portfolio_data = ai_service._get_user_portfolio_data(test_user_id)
        
        print(f"✅ AI service portfolio data retrieved!")
        print(f"📊 Data length: {len(portfolio_data) if portfolio_data else 0} characters")
        print(f"📋 First 200 characters: {portfolio_data[:200] if portfolio_data else 'None'}...")
        
        return portfolio_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        client.close()

if __name__ == "__main__":
    test_ai_portfolio_direct()
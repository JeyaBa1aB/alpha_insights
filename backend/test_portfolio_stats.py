#!/usr/bin/env python3
"""
Test script to check if get_portfolio_stats works correctly
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

def test_portfolio_stats():
    """Test the get_portfolio_stats function directly"""
    
    load_dotenv()
    
    # Connect to database
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    
    # Test user ID from seed data
    test_user_id = "689561024d26a226d0d99998"  # John Doe
    
    print(f"🧪 Testing get_portfolio_stats for user: {test_user_id}")
    print("=" * 60)
    
    try:
        # Import the function
        import sys
        sys.path.append('.')
        from app.models import get_portfolio_stats
        
        # Get portfolio stats
        portfolio_stats = get_portfolio_stats(db, test_user_id)
        
        print(f"✅ Portfolio stats retrieved successfully!")
        print(f"📊 Summary: {portfolio_stats.get('summary', {})}")
        print(f"📈 Holdings count: {len(portfolio_stats.get('holdings', []))}")
        
        # Print first few holdings
        holdings = portfolio_stats.get('holdings', [])
        if holdings:
            print(f"\n📋 First 3 holdings:")
            for i, holding in enumerate(holdings[:3], 1):
                print(f"  {i}. {holding.get('symbol', 'N/A')} - {holding.get('totalShares', 0)} shares")
        
        return portfolio_stats
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        client.close()

if __name__ == "__main__":
    test_portfolio_stats()
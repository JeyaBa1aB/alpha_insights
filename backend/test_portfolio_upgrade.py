#!/usr/bin/env python3
"""
Test script for the upgraded portfolio functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import *
from pymongo import MongoClient
from bson import ObjectId
import json

def test_portfolio_upgrade():
    """Test the upgraded portfolio functionality"""
    
    # Connect to test database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights_test']
    
    # Clean up test data
    db.users.delete_many({})
    db.portfolios.delete_many({})
    db.transactions.delete_many({})
    
    print("🧪 Testing Portfolio Upgrade Functionality")
    print("=" * 50)
    
    # 1. Create test user
    user_id = create_user(db, "testuser", "test@example.com", "hashed_password")
    print(f"✅ Created test user: {user_id}")
    
    # 2. Test improved create_transaction function
    print("\n📊 Testing improved create_transaction function...")
    
    # Create first transaction - should create portfolio automatically
    transaction1_id = create_transaction(db, str(user_id), "AAPL", "buy", 100, 150.00)
    print(f"✅ Created transaction 1: {transaction1_id}")
    
    # Create second transaction
    transaction2_id = create_transaction(db, str(user_id), "MSFT", "buy", 50, 300.00)
    print(f"✅ Created transaction 2: {transaction2_id}")
    
    # Create third transaction (more AAPL)
    transaction3_id = create_transaction(db, str(user_id), "AAPL", "buy", 50, 160.00)
    print(f"✅ Created transaction 3: {transaction3_id}")
    
    # 3. Test portfolio stats calculation
    print("\n📈 Testing portfolio stats calculation...")
    portfolio_stats = get_portfolio_stats(db, str(user_id))
    
    print(f"Portfolio Summary:")
    print(f"  Total Value: ${portfolio_stats['summary']['totalValue']:,.2f}")
    print(f"  Total Cost: ${portfolio_stats['summary']['totalCost']:,.2f}")
    print(f"  Total Gain/Loss: ${portfolio_stats['summary']['totalGainLoss']:,.2f}")
    print(f"  Gain/Loss %: {portfolio_stats['summary']['totalGainLossPercent']:.2f}%")
    print(f"  Holdings Count: {portfolio_stats['summary']['holdingsCount']}")
    
    print(f"\nHoldings:")
    for holding in portfolio_stats['holdings']:
        print(f"  {holding['symbol']}: {holding['totalShares']} shares @ ${holding['averageCost']:.2f} avg")
    
    print(f"\nRecent Transactions: {len(portfolio_stats['recent_transactions'])}")
    
    # 4. Test transaction deletion and recalculation
    print("\n🗑️ Testing transaction deletion...")
    success = delete_transaction(db, str(transaction2_id))
    print(f"✅ Deleted transaction: {success}")
    
    # Recalculate after deletion
    portfolio = get_user_portfolio(db, str(user_id))
    recalculate_portfolio_value(db, portfolio["_id"])
    
    # Get updated stats
    updated_stats = get_portfolio_stats(db, str(user_id))
    print(f"Updated Total Value: ${updated_stats['summary']['totalValue']:,.2f}")
    print(f"Updated Holdings Count: {updated_stats['summary']['holdingsCount']}")
    
    # 5. Test user transactions retrieval
    print("\n📋 Testing user transactions retrieval...")
    user_transactions = get_user_transactions(db, str(user_id), limit=10)
    print(f"User has {len(user_transactions)} transactions")
    
    for transaction in user_transactions:
        print(f"  {transaction['type'].upper()} {transaction['shares']} {transaction['symbol']} @ ${transaction['price']}")
    
    print("\n🎉 All tests completed successfully!")
    
    # Cleanup
    client.close()

if __name__ == "__main__":
    test_portfolio_upgrade()
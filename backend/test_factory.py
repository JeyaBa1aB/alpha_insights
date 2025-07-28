#!/usr/bin/env python3
"""
Create test data for a specific user to ensure the frontend works.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import *
from pymongo import MongoClient
from bson import ObjectId
import json

def create_test_data_for_user():
    """Create test transactions for the admin user"""
    
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    print("🏭 Creating Test Data for User")
    print("=" * 40)
    
    # Get the admin user (first user)
    admin_user = db.users.find_one({'username': 'admin'})
    if not admin_user:
        print("❌ Admin user not found")
        return
    
    user_id = str(admin_user['_id'])
    print(f"✅ Found admin user: {user_id}")
    
    # Clear existing transactions for this user
    portfolio = get_user_portfolio(db, user_id)
    db.transactions.delete_many({'portfolioId': portfolio['_id']})
    print(f"🧹 Cleared existing transactions for user")
    
    # Create some test transactions
    test_transactions = [
        {'symbol': 'AAPL', 'type': 'buy', 'shares': 100, 'price': 150.00},
        {'symbol': 'MSFT', 'type': 'buy', 'shares': 50, 'price': 300.00},
        {'symbol': 'GOOGL', 'type': 'buy', 'shares': 10, 'price': 2500.00},
        {'symbol': 'AAPL', 'type': 'sell', 'shares': 25, 'price': 155.00},
        {'symbol': 'TSLA', 'type': 'buy', 'shares': 20, 'price': 200.00},
    ]
    
    created_ids = []
    for tx in test_transactions:
        tx_id = create_transaction(db, user_id, tx['symbol'], tx['type'], tx['shares'], tx['price'])
        created_ids.append(str(tx_id))
        print(f"✅ Created transaction: {tx['type'].upper()} {tx['shares']} {tx['symbol']} @ ${tx['price']}")
    
    print(f"\n📊 Created {len(created_ids)} transactions")
    print("Transaction IDs:", created_ids)
    
    # Test the get_user_transactions function
    user_transactions = get_user_transactions(db, user_id, limit=10)
    print(f"\n🔍 Verification: get_user_transactions returned {len(user_transactions)} transactions")
    
    for i, t in enumerate(user_transactions):
        print(f"  {i+1}. ID: {t['_id']}, {t['type'].upper()} {t['shares']} {t['symbol']}")
    
    # Get portfolio stats
    stats = get_portfolio_stats(db, user_id)
    print(f"\n💰 Portfolio Summary:")
    print(f"  Total Value: ${stats['summary']['totalValue']:,.2f}")
    print(f"  Holdings: {len(stats['holdings'])}")
    print(f"  Recent Transactions: {len(stats['recent_transactions'])}")
    
    client.close()
    print(f"\n🎉 Test data created successfully!")
    print(f"Now the admin user should have real transactions to display and delete.")

if __name__ == "__main__":
    create_test_data_for_user()
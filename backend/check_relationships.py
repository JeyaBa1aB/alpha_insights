#!/usr/bin/env python3
"""
Check relationships between users, portfolios, and transactions.
"""

from pymongo import MongoClient
from bson import ObjectId

def check_relationships():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    print("=== DATABASE RELATIONSHIPS CHECK ===")
    
    # Get users
    users = list(db.users.find())
    print(f"\n1. USERS ({len(users)} found):")
    for user in users[:3]:
        print(f"   User ID: {user['_id']}, Username: {user.get('username', 'N/A')}")
    
    # Get portfolios
    portfolios = list(db.portfolios.find())
    print(f"\n2. PORTFOLIOS ({len(portfolios)} found):")
    for portfolio in portfolios[:3]:
        print(f"   Portfolio ID: {portfolio['_id']}, User ID: {portfolio.get('userId', 'N/A')}")
    
    # Get transactions
    transactions = list(db.transactions.find())
    print(f"\n3. TRANSACTIONS ({len(transactions)} found):")
    for transaction in transactions[:3]:
        print(f"   Transaction ID: {transaction['_id']}, Portfolio ID: {transaction.get('portfolioId', 'N/A')}")
        print(f"   Symbol: {transaction.get('symbol', 'N/A')}, Type: {transaction.get('type', 'N/A')}")
    
    # Check if any user has a portfolio
    print(f"\n4. RELATIONSHIP CHECK:")
    if users and portfolios:
        user_id = users[0]['_id']
        user_portfolio = db.portfolios.find_one({'userId': user_id})
        if user_portfolio:
            print(f"   ✅ User {user_id} has portfolio {user_portfolio['_id']}")
            
            # Check if portfolio has transactions
            portfolio_transactions = list(db.transactions.find({'portfolioId': user_portfolio['_id']}))
            print(f"   ✅ Portfolio has {len(portfolio_transactions)} transactions")
            
            if portfolio_transactions:
                print("   Sample transaction:")
                t = portfolio_transactions[0]
                print(f"     ID: {t['_id']}, Symbol: {t['symbol']}, Type: {t['type']}")
        else:
            print(f"   ❌ User {user_id} has no portfolio")
    
    client.close()

if __name__ == "__main__":
    check_relationships()
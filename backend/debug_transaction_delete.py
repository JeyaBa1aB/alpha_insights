#!/usr/bin/env python3
"""
Debug script for transaction deletion issue.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import *
from pymongo import MongoClient
from bson import ObjectId
import json

def debug_transaction_delete():
    """Debug the transaction deletion issue"""
    
    # Connect to database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    print("🔍 Debugging Transaction Delete Issue")
    print("=" * 50)
    
    # Check existing transactions
    transactions = list(get_transactions_collection(db).find().limit(5))
    print(f"Found {len(transactions)} transactions in database")
    
    if transactions:
        print("\nSample transaction structure:")
        sample = transactions[0]
        print(f"  _id: {sample['_id']} (type: {type(sample['_id'])})")
        print(f"  portfolioId: {sample.get('portfolioId')} (type: {type(sample.get('portfolioId'))})")
        print(f"  symbol: {sample.get('symbol')}")
        print(f"  type: {sample.get('type')}")
        print(f"  shares: {sample.get('shares')}")
        print(f"  price: {sample.get('price')}")
        print(f"  transactionDate: {sample.get('transactionDate')}")
        
        # Check if portfolio exists for this transaction
        if 'portfolioId' in sample:
            portfolio = get_portfolio_collection(db).find_one({'_id': sample['portfolioId']})
            if portfolio:
                print(f"\nPortfolio found:")
                print(f"  _id: {portfolio['_id']}")
                print(f"  userId: {portfolio.get('userId')}")
                print(f"  portfolioName: {portfolio.get('portfolioName')}")
            else:
                print(f"\n❌ No portfolio found for portfolioId: {sample['portfolioId']}")
        
        # Test the delete function
        print(f"\n🧪 Testing delete function with transaction ID: {sample['_id']}")
        try:
            success = delete_transaction(db, str(sample['_id']))
            print(f"Delete result: {success}")
        except Exception as e:
            print(f"❌ Delete failed: {str(e)}")
    
    else:
        print("No transactions found in database")
    
    # Check users and portfolios
    users = list(get_user_collection(db).find().limit(3))
    portfolios = list(get_portfolio_collection(db).find().limit(3))
    
    print(f"\nDatabase summary:")
    print(f"  Users: {len(users)}")
    print(f"  Portfolios: {len(portfolios)}")
    print(f"  Transactions: {len(transactions)}")
    
    client.close()

if __name__ == "__main__":
    debug_transaction_delete()
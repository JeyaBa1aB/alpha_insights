#!/usr/bin/env python3
"""
Check transactions in database.
"""

from pymongo import MongoClient
from bson import ObjectId

def check_transactions():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    transactions = list(db.transactions.find())
    print(f"Found {len(transactions)} transactions in database:")
    
    for i, t in enumerate(transactions[:10]):
        print(f"{i+1}. ID: {t['_id']}, Symbol: {t.get('symbol', 'N/A')}, Type: {t.get('type', 'N/A')}")
    
    # Check if there are any transactions with string IDs
    portfolios = list(db.portfolios.find())
    print(f"\nFound {len(portfolios)} portfolios in database")
    
    client.close()

if __name__ == "__main__":
    check_transactions()
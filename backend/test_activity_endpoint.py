#!/usr/bin/env python3
"""
Test the activity endpoint directly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import *
from pymongo import MongoClient
import json

def test_activity_endpoint():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    # Get a user ID
    users = list(get_user_collection(db).find().limit(1))
    if not users:
        print("No users found in database")
        return
    
    user_id = str(users[0]['_id'])
    print(f"Testing with user ID: {user_id}")
    
    # Test get_user_transactions function
    transactions = get_user_transactions(db, user_id, limit=10)
    print(f"\nget_user_transactions returned {len(transactions)} transactions:")
    
    for i, t in enumerate(transactions[:5]):
        print(f"{i+1}. ID: {t['_id']}, Symbol: {t['symbol']}, Type: {t['type']}")
        print(f"    Shares: {t['shares']}, Price: {t['price']}")
        print(f"    Date: {t['transactionDate']}")
    
    client.close()

if __name__ == "__main__":
    test_activity_endpoint()
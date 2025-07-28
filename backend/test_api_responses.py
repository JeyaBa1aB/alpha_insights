#!/usr/bin/env python3
"""
Test what the API endpoints are actually returning.
"""

import requests
import json

def test_api_responses():
    base_url = "http://localhost:5000"
    
    # You'll need to get a valid token first
    # For now, let's just test if the server is running
    try:
        response = requests.get(f"{base_url}/")
        print(f"Server status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Server not running or error: {e}")
        return
    
    # Test the activity endpoint (this would need authentication)
    print("\nTo test the API endpoints properly, you would need:")
    print("1. Start the Flask server: python run.py")
    print("2. Login to get a JWT token")
    print("3. Use the token to call /api/portfolio/activity")
    print("4. Check what transaction IDs are actually returned")

if __name__ == "__main__":
    test_api_responses()
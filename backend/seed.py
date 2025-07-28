# backend/seed.py
import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv
from datetime import datetime, timedelta
from bson import ObjectId
import random

def seed_database():
    """Populates the MongoDB database with realistic sample data including users,
    an admin, portfolios, transactions, and educational articles."""
    
    load_dotenv()
    
    # --- 1. CONNECT TO DATABASE ---
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    print(f"Connected to MongoDB database: {db.name}")
    
    # --- 2. CLEAR EXISTING COLLECTIONS ---
    print("Clearing existing data...")
    db.users.delete_many({})
    db.portfolios.delete_many({})
    db.transactions.delete_many({})
    db.articles.delete_many({})
    print("Collections cleared.")
    
    # --- 3. SEED USERS AND ADMIN ---
    print("Seeding users and admin...")
    users_collection = db.users
    
    # Admin User
    admin_id = users_collection.insert_one({
        "username": "admin",
        "email": "admin@alphainsights.com",
        "password_hash": generate_password_hash("adminpass"),
        "role": "admin",
        "createdAt": datetime.utcnow() - timedelta(days=365),
        "lastLogin": datetime.utcnow() - timedelta(days=1),
        "isActive": True
    }).inserted_id
    print(f"-> Created admin user: admin@alphainsights.com / adminpass")
    
    # Regular Users
    user1_id = users_collection.insert_one({
        "username": "johndoe",
        "email": "john.doe@example.com",
        "password_hash": generate_password_hash("password123"),
        "role": "user",
        "createdAt": datetime.utcnow() - timedelta(days=180),
        "lastLogin": datetime.utcnow() - timedelta(hours=5),
        "isActive": True
    }).inserted_id
    print(f"-> Created user: john.doe@example.com / password123")
    
    user2_id = users_collection.insert_one({
        "username": "janesmith",
        "email": "jane.smith@example.com",
        "password_hash": generate_password_hash("password123"),
        "role": "user",
        "createdAt": datetime.utcnow() - timedelta(days=90),
        "lastLogin": datetime.utcnow() - timedelta(days=2),
        "isActive": True
    }).inserted_id
    print(f"-> Created user: jane.smith@example.com / password123")
    
    user_ids = [user1_id, user2_id]
    
    # --- 4. SEED PORTFOLIOS ---
    print("\nSeeding portfolios...")
    portfolios_collection = db.portfolios
    portfolio_ids = {}
    
    for user_id in user_ids:
        portfolio_id = portfolios_collection.insert_one({
            "userId": user_id,
            "portfolioName": "Main Portfolio",
            "createdAt": datetime.utcnow() - timedelta(days=random.randint(80, 170))
        }).inserted_id
        portfolio_ids[user_id] = portfolio_id
        print(f"-> Created portfolio for user ID: {user_id}")
    
    # --- 5. SEED TRANSACTIONS (REALISTIC DATA) ---
    print("\nSeeding transactions...")
    transactions_collection = db.transactions
    
    # Realistic transaction data for User 1 (John Doe)
    transactions_user1 = [
        # Symbol, Type, Shares, Price, Days Ago
        ("AAPL", "buy", 10, 172.50, 360),
        ("MSFT", "buy", 5, 305.10, 340),
        ("GOOGL", "buy", 3, 135.80, 320),
        ("TSLA", "buy", 8, 255.40, 300),
        ("AAPL", "buy", 5, 185.20, 250),
        ("NVDA", "buy", 4, 480.70, 220),
        ("TSLA", "sell", 3, 280.90, 180),
        ("MSFT", "buy", 5, 340.00, 150),
        ("JPM", "buy", 15, 145.60, 120),
        ("GOOGL", "sell", 1, 142.30, 90),
        ("AAPL", "buy", 10, 190.15, 60),
        ("NVDA", "buy", 2, 850.50, 30),
    ]
    
    # Realistic transaction data for User 2 (Jane Smith)
    transactions_user2 = [
        ("AMZN", "buy", 5, 130.20, 88),
        ("META", "buy", 10, 310.50, 85),
        ("NFLX", "buy", 8, 410.00, 80),
        ("AMZN", "buy", 3, 155.75, 60),
        ("DIS", "buy", 20, 90.25, 50),
        ("META", "sell", 4, 480.10, 40),
        ("NFLX", "buy", 5, 615.50, 20),
    ]
    
    def add_transactions_for_user(user_id, transactions_data):
        portfolio_id = portfolio_ids[user_id]
        for symbol, type, shares, price, days_ago in transactions_data:
            transactions_collection.insert_one({
                "portfolioId": portfolio_id,
                "symbol": symbol,
                "type": type,
                "shares": float(shares),
                "price": float(price),
                "transactionDate": datetime.utcnow() - timedelta(days=days_ago),
                "createdAt": datetime.utcnow()
            })
        print(f"-> Added {len(transactions_data)} transactions for user ID: {user_id}")
    
    add_transactions_for_user(user1_id, transactions_user1)
    add_transactions_for_user(user2_id, transactions_user2)
    
    # --- 6. SEED EDUCATION ARTICLES ---
    print("\nSeeding education articles...")
    articles_collection = db.articles
    
    articles = [
        {
            "title": "Introduction to Stock Investing",
            "summary": "Learn the fundamental concepts of stock market investing, from what a stock is to how to make your first trade.",
            "content": "<h2>What is a Stock?</h2><p>A stock represents a share in the ownership of a company...</p><h2>How to Analyze Stocks</h2><p>There are two primary methods: fundamental analysis and technical analysis...</p>",
            "category": "Beginner"
        },
        {
            "title": "Understanding P/E Ratios",
            "summary": "A deep dive into the Price-to-Earnings ratio, one of the most common metrics for valuing a company.",
            "content": "<h2>Calculating the P/E Ratio</h2><p>The P/E ratio is calculated by dividing the stock's current market price by its earnings per share (EPS)...</p>",
            "category": "Metrics"
        },
        {
            "title": "Diversification: The Key to Managing Risk",
            "summary": "Explore why diversification is crucial for any investment portfolio and how to achieve it.",
            "content": "<h2>Don't Put All Your Eggs in One Basket</h2><p>Diversification means spreading your investments across various assets to reduce risk...</p>",
            "category": "Strategy"
        }
    ]
    
    articles_collection.insert_many(articles)
    print(f"-> Added {len(articles)} articles to the education hub.")
    
    print("\n✅ Database seeding complete!")
    client.close()

if __name__ == "__main__":
    seed_database()
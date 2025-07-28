# models.py
# MongoDB models for Alpha Insights

from datetime import datetime
from bson import ObjectId
from typing import Dict, List, Optional, Any

# ================================
# USER MODEL
# ================================

def get_user_collection(db):
    return db['users']

def create_user(db, username, email, password_hash, role="user"):
    """Create a new user with enhanced fields"""
    user = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "createdAt": datetime.now(),
        "lastLogin": None,
        "isActive": True
    }
    result = get_user_collection(db).insert_one(user)
    return result.inserted_id

def update_user_login(db, user_id):
    """Update user's last login timestamp"""
    get_user_collection(db).update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"lastLogin": datetime.now()}}
    )

# ================================
# PORTFOLIO MODEL
# ================================

def get_portfolio_collection(db):
    return db['portfolios']

def create_portfolio(db, user_id, portfolio_name="Main Portfolio"):
    """Create a new portfolio for a user"""
    portfolio = {
        "userId": ObjectId(user_id),
        "portfolioName": portfolio_name,
        "totalValue": 0.0,
        "createdAt": datetime.now()
    }
    result = get_portfolio_collection(db).insert_one(portfolio)
    return result.inserted_id

def get_user_portfolio(db, user_id):
    """Get user's main portfolio (create if doesn't exist)"""
    portfolio = get_portfolio_collection(db).find_one({"userId": ObjectId(user_id)})
    if not portfolio:
        portfolio_id = create_portfolio(db, user_id)
        portfolio = get_portfolio_collection(db).find_one({"_id": portfolio_id})
    return portfolio

def update_portfolio_value(db, portfolio_id, total_value):
    """Update portfolio's total value"""
    get_portfolio_collection(db).update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": {"totalValue": total_value}}
    )

# ================================
# TRANSACTIONS MODEL
# ================================

def get_transactions_collection(db):
    return db['transactions']

def create_transaction(db, portfolio_id, symbol, transaction_type, shares, price):
    """Create a new buy/sell transaction"""
    transaction = {
        "portfolioId": ObjectId(portfolio_id),
        "symbol": symbol.upper(),
        "type": transaction_type,  # "buy" or "sell"
        "shares": float(shares),
        "price": float(price),
        "transactionDate": datetime.now()
    }
    result = get_transactions_collection(db).insert_one(transaction)
    return result.inserted_id

def get_portfolio_transactions(db, portfolio_id, limit=None):
    """Get all transactions for a portfolio"""
    query = {"portfolioId": ObjectId(portfolio_id)}
    cursor = get_transactions_collection(db).find(query).sort("transactionDate", -1)
    if limit:
        cursor = cursor.limit(limit)
    return list(cursor)

def get_user_transactions(db, user_id, limit=None):
    """Get all transactions for a user across all portfolios"""
    # First get user's portfolios
    portfolios = list(get_portfolio_collection(db).find({"userId": ObjectId(user_id)}))
    portfolio_ids = [p["_id"] for p in portfolios]
    
    query = {"portfolioId": {"$in": portfolio_ids}}
    cursor = get_transactions_collection(db).find(query).sort("transactionDate", -1)
    if limit:
        cursor = cursor.limit(limit)
    return list(cursor)

def update_transaction(db, transaction_id, updates):
    """Update an existing transaction"""
    if "transactionDate" not in updates:
        updates["transactionDate"] = datetime.now()
    
    result = get_transactions_collection(db).update_one(
        {"_id": ObjectId(transaction_id)},
        {"$set": updates}
    )
    return result.modified_count > 0

def delete_transaction(db, transaction_id):
    """Delete a transaction"""
    result = get_transactions_collection(db).delete_one({"_id": ObjectId(transaction_id)})
    return result.deleted_count > 0

def calculate_holdings(db, portfolio_id):
    """Calculate current holdings from transactions"""
    transactions = get_portfolio_transactions(db, portfolio_id)
    holdings = {}
    
    for transaction in transactions:
        symbol = transaction["symbol"]
        shares = transaction["shares"]
        price = transaction["price"]
        
        if symbol not in holdings:
            holdings[symbol] = {
                "symbol": symbol,
                "totalShares": 0,
                "totalCost": 0,
                "transactions": []
            }
        
        if transaction["type"] == "buy":
            holdings[symbol]["totalShares"] += shares
            holdings[symbol]["totalCost"] += shares * price
        elif transaction["type"] == "sell":
            holdings[symbol]["totalShares"] -= shares
            holdings[symbol]["totalCost"] -= shares * price
        
        holdings[symbol]["transactions"].append(transaction)
    
    # Filter out positions with zero shares and calculate average cost
    active_holdings = {}
    for symbol, holding in holdings.items():
        if holding["totalShares"] > 0:
            holding["averageCost"] = holding["totalCost"] / holding["totalShares"]
            active_holdings[symbol] = holding
    
    return active_holdings

# ================================
# EDUCATION MODEL
# ================================

def get_articles_collection(db):
    return db['articles']

def create_article(db, title, summary, content, category):
    """Create a new education article"""
    article = {
        "title": title,
        "summary": summary,
        "content": content,
        "category": category,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    result = get_articles_collection(db).insert_one(article)
    return result.inserted_id

def get_all_articles(db, category=None):
    """Get all articles, optionally filtered by category"""
    query = {}
    if category:
        query["category"] = category
    
    return list(get_articles_collection(db).find(query).sort("createdAt", -1))

def get_article_by_id(db, article_id):
    """Get a single article by ID"""
    return get_articles_collection(db).find_one({"_id": ObjectId(article_id)})

def update_article(db, article_id, updates):
    """Update an existing article"""
    updates["updatedAt"] = datetime.now()
    result = get_articles_collection(db).update_one(
        {"_id": ObjectId(article_id)},
        {"$set": updates}
    )
    return result.modified_count > 0

def delete_article(db, article_id):
    """Delete an article"""
    result = get_articles_collection(db).delete_one({"_id": ObjectId(article_id)})
    return result.deleted_count > 0

# ================================
# PORTFOLIO ANALYTICS HELPERS
# ================================

def calculate_portfolio_performance(db, portfolio_id, days=30):
    """Calculate portfolio performance over time"""
    # This is a simplified version - in production you'd want to store daily snapshots
    transactions = get_portfolio_transactions(db, portfolio_id)
    
    # Group transactions by date and calculate cumulative value
    daily_values = {}
    cumulative_cost = 0
    
    for transaction in reversed(transactions):  # Process chronologically
        date_key = transaction["transactionDate"].strftime("%Y-%m-%d")
        cost = transaction["shares"] * transaction["price"]
        
        if transaction["type"] == "buy":
            cumulative_cost += cost
        else:
            cumulative_cost -= cost
        
        daily_values[date_key] = cumulative_cost
    
    # Convert to list format for frontend
    performance_data = []
    for date, value in sorted(daily_values.items()):
        performance_data.append({
            "date": date,
            "value": value
        })
    
    return performance_data[-days:] if len(performance_data) > days else performance_data

def get_portfolio_stats(db, user_id):
    """Get comprehensive portfolio statistics for a user"""
    portfolio = get_user_portfolio(db, user_id)
    holdings = calculate_holdings(db, portfolio["_id"])
    transactions = get_portfolio_transactions(db, portfolio["_id"], limit=10)
    
    # Calculate total value, gains, etc.
    total_value = 0
    total_cost = 0
    
    for holding in holdings.values():
        total_cost += holding["totalCost"]
        # In production, you'd fetch current market prices here
        # For now, using the average cost as placeholder
        total_value += holding["totalShares"] * holding["averageCost"]
    
    total_gain_loss = total_value - total_cost
    total_gain_loss_percent = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "portfolio": portfolio,
        "holdings": list(holdings.values()),
        "recent_transactions": transactions,
        "summary": {
            "totalValue": total_value,
            "totalCost": total_cost,
            "totalGainLoss": total_gain_loss,
            "totalGainLossPercent": total_gain_loss_percent,
            "holdingsCount": len(holdings)
        }
    }

# ================================
# PRICE ALERTS MODEL
# ================================

def get_price_alerts_collection(db):
    return db['price_alerts']

def create_price_alert(db, user_id, symbol, condition, target_price):
    """Create a new price alert"""
    alert = {
        "userId": ObjectId(user_id),
        "symbol": symbol.upper(),
        "condition": condition,  # 'above' or 'below'
        "targetPrice": float(target_price),
        "isEnabled": True,
        "isTriggered": False,
        "createdAt": datetime.now(),
        "triggeredAt": None
    }
    result = get_price_alerts_collection(db).insert_one(alert)
    return result.inserted_id

def get_user_price_alerts(db, user_id):
    """Get all price alerts for a user"""
    return list(get_price_alerts_collection(db).find({"userId": ObjectId(user_id)}))

def get_active_price_alerts(db):
    """Get all active (enabled and not triggered) price alerts"""
    return list(get_price_alerts_collection(db).find({
        "isEnabled": True,
        "isTriggered": False
    }))

def update_price_alert(db, alert_id, updates):
    """Update a price alert"""
    result = get_price_alerts_collection(db).update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": updates}
    )
    return result.modified_count > 0

def delete_price_alert(db, alert_id, user_id=None):
    """Delete a price alert"""
    query = {"_id": ObjectId(alert_id)}
    if user_id:
        query["userId"] = ObjectId(user_id)
    
    result = get_price_alerts_collection(db).delete_one(query)
    return result.deleted_count > 0

def trigger_price_alert(db, alert_id, current_price):
    """Mark a price alert as triggered"""
    updates = {
        "isTriggered": True,
        "triggeredAt": datetime.now(),
        "triggeredPrice": float(current_price)
    }
    return update_price_alert(db, alert_id, updates)

# ================================
# ADMIN ANALYTICS
# ================================

def get_admin_stats(db):
    """Get admin dashboard statistics"""
    total_users = get_user_collection(db).count_documents({})
    active_users = get_user_collection(db).count_documents({"isActive": True})
    total_portfolios = get_portfolio_collection(db).count_documents({})
    total_transactions = get_transactions_collection(db).count_documents({})
    total_articles = get_articles_collection(db).count_documents({})
    total_alerts = get_price_alerts_collection(db).count_documents({})
    active_alerts = get_price_alerts_collection(db).count_documents({"isEnabled": True, "isTriggered": False})
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalPortfolios": total_portfolios,
        "totalTransactions": total_transactions,
        "totalArticles": total_articles,
        "totalAlerts": total_alerts,
        "activeAlerts": active_alerts
    }

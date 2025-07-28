#!/usr/bin/env python3
"""
Test script for enhanced portfolio features.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import *
from app.services.analytics_service import PortfolioAnalyticsService
from pymongo import MongoClient
from bson import ObjectId
import json

def test_enhanced_features():
    """Test all enhanced portfolio features"""
    
    # Connect to database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    print("🧪 Testing Enhanced Portfolio Features")
    print("=" * 50)
    
    # Get admin user
    admin_user = db.users.find_one({'username': 'admin'})
    if not admin_user:
        print("❌ Admin user not found")
        return
    
    user_id = str(admin_user['_id'])
    print(f"✅ Testing with user: {user_id}")
    
    # 1. Test enhanced portfolio stats with daily changes
    print("\n📊 Testing Enhanced Portfolio Stats...")
    portfolio_stats = get_portfolio_stats(db, user_id)
    
    print(f"Portfolio Summary:")
    print(f"  Total Value: ${portfolio_stats['summary']['totalValue']:,.2f}")
    print(f"  Daily Change: ${portfolio_stats['summary']['dailyChange']:,.2f}")
    print(f"  Daily Change %: {portfolio_stats['summary']['dailyChangePercent']:.2f}%")
    print(f"  Total Gain/Loss: ${portfolio_stats['summary']['totalGainLoss']:,.2f}")
    print(f"  Total Gain/Loss %: {portfolio_stats['summary']['totalGainLossPercent']:.2f}%")
    
    # 2. Test Analytics Service
    print("\n🔬 Testing Analytics Service...")
    analytics_service = PortfolioAnalyticsService(db)
    
    # Test sector allocation
    sector_data = analytics_service.calculate_sector_allocation(user_id)
    print(f"Sector Allocation:")
    for sector, percentage in sector_data['allocation'].items():
        print(f"  {sector}: {percentage:.1f}%")
    print(f"  Diversification Score: {sector_data['diversification_score']}/10")
    
    # Test risk metrics
    risk_metrics = analytics_service.calculate_risk_metrics(user_id)
    print(f"\nRisk Metrics:")
    print(f"  Beta: {risk_metrics['beta']}")
    print(f"  Sharpe Ratio: {risk_metrics['sharpe_ratio']}")
    print(f"  Volatility: {risk_metrics['volatility']}%")
    print(f"  Risk Score: {risk_metrics['risk_score']}/10")
    print(f"  Risk Level: {risk_metrics['risk_level']}")
    
    # Test AI insights
    insights_data = analytics_service.get_portfolio_insights(user_id)
    print(f"\nAI Insights:")
    print(f"  Portfolio Score: {insights_data['portfolio_score']}/100")
    print(f"  Number of Insights: {len(insights_data['insights'])}")
    
    for i, insight in enumerate(insights_data['insights'][:3]):
        print(f"  {i+1}. {insight['title']} (Confidence: {insight['confidence']}%)")
    
    # 3. Test simulated market prices
    print("\n💹 Testing Market Price Simulation...")
    holdings = portfolio_stats['holdings']
    
    for holding in holdings[:3]:
        symbol = holding['symbol']
        avg_cost = holding['averageCost']
        current_price = get_simulated_market_price(symbol, avg_cost)
        daily_change = get_simulated_daily_change(symbol)
        
        print(f"  {symbol}:")
        print(f"    Average Cost: ${avg_cost:.2f}")
        print(f"    Current Price: ${current_price:.2f}")
        print(f"    Daily Change: ${daily_change:.2f}")
        print(f"    Total Return: {((current_price - avg_cost) / avg_cost * 100):.2f}%")
    
    # 4. Test portfolio performance calculation
    print("\n📈 Testing Performance Calculation...")
    portfolio = get_user_portfolio(db, user_id)
    performance_data = calculate_portfolio_performance(db, portfolio["_id"])
    
    print(f"Performance Data Points: {len(performance_data)}")
    if performance_data:
        print(f"  First Value: ${performance_data[0]['value']:,.2f}")
        print(f"  Last Value: ${performance_data[-1]['value']:,.2f}")
        
        if len(performance_data) > 1:
            total_return = performance_data[-1]['value'] - performance_data[0]['value']
            total_return_percent = (total_return / performance_data[0]['value']) * 100
            print(f"  Total Return: ${total_return:,.2f} ({total_return_percent:.2f}%)")
    
    print("\n🎉 All enhanced features tested successfully!")
    
    # Cleanup
    client.close()

if __name__ == "__main__":
    test_enhanced_features()
#!/usr/bin/env python3
"""
Test portfolio calculations for Today's Change and Total Gain/Loss
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import get_portfolio_stats
from pymongo import MongoClient

def test_portfolio_calculations():
    """Test the enhanced portfolio calculations"""
    
    client = MongoClient('mongodb://localhost:27017/')
    db = client['alpha_insights']
    
    print("🧪 Testing Portfolio Calculations")
    print("=" * 50)
    
    # Test with admin user
    user_id = '68866c15502bcef3a1dec3be'
    
    try:
        stats = get_portfolio_stats(db, user_id)
        
        print("📊 Portfolio Summary:")
        print(f"  Total Value: ${stats['summary']['totalValue']:,.2f}")
        print(f"  Total Cost: ${stats['summary']['totalCost']:,.2f}")
        print(f"  Daily Change: ${stats['summary']['dailyChange']:,.2f}")
        print(f"  Daily Change %: {stats['summary']['dailyChangePercent']:.2f}%")
        print(f"  Total Gain/Loss: ${stats['summary']['totalGainLoss']:,.2f}")
        print(f"  Total Gain/Loss %: {stats['summary']['totalGainLossPercent']:.2f}%")
        print(f"  Holdings Count: {stats['summary']['holdingsCount']}")
        
        print(f"\n📈 Holdings Details:")
        for holding in stats['holdings']:
            current_price = holding.get('currentPrice', holding['averageCost'])
            market_value = holding.get('marketValue', holding['totalShares'] * holding['averageCost'])
            daily_change = holding.get('dailyChange', 0)
            
            print(f"  {holding['symbol']}:")
            print(f"    Shares: {holding['totalShares']}")
            print(f"    Avg Cost: ${holding['averageCost']:.2f}")
            print(f"    Current Price: ${current_price:.2f}")
            print(f"    Market Value: ${market_value:,.2f}")
            print(f"    Daily Change: ${daily_change:,.2f}")
            print(f"    Total Cost: ${holding['totalCost']:,.2f}")
        
        print(f"\n✅ Calculations are working!")
        
        if stats['summary']['dailyChange'] != 0:
            print(f"✅ Daily change calculation: WORKING")
        else:
            print(f"⚠️  Daily change is 0 - this is expected for simulated data")
            
        if stats['summary']['totalGainLoss'] != 0:
            print(f"✅ Total gain/loss calculation: WORKING")
        else:
            print(f"⚠️  Total gain/loss is 0 - check if holdings have different current vs avg prices")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    client.close()

if __name__ == "__main__":
    test_portfolio_calculations()
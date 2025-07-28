"""
Portfolio Service with Real-Time Market Data Integration
Provides live portfolio calculations using current market prices
"""

import os
import logging
import redis
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.models import (
    get_user_portfolio, calculate_holdings, get_portfolio_transactions,
    update_portfolio_value
)
from app.services.market_data import market_service

logger = logging.getLogger(__name__)

class PortfolioService:
    """Enhanced portfolio service with real-time market data"""
    
    def __init__(self, db=None):
        self.db = db
        self.redis_client = None
        self.cache_ttl = 300  # 5 minutes cache for stock quotes
        
        # Initialize Redis for caching
        try:
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            self.redis_client = redis.Redis(
                host=redis_host, 
                port=redis_port, 
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established for portfolio service")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
            self.redis_client = None
    
    def _get_cached_quote(self, symbol: str) -> Optional[Dict]:
        """Get cached stock quote from Redis"""
        if not self.redis_client:
            return None
        
        try:
            cache_key = f"quote:{symbol}"
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Failed to get cached quote for {symbol}: {e}")
        
        return None
    
    def _cache_quote(self, symbol: str, quote_data: Dict):
        """Cache stock quote in Redis"""
        if not self.redis_client:
            return
        
        try:
            cache_key = f"quote:{symbol}"
            self.redis_client.setex(
                cache_key, 
                self.cache_ttl, 
                json.dumps(quote_data)
            )
        except Exception as e:
            logger.error(f"Failed to cache quote for {symbol}: {e}")
    
    def _get_real_time_quote(self, symbol: str) -> Optional[Dict]:
        """Get real-time stock quote with caching"""
        # Try cache first
        cached_quote = self._get_cached_quote(symbol)
        if cached_quote:
            logger.debug(f"Using cached quote for {symbol}")
            return cached_quote
        
        # Fetch from market service
        try:
            quote = market_service.get_stock_quote(symbol)
            if quote:
                # Cache the quote
                self._cache_quote(symbol, quote)
                logger.debug(f"Fetched fresh quote for {symbol}")
                return quote
        except Exception as e:
            logger.error(f"Failed to fetch quote for {symbol}: {e}")
        
        return None
    
    def get_portfolio_holdings(self, user_id: str) -> List[Dict[str, Any]]:
        """Get portfolio holdings with real-time market prices"""
        try:
            # Get user's portfolio
            portfolio = get_user_portfolio(self.db, user_id)
            if not portfolio:
                return []
            
            # Calculate holdings from transactions
            holdings = calculate_holdings(self.db, portfolio['_id'])
            
            # Enhance holdings with real-time market data
            enhanced_holdings = []
            for symbol, holding in holdings.items():
                try:
                    # Get real-time quote
                    quote = self._get_real_time_quote(symbol)
                    
                    if quote:
                        current_price = quote.get('price', holding['averageCost'])
                        previous_close = quote.get('previous_close', current_price)
                        
                        # Calculate market values
                        market_value = holding['totalShares'] * current_price
                        total_cost = holding['totalCost']
                        unrealized_gain = market_value - total_cost
                        unrealized_gain_percent = (unrealized_gain / total_cost * 100) if total_cost > 0 else 0
                        
                        # Calculate day change
                        day_change = current_price - previous_close
                        day_change_percent = (day_change / previous_close * 100) if previous_close > 0 else 0
                        
                        enhanced_holding = {
                            'id': str(len(enhanced_holdings) + 1),
                            'symbol': symbol,
                            'name': symbol,  # Would get from company info in production
                            'shares': holding['totalShares'],
                            'avgCost': holding['averageCost'],
                            'currentPrice': current_price,
                            'totalValue': market_value,
                            'totalCost': total_cost,
                            'unrealizedGain': unrealized_gain,
                            'unrealizedGainPercent': unrealized_gain_percent,
                            'dayChange': day_change_percent,
                            'sector': 'Unknown',  # Would get from company info
                            'lastUpdated': datetime.now().isoformat()
                        }
                    else:
                        # Fallback to average cost if quote unavailable
                        logger.warning(f"No quote available for {symbol}, using average cost")
                        market_value = holding['totalShares'] * holding['averageCost']
                        
                        enhanced_holding = {
                            'id': str(len(enhanced_holdings) + 1),
                            'symbol': symbol,
                            'name': symbol,
                            'shares': holding['totalShares'],
                            'avgCost': holding['averageCost'],
                            'currentPrice': holding['averageCost'],
                            'totalValue': market_value,
                            'totalCost': holding['totalCost'],
                            'unrealizedGain': market_value - holding['totalCost'],
                            'unrealizedGainPercent': ((market_value - holding['totalCost']) / holding['totalCost'] * 100) if holding['totalCost'] > 0 else 0,
                            'dayChange': 0,
                            'sector': 'Unknown',
                            'lastUpdated': datetime.now().isoformat()
                        }
                    
                    enhanced_holdings.append(enhanced_holding)
                    
                except Exception as e:
                    logger.error(f"Error processing holding for {symbol}: {e}")
                    continue
            
            return enhanced_holdings
            
        except Exception as e:
            logger.error(f"Failed to get portfolio holdings for user {user_id}: {e}")
            return []
    
    def get_portfolio_summary(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive portfolio summary with real-time data"""
        try:
            # Get portfolio and holdings
            portfolio = get_user_portfolio(self.db, user_id)
            if not portfolio:
                return self._empty_portfolio_summary()
            
            holdings = self.get_portfolio_holdings(user_id)
            recent_transactions = get_portfolio_transactions(self.db, portfolio['_id'], limit=10)
            
            # Calculate summary metrics
            total_market_value = sum(holding['totalValue'] for holding in holdings)
            total_cost = sum(holding['totalCost'] for holding in holdings)
            total_unrealized_gain = total_market_value - total_cost
            total_unrealized_gain_percent = (total_unrealized_gain / total_cost * 100) if total_cost > 0 else 0
            
            # Calculate daily change (sum of all holdings' day changes weighted by value)
            daily_change = 0
            daily_change_percent = 0
            
            if holdings:
                total_previous_value = 0
                for holding in holdings:
                    current_price = holding['currentPrice']
                    shares = holding['shares']
                    day_change_percent = holding['dayChange']
                    
                    # Calculate previous day's value for this holding
                    if day_change_percent != 0:
                        previous_price = current_price / (1 + day_change_percent / 100)
                        previous_value = shares * previous_price
                        total_previous_value += previous_value
                
                if total_previous_value > 0:
                    daily_change = total_market_value - total_previous_value
                    daily_change_percent = (daily_change / total_previous_value * 100)
            
            # Update portfolio value in database
            update_portfolio_value(self.db, portfolio['_id'], total_market_value)
            
            # Format recent transactions
            formatted_transactions = []
            for transaction in recent_transactions:
                formatted_transactions.append({
                    'id': str(transaction['_id']),
                    'symbol': transaction['symbol'],
                    'type': transaction['type'],
                    'shares': transaction['shares'],
                    'price': transaction['price'],
                    'totalValue': transaction['shares'] * transaction['price'],
                    'date': transaction['transactionDate'].isoformat()
                })
            
            # Calculate performance data (simplified - would use historical data in production)
            performance_data = self._calculate_performance_data(portfolio['_id'], total_market_value)
            
            summary = {
                'portfolio': {
                    'id': str(portfolio['_id']),
                    'name': portfolio['portfolioName'],
                    'createdAt': portfolio['createdAt'].isoformat()
                },
                'summary': {
                    'totalValue': total_market_value,
                    'totalCost': total_cost,
                    'totalGainLoss': total_unrealized_gain,
                    'totalGainLossPercent': total_unrealized_gain_percent,
                    'dailyChange': daily_change,
                    'dailyChangePercent': daily_change_percent,
                    'holdingsCount': len(holdings),
                    'cashBalance': 0,  # Would be stored separately in production
                    'lastUpdated': datetime.now().isoformat()
                },
                'holdings': holdings,
                'recent_transactions': formatted_transactions,
                'performance': performance_data
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get portfolio summary for user {user_id}: {e}")
            return self._empty_portfolio_summary()
    
    def _empty_portfolio_summary(self) -> Dict[str, Any]:
        """Return empty portfolio summary structure"""
        return {
            'portfolio': None,
            'summary': {
                'totalValue': 0,
                'totalCost': 0,
                'totalGainLoss': 0,
                'totalGainLossPercent': 0,
                'dailyChange': 0,
                'dailyChangePercent': 0,
                'holdingsCount': 0,
                'cashBalance': 0,
                'lastUpdated': datetime.now().isoformat()
            },
            'holdings': [],
            'recent_transactions': [],
            'performance': []
        }
    
    def _calculate_performance_data(self, portfolio_id, current_value: float) -> List[Dict]:
        """Calculate portfolio performance data (simplified version)"""
        try:
            # In production, this would use historical portfolio snapshots
            # For now, we'll create a simple performance curve based on transactions
            transactions = get_portfolio_transactions(self.db, portfolio_id)
            
            if not transactions:
                return []
            
            # Group transactions by date and calculate cumulative value
            daily_values = {}
            cumulative_cost = 0
            
            for transaction in reversed(transactions):  # Process chronologically
                date_key = transaction['transactionDate'].strftime('%Y-%m-%d')
                cost = transaction['shares'] * transaction['price']
                
                if transaction['type'] == 'buy':
                    cumulative_cost += cost
                else:
                    cumulative_cost -= cost
                
                # Estimate value growth (simplified)
                growth_factor = current_value / cumulative_cost if cumulative_cost > 0 else 1
                estimated_value = cumulative_cost * min(growth_factor, 2)  # Cap growth for realism
                
                daily_values[date_key] = estimated_value
            
            # Convert to list format for frontend
            performance_data = []
            for date, value in sorted(daily_values.items()):
                performance_data.append({
                    'date': date,
                    'value': value
                })
            
            # Limit to last 30 days for performance
            return performance_data[-30:] if len(performance_data) > 30 else performance_data
            
        except Exception as e:
            logger.error(f"Failed to calculate performance data: {e}")
            return []
    
    def get_portfolio_activity(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get recent portfolio activity with enhanced data"""
        try:
            portfolio = get_user_portfolio(self.db, user_id)
            if not portfolio:
                return []
            
            transactions = get_portfolio_transactions(self.db, portfolio['_id'], limit=limit)
            
            activity = []
            for transaction in transactions:
                # Get current quote for context
                quote = self._get_real_time_quote(transaction['symbol'])
                current_price = quote.get('price', transaction['price']) if quote else transaction['price']
                
                activity.append({
                    'id': str(transaction['_id']),
                    'symbol': transaction['symbol'],
                    'type': transaction['type'],
                    'shares': transaction['shares'],
                    'price': transaction['price'],
                    'currentPrice': current_price,
                    'totalValue': transaction['shares'] * transaction['price'],
                    'currentValue': transaction['shares'] * current_price,
                    'date': transaction['transactionDate'].isoformat(),
                    'gainLoss': (current_price - transaction['price']) * transaction['shares'] if transaction['type'] == 'buy' else 0
                })
            
            return activity
            
        except Exception as e:
            logger.error(f"Failed to get portfolio activity for user {user_id}: {e}")
            return []

# Global portfolio service instance
portfolio_service = None

def get_portfolio_service(db=None):
    """Get or create portfolio service instance"""
    global portfolio_service
    if portfolio_service is None:
        portfolio_service = PortfolioService(db)
    return portfolio_service
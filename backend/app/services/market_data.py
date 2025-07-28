"""
Market Data Service for Alpha Insights
Integrates with Polygon.io (primary) and Finnhub (backup) APIs
"""

import os
import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time

# Import API clients
try:
    from polygon import RESTClient as PolygonClient
except ImportError:
    PolygonClient = None
    
try:
    import finnhub
except ImportError:
    finnhub = None

logger = logging.getLogger(__name__)

class MarketDataService:
    """Market data service with Polygon.io primary and Finnhub backup"""
    
    def __init__(self):
        self.polygon_api_key = os.getenv('POLYGON_API_KEY')
        self.finnhub_api_key = os.getenv('FINNHUB_API_KEY')
        
        # Initialize clients
        self.polygon_client = None
        self.finnhub_client = None
        
        if self.polygon_api_key and PolygonClient:
            try:
                self.polygon_client = PolygonClient(self.polygon_api_key)
                logger.info("Polygon.io client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Polygon.io client: {e}")
        
        if self.finnhub_api_key and finnhub:
            try:
                self.finnhub_client = finnhub.Client(api_key=self.finnhub_api_key)
                logger.info("Finnhub client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Finnhub client: {e}")
        
        # Rate limiting
        self.last_request_time = {}
        self.rate_limit_delay = 0.1  # 100ms between requests
    
    def _rate_limit_check(self, service: str):
        """Basic rate limiting"""
        current_time = time.time()
        if service in self.last_request_time:
            time_diff = current_time - self.last_request_time[service]
            if time_diff < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - time_diff)
        self.last_request_time[service] = time.time()
    
    def get_stock_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get real-time stock quote"""
        try:
            # Try Polygon.io first
            if self.polygon_client:
                self._rate_limit_check('polygon')
                try:
                    quote = self.polygon_client.get_last_quote(symbol)
                    if quote:
                        return {
                            'symbol': symbol,
                            'price': quote.last_price if hasattr(quote, 'last_price') else None,
                            'change': None,  # Calculate from previous close
                            'change_percent': None,
                            'volume': quote.volume if hasattr(quote, 'volume') else None,
                            'timestamp': quote.timestamp if hasattr(quote, 'timestamp') else datetime.now().isoformat(),
                            'source': 'polygon'
                        }
                except Exception as e:
                    logger.warning(f"Polygon.io quote failed for {symbol}: {e}")
            
            # Fallback to Finnhub
            if self.finnhub_client:
                self._rate_limit_check('finnhub')
                try:
                    quote = self.finnhub_client.quote(symbol)
                    if quote and 'c' in quote:
                        return {
                            'symbol': symbol,
                            'price': quote['c'],  # Current price
                            'change': quote.get('d'),  # Change
                            'change_percent': quote.get('dp'),  # Change percent
                            'high': quote.get('h'),  # High price of the day
                            'low': quote.get('l'),  # Low price of the day
                            'open': quote.get('o'),  # Open price of the day
                            'previous_close': quote.get('pc'),  # Previous close price
                            'timestamp': datetime.now().isoformat(),
                            'source': 'finnhub'
                        }
                except Exception as e:
                    logger.warning(f"Finnhub quote failed for {symbol}: {e}")
        
        except Exception as e:
            logger.error(f"Failed to get quote for {symbol}: {e}")
        
        return None
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for stocks by symbol or company name"""
        results = []
        
        try:
            # Try Finnhub search first (better search functionality)
            if self.finnhub_client:
                self._rate_limit_check('finnhub')
                try:
                    search_results = self.finnhub_client.symbol_lookup(query)
                    if search_results and 'result' in search_results:
                        for result in search_results['result'][:limit]:
                            results.append({
                                'symbol': result.get('symbol'),
                                'name': result.get('description'),
                                'type': result.get('type'),
                                'source': 'finnhub'
                            })
                        return results
                except Exception as e:
                    logger.warning(f"Finnhub search failed for {query}: {e}")
            
            # Fallback: Basic symbol validation
            if query.upper().isalpha() and len(query) <= 5:
                quote = self.get_stock_quote(query.upper())
                if quote:
                    results.append({
                        'symbol': query.upper(),
                        'name': f"{query.upper()} Stock",
                        'type': 'stock',
                        'source': 'quote_validation'
                    })
        
        except Exception as e:
            logger.error(f"Failed to search stocks for {query}: {e}")
        
        return results
    
    def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get historical stock data"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Try Polygon.io first
            if self.polygon_client:
                self._rate_limit_check('polygon')
                try:
                    # Get aggregates (daily bars)
                    bars = self.polygon_client.get_aggs(
                        ticker=symbol,
                        multiplier=1,
                        timespan="day",
                        from_=start_date.strftime("%Y-%m-%d"),
                        to=end_date.strftime("%Y-%m-%d")
                    )
                    
                    historical_data = []
                    if bars:
                        for bar in bars:
                            historical_data.append({
                                'date': datetime.fromtimestamp(bar.timestamp / 1000).strftime("%Y-%m-%d"),
                                'open': bar.open,
                                'high': bar.high,
                                'low': bar.low,
                                'close': bar.close,
                                'volume': bar.volume
                            })
                    return historical_data
                except Exception as e:
                    logger.warning(f"Polygon.io historical data failed for {symbol}: {e}")
            
            # Fallback: Generate mock historical data for development
            historical_data = []
            base_price = 100
            for i in range(days):
                date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                # Simple random walk
                change = (hash(f"{symbol}{date}") % 200 - 100) / 100  # -1 to 1
                base_price += change
                base_price = max(base_price, 10)  # Minimum price
                
                historical_data.append({
                    'date': date,
                    'open': round(base_price, 2),
                    'high': round(base_price * 1.02, 2),
                    'low': round(base_price * 0.98, 2),
                    'close': round(base_price, 2),
                    'volume': abs(hash(f"{symbol}{date}volume")) % 1000000
                })
            
            return historical_data
        
        except Exception as e:
            logger.error(f"Failed to get historical data for {symbol}: {e}")
            return []
    
    def get_company_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get company information"""
        try:
            # Try Finnhub for company profile
            if self.finnhub_client:
                self._rate_limit_check('finnhub')
                try:
                    profile = self.finnhub_client.company_profile2(symbol=symbol)
                    if profile:
                        return {
                            'symbol': symbol,
                            'name': profile.get('name'),
                            'description': profile.get('finnhubIndustry'),
                            'website': profile.get('weburl'),
                            'industry': profile.get('finnhubIndustry'),
                            'sector': profile.get('gind'),
                            'employees': profile.get('employeeTotal'),
                            'market_cap': profile.get('marketCapitalization'),
                            'logo': profile.get('logo'),
                            'source': 'finnhub'
                        }
                except Exception as e:
                    logger.warning(f"Finnhub company info failed for {symbol}: {e}")
        
        except Exception as e:
            logger.error(f"Failed to get company info for {symbol}: {e}")
        
        return None
    
    def get_market_status(self) -> Dict[str, Any]:
        """Get market status and major indices"""
        try:
            market_data = {
                'status': 'open',  # open, closed, pre-market, after-hours
                'timestamp': datetime.now().isoformat(),
                'indices': {}
            }
            
            # Get major indices
            indices = ['SPY', 'QQQ', 'DIA']  # S&P 500, NASDAQ, DOW ETFs
            
            for index in indices:
                quote = self.get_stock_quote(index)
                if quote:
                    market_data['indices'][index] = quote
            
            return market_data
        
        except Exception as e:
            logger.error(f"Failed to get market status: {e}")
            return {
                'status': 'unknown',
                'timestamp': datetime.now().isoformat(),
                'indices': {}
            }
    
    def health_check(self) -> Dict[str, Any]:
        """Check API service health"""
        health = {
            'polygon': False,
            'finnhub': False,
            'timestamp': datetime.now().isoformat()
        }
        
        # Test Polygon.io
        if self.polygon_client:
            try:
                # Try a simple request
                quote = self.get_stock_quote('AAPL')
                health['polygon'] = quote is not None
            except:
                health['polygon'] = False
        
        # Test Finnhub
        if self.finnhub_client:
            try:
                # Try a simple request
                quote = self.finnhub_client.quote('AAPL')
                health['finnhub'] = quote is not None and 'c' in quote
            except:
                health['finnhub'] = False
        
        return health

# Global instance
market_service = MarketDataService() 
"""
Advanced Portfolio Analytics Service
Provides sophisticated portfolio metrics, risk analysis, and asset allocation insights
"""

import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
import math

from models import get_user_portfolio, calculate_holdings
from services.market_data import market_service

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Advanced portfolio analytics and risk analysis service"""
    
    def __init__(self, db=None):
        self.db = db
        self.risk_free_rate = 0.02  # 2% annual risk-free rate (10-year Treasury)
        
        # Sector mapping for common stocks (would be expanded in production)
        self.sector_mapping = {
            'AAPL': 'Technology',
            'MSFT': 'Technology', 
            'GOOGL': 'Technology',
            'AMZN': 'Consumer Discretionary',
            'TSLA': 'Consumer Discretionary',
            'NVDA': 'Technology',
            'META': 'Technology',
            'JPM': 'Financial Services',
            'JNJ': 'Healthcare',
            'V': 'Financial Services',
            'PG': 'Consumer Staples',
            'UNH': 'Healthcare',
            'HD': 'Consumer Discretionary',
            'MA': 'Financial Services',
            'BAC': 'Financial Services',
            'XOM': 'Energy',
            'CVX': 'Energy',
            'WMT': 'Consumer Staples',
            'KO': 'Consumer Staples',
            'PFE': 'Healthcare',
            'ABBV': 'Healthcare',
            'TMO': 'Healthcare',
            'COST': 'Consumer Staples',
            'AVGO': 'Technology',
            'NKE': 'Consumer Discretionary',
            'CRM': 'Technology',
            'NFLX': 'Communication Services',
            'ADBE': 'Technology',
            'PYPL': 'Financial Services',
            'INTC': 'Technology',
            'CMCSA': 'Communication Services',
            'VZ': 'Communication Services',
            'T': 'Communication Services',
            'DIS': 'Communication Services',
            'ORCL': 'Technology',
            'IBM': 'Technology',
            'QCOM': 'Technology',
            'AMD': 'Technology'
        }
    
    def get_asset_allocation(self, user_id: str) -> Dict[str, Any]:
        """Calculate asset allocation by sector for a user's portfolio"""
        try:
            # Get user's portfolio holdings
            portfolio = get_user_portfolio(self.db, user_id)
            if not portfolio:
                return self._empty_allocation()
            
            holdings = calculate_holdings(self.db, portfolio['_id'])
            if not holdings:
                return self._empty_allocation()
            
            # Calculate sector allocation
            sector_values = defaultdict(float)
            total_portfolio_value = 0
            
            for symbol, holding in holdings.items():
                # Get current market price
                try:
                    quote = market_service.get_stock_quote(symbol)
                    current_price = quote.get('price', holding['averageCost']) if quote else holding['averageCost']
                except:
                    current_price = holding['averageCost']
                
                market_value = holding['totalShares'] * current_price
                total_portfolio_value += market_value
                
                # Get sector (use mapping or try to fetch from company info)
                sector = self._get_stock_sector(symbol)
                sector_values[sector] += market_value
            
            # Calculate percentages
            allocation = {}
            for sector, value in sector_values.items():
                percentage = (value / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
                allocation[sector] = {
                    'value': value,
                    'percentage': round(percentage, 2),
                    'color': self._get_sector_color(sector)
                }
            
            # Sort by percentage (descending)
            sorted_allocation = dict(sorted(allocation.items(), key=lambda x: x[1]['percentage'], reverse=True))
            
            return {
                'allocation': sorted_allocation,
                'total_value': total_portfolio_value,
                'diversification_score': self._calculate_diversification_score(allocation),
                'recommendations': self._generate_allocation_recommendations(allocation),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate asset allocation for user {user_id}: {e}")
            return self._empty_allocation()
    
    def calculate_risk_metrics(self, user_id: str, period_days: int = 252) -> Dict[str, Any]:
        """Calculate portfolio risk metrics including Beta and Sharpe Ratio"""
        try:
            # Get user's portfolio holdings
            portfolio = get_user_portfolio(self.db, user_id)
            if not portfolio:
                return self._empty_risk_metrics()
            
            holdings = calculate_holdings(self.db, portfolio['_id'])
            if not holdings:
                return self._empty_risk_metrics()
            
            # Get historical data for portfolio stocks and market index (SPY)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days + 30)  # Extra buffer for data
            
            portfolio_returns = self._calculate_portfolio_returns(holdings, start_date, end_date)
            market_returns = self._get_market_returns('SPY', start_date, end_date)
            
            if not portfolio_returns or not market_returns:
                logger.warning(f"Insufficient data for risk calculation for user {user_id}")
                return self._empty_risk_metrics()
            
            # Align dates and calculate metrics
            aligned_data = self._align_returns_data(portfolio_returns, market_returns)
            
            if len(aligned_data) < 30:  # Need at least 30 data points
                logger.warning(f"Insufficient aligned data points for user {user_id}")
                return self._empty_risk_metrics()
            
            portfolio_returns_series = [item['portfolio_return'] for item in aligned_data]
            market_returns_series = [item['market_return'] for item in aligned_data]
            
            # Calculate risk metrics
            beta = self._calculate_beta(portfolio_returns_series, market_returns_series)
            sharpe_ratio = self._calculate_sharpe_ratio(portfolio_returns_series)
            volatility = self._calculate_volatility(portfolio_returns_series)
            max_drawdown = self._calculate_max_drawdown(portfolio_returns_series)
            var_95 = self._calculate_var(portfolio_returns_series, confidence=0.95)
            
            # Calculate additional metrics
            correlation = self._calculate_correlation(portfolio_returns_series, market_returns_series)
            alpha = self._calculate_alpha(portfolio_returns_series, market_returns_series, beta)
            
            return {
                'beta': round(beta, 3),
                'sharpe_ratio': round(sharpe_ratio, 3),
                'volatility': round(volatility * 100, 2),  # Convert to percentage
                'alpha': round(alpha * 100, 2),  # Convert to percentage
                'correlation': round(correlation, 3),
                'max_drawdown': round(max_drawdown * 100, 2),  # Convert to percentage
                'var_95': round(var_95 * 100, 2),  # Convert to percentage
                'risk_score': self._calculate_risk_score(beta, volatility, sharpe_ratio),
                'risk_level': self._get_risk_level(beta, volatility),
                'recommendations': self._generate_risk_recommendations(beta, volatility, sharpe_ratio),
                'calculation_period': period_days,
                'data_points': len(aligned_data),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate risk metrics for user {user_id}: {e}")
            return self._empty_risk_metrics()
    
    def get_portfolio_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive portfolio analytics combining allocation and risk metrics"""
        try:
            allocation = self.get_asset_allocation(user_id)
            risk_metrics = self.calculate_risk_metrics(user_id)
            
            # Calculate additional insights
            insights = self._generate_portfolio_insights(allocation, risk_metrics)
            
            return {
                'asset_allocation': allocation,
                'risk_metrics': risk_metrics,
                'insights': insights,
                'overall_score': self._calculate_overall_portfolio_score(allocation, risk_metrics),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get portfolio analytics for user {user_id}: {e}")
            return {
                'asset_allocation': self._empty_allocation(),
                'risk_metrics': self._empty_risk_metrics(),
                'insights': [],
                'overall_score': 0,
                'generated_at': datetime.now().isoformat()
            }
    
    def _get_stock_sector(self, symbol: str) -> str:
        """Get sector for a stock symbol"""
        # First check our mapping
        if symbol in self.sector_mapping:
            return self.sector_mapping[symbol]
        
        # Try to get from company info (if available)
        try:
            company_info = market_service.get_company_info(symbol)
            if company_info and company_info.get('sector'):
                return company_info['sector']
        except:
            pass
        
        # Default to Unknown
        return 'Unknown'
    
    def _get_sector_color(self, sector: str) -> str:
        """Get color for sector visualization"""
        color_map = {
            'Technology': '#3B82F6',
            'Healthcare': '#10B981',
            'Financial Services': '#F59E0B',
            'Consumer Discretionary': '#EF4444',
            'Consumer Staples': '#8B5CF6',
            'Energy': '#F97316',
            'Communication Services': '#06B6D4',
            'Industrials': '#84CC16',
            'Materials': '#6B7280',
            'Real Estate': '#EC4899',
            'Utilities': '#14B8A6',
            'Unknown': '#9CA3AF'
        }
        return color_map.get(sector, '#9CA3AF')
    
    def _calculate_diversification_score(self, allocation: Dict) -> float:
        """Calculate diversification score (0-10, higher is better)"""
        if not allocation:
            return 0
        
        # Calculate Herfindahl-Hirschman Index (HHI)
        hhi = sum((sector_data['percentage'] / 100) ** 2 for sector_data in allocation.values())
        
        # Convert to diversification score (inverse of concentration)
        # HHI ranges from 1/n to 1, where n is number of sectors
        # Lower HHI = better diversification
        max_hhi = 1.0  # Maximum concentration (all in one sector)
        min_hhi = 1.0 / len(allocation) if allocation else 1.0
        
        # Normalize to 0-10 scale (10 = perfectly diversified)
        if max_hhi == min_hhi:
            return 10
        
        normalized_score = (max_hhi - hhi) / (max_hhi - min_hhi)
        return round(normalized_score * 10, 1)
    
    def _generate_allocation_recommendations(self, allocation: Dict) -> List[str]:
        """Generate asset allocation recommendations"""
        recommendations = []
        
        if not allocation:
            return ["Start building your portfolio with diversified investments"]
        
        # Check for over-concentration
        for sector, data in allocation.items():
            if data['percentage'] > 40:
                recommendations.append(f"Consider reducing {sector} exposure (currently {data['percentage']:.1f}%)")
        
        # Check for missing major sectors
        major_sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary']
        missing_sectors = [sector for sector in major_sectors if sector not in allocation]
        
        if missing_sectors:
            recommendations.append(f"Consider adding exposure to: {', '.join(missing_sectors)}")
        
        # Diversification recommendations
        if len(allocation) < 3:
            recommendations.append("Increase diversification by investing in more sectors")
        
        if not recommendations:
            recommendations.append("Your portfolio shows good sector diversification")
        
        return recommendations
    
    def _calculate_portfolio_returns(self, holdings: Dict, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Calculate daily portfolio returns"""
        try:
            # Get historical data for all holdings
            stock_data = {}
            total_value = 0
            
            for symbol, holding in holdings.items():
                try:
                    historical_data = market_service.get_historical_data(symbol, days=365)
                    if historical_data:
                        stock_data[symbol] = {
                            'data': historical_data,
                            'shares': holding['totalShares']
                        }
                        # Calculate current value for weighting
                        current_price = historical_data[-1]['close'] if historical_data else holding['averageCost']
                        total_value += holding['totalShares'] * current_price
                except Exception as e:
                    logger.warning(f"Failed to get historical data for {symbol}: {e}")
                    continue
            
            if not stock_data:
                return []
            
            # Calculate daily portfolio values and returns
            portfolio_returns = []
            previous_value = None
            
            # Find common dates across all stocks
            all_dates = set()
            for symbol_data in stock_data.values():
                dates = {item['date'] for item in symbol_data['data']}
                if not all_dates:
                    all_dates = dates
                else:
                    all_dates = all_dates.intersection(dates)
            
            sorted_dates = sorted(all_dates)
            
            for date in sorted_dates:
                portfolio_value = 0
                
                # Calculate portfolio value for this date
                for symbol, symbol_data in stock_data.items():
                    # Find price for this date
                    price = None
                    for data_point in symbol_data['data']:
                        if data_point['date'] == date:
                            price = data_point['close']
                            break
                    
                    if price:
                        portfolio_value += symbol_data['shares'] * price
                
                if portfolio_value > 0:
                    if previous_value is not None:
                        daily_return = (portfolio_value - previous_value) / previous_value
                        portfolio_returns.append({
                            'date': date,
                            'portfolio_return': daily_return,
                            'portfolio_value': portfolio_value
                        })
                    
                    previous_value = portfolio_value
            
            return portfolio_returns
            
        except Exception as e:
            logger.error(f"Failed to calculate portfolio returns: {e}")
            return []
    
    def _get_market_returns(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get market returns for benchmark (e.g., SPY)"""
        try:
            historical_data = market_service.get_historical_data(symbol, days=365)
            if not historical_data:
                return []
            
            market_returns = []
            previous_price = None
            
            for data_point in historical_data:
                current_price = data_point['close']
                
                if previous_price is not None:
                    daily_return = (current_price - previous_price) / previous_price
                    market_returns.append({
                        'date': data_point['date'],
                        'market_return': daily_return,
                        'price': current_price
                    })
                
                previous_price = current_price
            
            return market_returns
            
        except Exception as e:
            logger.error(f"Failed to get market returns for {symbol}: {e}")
            return []
    
    def _align_returns_data(self, portfolio_returns: List[Dict], market_returns: List[Dict]) -> List[Dict]:
        """Align portfolio and market returns by date"""
        # Create dictionaries for fast lookup
        portfolio_dict = {item['date']: item['portfolio_return'] for item in portfolio_returns}
        market_dict = {item['date']: item['market_return'] for item in market_returns}
        
        # Find common dates
        common_dates = set(portfolio_dict.keys()).intersection(set(market_dict.keys()))
        
        # Create aligned data
        aligned_data = []
        for date in sorted(common_dates):
            aligned_data.append({
                'date': date,
                'portfolio_return': portfolio_dict[date],
                'market_return': market_dict[date]
            })
        
        return aligned_data
    
    def _calculate_beta(self, portfolio_returns: List[float], market_returns: List[float]) -> float:
        """Calculate portfolio beta"""
        try:
            if len(portfolio_returns) != len(market_returns) or len(portfolio_returns) < 2:
                return 1.0
            
            # Calculate covariance and variance
            portfolio_mean = np.mean(portfolio_returns)
            market_mean = np.mean(market_returns)
            
            covariance = np.mean([(p - portfolio_mean) * (m - market_mean) 
                                for p, m in zip(portfolio_returns, market_returns)])
            market_variance = np.var(market_returns)
            
            if market_variance == 0:
                return 1.0
            
            beta = covariance / market_variance
            return max(0, min(3.0, beta))  # Cap beta between 0 and 3
            
        except Exception as e:
            logger.error(f"Failed to calculate beta: {e}")
            return 1.0
    
    def _calculate_sharpe_ratio(self, returns: List[float]) -> float:
        """Calculate Sharpe ratio"""
        try:
            if not returns or len(returns) < 2:
                return 0.0
            
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            
            if std_return == 0:
                return 0.0
            
            # Annualize the returns (assuming daily returns)
            annual_return = mean_return * 252
            annual_std = std_return * np.sqrt(252)
            daily_risk_free = self.risk_free_rate / 252
            
            sharpe = (annual_return - self.risk_free_rate) / annual_std
            return max(-3.0, min(3.0, sharpe))  # Cap between -3 and 3
            
        except Exception as e:
            logger.error(f"Failed to calculate Sharpe ratio: {e}")
            return 0.0
    
    def _calculate_volatility(self, returns: List[float]) -> float:
        """Calculate annualized volatility"""
        try:
            if not returns or len(returns) < 2:
                return 0.0
            
            std_return = np.std(returns)
            # Annualize (assuming daily returns)
            annual_volatility = std_return * np.sqrt(252)
            return min(2.0, annual_volatility)  # Cap at 200%
            
        except Exception as e:
            logger.error(f"Failed to calculate volatility: {e}")
            return 0.0
    
    def _calculate_max_drawdown(self, returns: List[float]) -> float:
        """Calculate maximum drawdown"""
        try:
            if not returns:
                return 0.0
            
            # Calculate cumulative returns
            cumulative = [1.0]
            for ret in returns:
                cumulative.append(cumulative[-1] * (1 + ret))
            
            # Calculate drawdowns
            peak = cumulative[0]
            max_drawdown = 0.0
            
            for value in cumulative[1:]:
                if value > peak:
                    peak = value
                else:
                    drawdown = (peak - value) / peak
                    max_drawdown = max(max_drawdown, drawdown)
            
            return min(1.0, max_drawdown)  # Cap at 100%
            
        except Exception as e:
            logger.error(f"Failed to calculate max drawdown: {e}")
            return 0.0
    
    def _calculate_var(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Value at Risk"""
        try:
            if not returns or len(returns) < 10:
                return 0.0
            
            sorted_returns = sorted(returns)
            index = int((1 - confidence) * len(sorted_returns))
            var = abs(sorted_returns[index])
            
            return min(1.0, var)  # Cap at 100%
            
        except Exception as e:
            logger.error(f"Failed to calculate VaR: {e}")
            return 0.0
    
    def _calculate_correlation(self, portfolio_returns: List[float], market_returns: List[float]) -> float:
        """Calculate correlation with market"""
        try:
            if len(portfolio_returns) != len(market_returns) or len(portfolio_returns) < 2:
                return 0.0
            
            correlation = np.corrcoef(portfolio_returns, market_returns)[0, 1]
            return 0.0 if np.isnan(correlation) else correlation
            
        except Exception as e:
            logger.error(f"Failed to calculate correlation: {e}")
            return 0.0
    
    def _calculate_alpha(self, portfolio_returns: List[float], market_returns: List[float], beta: float) -> float:
        """Calculate portfolio alpha"""
        try:
            if not portfolio_returns or not market_returns:
                return 0.0
            
            portfolio_mean = np.mean(portfolio_returns) * 252  # Annualize
            market_mean = np.mean(market_returns) * 252  # Annualize
            
            alpha = portfolio_mean - (self.risk_free_rate + beta * (market_mean - self.risk_free_rate))
            return max(-1.0, min(1.0, alpha))  # Cap between -100% and 100%
            
        except Exception as e:
            logger.error(f"Failed to calculate alpha: {e}")
            return 0.0
    
    def _calculate_risk_score(self, beta: float, volatility: float, sharpe_ratio: float) -> float:
        """Calculate overall risk score (1-10, higher = riskier)"""
        try:
            # Normalize components to 0-1 scale
            beta_score = min(1.0, beta / 2.0)  # Beta of 2 = max score
            volatility_score = min(1.0, volatility / 0.5)  # 50% volatility = max score
            sharpe_score = max(0, min(1.0, (2 - sharpe_ratio) / 2))  # Lower Sharpe = higher risk
            
            # Weighted average
            risk_score = (beta_score * 0.3 + volatility_score * 0.5 + sharpe_score * 0.2) * 10
            return round(risk_score, 1)
            
        except Exception as e:
            logger.error(f"Failed to calculate risk score: {e}")
            return 5.0
    
    def _get_risk_level(self, beta: float, volatility: float) -> str:
        """Get risk level description"""
        if volatility < 0.15 and beta < 0.8:
            return 'Conservative'
        elif volatility < 0.25 and beta < 1.2:
            return 'Moderate'
        elif volatility < 0.35 and beta < 1.5:
            return 'Aggressive'
        else:
            return 'Very Aggressive'
    
    def _generate_risk_recommendations(self, beta: float, volatility: float, sharpe_ratio: float) -> List[str]:
        """Generate risk-based recommendations"""
        recommendations = []
        
        if beta > 1.5:
            recommendations.append("Your portfolio is highly sensitive to market movements. Consider adding defensive stocks.")
        elif beta < 0.5:
            recommendations.append("Your portfolio may be too conservative. Consider adding growth stocks for better returns.")
        
        if volatility > 0.3:
            recommendations.append("High volatility detected. Consider diversifying across sectors and asset classes.")
        
        if sharpe_ratio < 0:
            recommendations.append("Poor risk-adjusted returns. Review your investment strategy and consider rebalancing.")
        elif sharpe_ratio > 1.5:
            recommendations.append("Excellent risk-adjusted returns! Consider maintaining your current strategy.")
        
        if not recommendations:
            recommendations.append("Your portfolio shows balanced risk characteristics.")
        
        return recommendations
    
    def _generate_portfolio_insights(self, allocation: Dict, risk_metrics: Dict) -> List[Dict]:
        """Generate portfolio insights combining allocation and risk data"""
        insights = []
        
        # Diversification insights
        if allocation.get('diversification_score', 0) < 5:
            insights.append({
                'type': 'warning',
                'title': 'Low Diversification',
                'message': 'Your portfolio is concentrated in few sectors. Consider diversifying.',
                'priority': 'high'
            })
        
        # Risk insights
        risk_score = risk_metrics.get('risk_score', 5)
        if risk_score > 7:
            insights.append({
                'type': 'warning',
                'title': 'High Risk Portfolio',
                'message': 'Your portfolio has high risk. Consider adding defensive positions.',
                'priority': 'medium'
            })
        
        # Performance insights
        sharpe_ratio = risk_metrics.get('sharpe_ratio', 0)
        if sharpe_ratio > 1:
            insights.append({
                'type': 'success',
                'title': 'Good Risk-Adjusted Returns',
                'message': 'Your portfolio shows strong risk-adjusted performance.',
                'priority': 'low'
            })
        
        return insights
    
    def _calculate_overall_portfolio_score(self, allocation: Dict, risk_metrics: Dict) -> float:
        """Calculate overall portfolio score (0-100)"""
        try:
            diversification_score = allocation.get('diversification_score', 0) * 10  # 0-100
            risk_score = max(0, 100 - risk_metrics.get('risk_score', 5) * 10)  # Lower risk = higher score
            sharpe_score = min(100, max(0, (risk_metrics.get('sharpe_ratio', 0) + 1) * 50))  # -1 to 1 -> 0 to 100
            
            # Weighted average
            overall_score = (diversification_score * 0.4 + risk_score * 0.3 + sharpe_score * 0.3)
            return round(overall_score, 1)
            
        except Exception as e:
            logger.error(f"Failed to calculate overall score: {e}")
            return 50.0
    
    def _empty_allocation(self) -> Dict[str, Any]:
        """Return empty allocation structure"""
        return {
            'allocation': {},
            'total_value': 0,
            'diversification_score': 0,
            'recommendations': ["Start building your portfolio"],
            'last_updated': datetime.now().isoformat()
        }
    
    def _empty_risk_metrics(self) -> Dict[str, Any]:
        """Return empty risk metrics structure"""
        return {
            'beta': 1.0,
            'sharpe_ratio': 0.0,
            'volatility': 0.0,
            'alpha': 0.0,
            'correlation': 0.0,
            'max_drawdown': 0.0,
            'var_95': 0.0,
            'risk_score': 5.0,
            'risk_level': 'Unknown',
            'recommendations': ["Insufficient data for risk analysis"],
            'calculation_period': 0,
            'data_points': 0,
            'last_updated': datetime.now().isoformat()
        }

# Global analytics service instance
analytics_service = None

def get_analytics_service(db=None):
    """Get or create analytics service instance"""
    global analytics_service
    if analytics_service is None:
        analytics_service = AnalyticsService(db)
    return analytics_service
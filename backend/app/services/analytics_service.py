"""
Portfolio Analytics Service
Provides advanced portfolio analysis, risk metrics, and AI insights.
"""

import numpy as np
from datetime import datetime, timedelta
from ..models import get_portfolio_stats, get_user_transactions
import random
import hashlib

class PortfolioAnalyticsService:
    def __init__(self, db):
        self.db = db
    
    def calculate_sector_allocation(self, user_id):
        """Calculate portfolio allocation by sector"""
        portfolio_stats = get_portfolio_stats(self.db, user_id)
        
        # Sector mapping for common stocks
        sector_map = {
            'AAPL': 'Technology',
            'MSFT': 'Technology', 
            'GOOGL': 'Technology',
            'AMZN': 'Technology',
            'TSLA': 'Automotive',
            'NVDA': 'Technology',
            'JPM': 'Financial',
            'JNJ': 'Healthcare',
            'PG': 'Consumer Goods',
            'KO': 'Consumer Goods',
            'WMT': 'Consumer Goods',
            'V': 'Financial',
            'MA': 'Financial'
        }
        
        sector_allocation = {}
        total_value = 0
        
        for holding in portfolio_stats['holdings']:
            sector = sector_map.get(holding['symbol'], 'Other')
            value = holding.get('marketValue', holding['totalShares'] * holding['averageCost'])
            
            sector_allocation[sector] = sector_allocation.get(sector, 0) + value
            total_value += value
        
        # Convert to percentages
        sector_percentages = {}
        for sector, value in sector_allocation.items():
            sector_percentages[sector] = round((value / total_value * 100), 1) if total_value > 0 else 0
        
        return {
            'allocation': sector_percentages,
            'total_value': total_value,
            'diversification_score': self._calculate_diversification_score(sector_percentages),
            'recommendations': self._get_sector_recommendations(sector_percentages)
        }
    
    def calculate_risk_metrics(self, user_id):
        """Calculate portfolio risk metrics"""
        portfolio_stats = get_portfolio_stats(self.db, user_id)
        
        if not portfolio_stats['holdings']:
            return {
                'beta': 0,
                'sharpe_ratio': 0,
                'volatility': 0,
                'alpha': 0,
                'correlation': 0,
                'max_drawdown': 0,
                'var_95': 0,
                'risk_score': 0,
                'risk_level': 'No Data',
                'recommendations': ['Add holdings to calculate risk metrics']
            }
        
        # Simulate risk calculations (in production, use real market data)
        total_value = portfolio_stats['summary']['totalValue']
        holdings_count = len(portfolio_stats['holdings'])
        
        # Calculate simulated metrics based on portfolio composition
        beta = self._calculate_simulated_beta(portfolio_stats['holdings'])
        volatility = self._calculate_simulated_volatility(portfolio_stats['holdings'])
        sharpe_ratio = self._calculate_simulated_sharpe_ratio(portfolio_stats)
        
        risk_score = min(10, max(1, (beta * 3 + volatility / 5)))
        risk_level = self._get_risk_level(risk_score)
        
        return {
            'beta': round(beta, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'volatility': round(volatility, 1),
            'alpha': round(random.uniform(-2, 4), 2),
            'correlation': round(random.uniform(0.6, 0.9), 2),
            'max_drawdown': round(random.uniform(-20, -5), 1),
            'var_95': round(random.uniform(-5, -1), 1),
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'recommendations': self._get_risk_recommendations(risk_score, beta, volatility)
        }
    
    def get_portfolio_insights(self, user_id):
        """Generate AI-powered portfolio insights"""
        portfolio_stats = get_portfolio_stats(self.db, user_id)
        sector_data = self.calculate_sector_allocation(user_id)
        risk_metrics = self.calculate_risk_metrics(user_id)
        
        insights = []
        
        # Diversification insights
        if len(sector_data['allocation']) < 3:
            insights.append({
                'type': 'diversification',
                'title': 'Improve Diversification',
                'description': f'Your portfolio is concentrated in {len(sector_data["allocation"])} sectors. Consider diversifying across more sectors.',
                'confidence': 85,
                'impact': 'High',
                'action': 'Add holdings in different sectors'
            })
        
        # Risk insights
        if risk_metrics['risk_score'] > 7:
            insights.append({
                'type': 'risk',
                'title': 'High Risk Portfolio',
                'description': f'Your portfolio has a risk score of {risk_metrics["risk_score"]}/10. Consider adding defensive positions.',
                'confidence': 78,
                'impact': 'Medium',
                'action': 'Add bonds or defensive stocks'
            })
        
        # Sector concentration insights
        max_sector = max(sector_data['allocation'].items(), key=lambda x: x[1]) if sector_data['allocation'] else ('', 0)
        if max_sector[1] > 60:
            insights.append({
                'type': 'rebalance',
                'title': f'Overweight in {max_sector[0]}',
                'description': f'{max_sector[0]} represents {max_sector[1]}% of your portfolio. Consider reducing exposure.',
                'confidence': 82,
                'impact': 'Medium',
                'action': f'Reduce {max_sector[0]} allocation to 40-50%'
            })
        
        # Performance insights
        total_gain_loss_percent = portfolio_stats['summary']['totalGainLossPercent']
        if total_gain_loss_percent > 15:
            insights.append({
                'type': 'performance',
                'title': 'Strong Performance',
                'description': f'Your portfolio is up {total_gain_loss_percent:.1f}%. Consider taking some profits.',
                'confidence': 70,
                'impact': 'Low',
                'action': 'Consider profit-taking on best performers'
            })
        elif total_gain_loss_percent < -10:
            insights.append({
                'type': 'performance',
                'title': 'Portfolio Underperforming',
                'description': f'Your portfolio is down {abs(total_gain_loss_percent):.1f}%. Review underperforming positions.',
                'confidence': 75,
                'impact': 'Medium',
                'action': 'Analyze and consider rebalancing'
            })
        
        return {
            'insights': insights,
            'generated_at': datetime.now().isoformat(),
            'portfolio_score': self._calculate_portfolio_score(portfolio_stats, sector_data, risk_metrics)
        }
    
    def _calculate_diversification_score(self, sector_percentages):
        """Calculate diversification score (1-10)"""
        if not sector_percentages:
            return 0
        
        # Higher score for more even distribution
        num_sectors = len(sector_percentages)
        max_allocation = max(sector_percentages.values()) if sector_percentages else 100
        
        # Base score on number of sectors and concentration
        base_score = min(num_sectors * 2, 8)
        concentration_penalty = max_allocation / 20  # Penalty for concentration
        
        return max(1, min(10, base_score - concentration_penalty))
    
    def _get_sector_recommendations(self, sector_percentages):
        """Get sector allocation recommendations"""
        recommendations = []
        
        if not sector_percentages:
            return ['Start building your portfolio with diversified holdings']
        
        max_sector = max(sector_percentages.items(), key=lambda x: x[1])
        
        if max_sector[1] > 70:
            recommendations.append(f'Reduce {max_sector[0]} exposure from {max_sector[1]}% to 50-60%')
        
        if len(sector_percentages) < 3:
            recommendations.append('Add holdings in at least 2-3 more sectors')
        
        if 'Healthcare' not in sector_percentages:
            recommendations.append('Consider adding healthcare stocks for defensive exposure')
        
        if 'Financial' not in sector_percentages:
            recommendations.append('Consider adding financial sector exposure')
        
        return recommendations or ['Your sector allocation looks well balanced']
    
    def _calculate_simulated_beta(self, holdings):
        """Calculate simulated portfolio beta"""
        if not holdings:
            return 1.0
        
        # Simulate beta based on stock symbols (tech stocks = higher beta)
        tech_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']
        total_value = sum(h.get('marketValue', h['totalShares'] * h['averageCost']) for h in holdings)
        
        weighted_beta = 0
        for holding in holdings:
            weight = (holding.get('marketValue', holding['totalShares'] * holding['averageCost']) / total_value)
            stock_beta = 1.3 if holding['symbol'] in tech_symbols else random.uniform(0.8, 1.2)
            weighted_beta += weight * stock_beta
        
        return weighted_beta
    
    def _calculate_simulated_volatility(self, holdings):
        """Calculate simulated portfolio volatility"""
        if not holdings:
            return 0
        
        # Higher volatility for tech-heavy portfolios
        tech_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']
        tech_weight = sum(
            (h.get('marketValue', h['totalShares'] * h['averageCost']) 
             for h in holdings if h['symbol'] in tech_symbols), 0
        )
        total_value = sum(h.get('marketValue', h['totalShares'] * h['averageCost']) for h in holdings)
        
        tech_percentage = (tech_weight / total_value) if total_value > 0 else 0
        base_volatility = 15 + (tech_percentage * 10)  # 15-25% range
        
        return base_volatility
    
    def _calculate_simulated_sharpe_ratio(self, portfolio_stats):
        """Calculate simulated Sharpe ratio"""
        total_return_percent = portfolio_stats['summary']['totalGainLossPercent']
        risk_free_rate = 2.0  # Assume 2% risk-free rate
        
        if total_return_percent <= risk_free_rate:
            return 0
        
        # Simulate based on returns and estimated volatility
        excess_return = total_return_percent - risk_free_rate
        estimated_volatility = 18  # Assume 18% volatility
        
        return excess_return / estimated_volatility
    
    def _get_risk_level(self, risk_score):
        """Convert risk score to risk level"""
        if risk_score <= 3:
            return 'Conservative'
        elif risk_score <= 5:
            return 'Moderate'
        elif risk_score <= 7:
            return 'Moderate-High'
        else:
            return 'Aggressive'
    
    def _get_risk_recommendations(self, risk_score, beta, volatility):
        """Get risk-based recommendations"""
        recommendations = []
        
        if risk_score > 7:
            recommendations.append('Consider adding defensive stocks or bonds to reduce risk')
        
        if beta > 1.3:
            recommendations.append('Your portfolio is more volatile than the market - consider diversifying')
        
        if volatility > 20:
            recommendations.append('High volatility detected - add stable dividend stocks')
        
        if risk_score < 4:
            recommendations.append('Conservative portfolio - consider adding growth stocks for higher returns')
        
        return recommendations or ['Your risk profile appears balanced']
    
    def _calculate_portfolio_score(self, portfolio_stats, sector_data, risk_metrics):
        """Calculate overall portfolio score (1-100)"""
        # Diversification score (30%)
        diversification_score = sector_data['diversification_score'] * 3
        
        # Performance score (40%)
        gain_loss_percent = portfolio_stats['summary']['totalGainLossPercent']
        performance_score = min(40, max(0, (gain_loss_percent + 10) * 2))  # -10% to +10% maps to 0-40
        
        # Risk score (30%) - inverse of risk (lower risk = higher score)
        risk_score = max(0, 30 - (risk_metrics['risk_score'] * 3))
        
        total_score = diversification_score + performance_score + risk_score
        return min(100, max(0, round(total_score)))
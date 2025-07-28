"""
Portfolio routes blueprint.
Handles portfolio management, holdings, and performance tracking.
"""

import jwt
import logging
from flask import Blueprint, request, jsonify, current_app

from ..models import get_portfolio_stats, calculate_portfolio_performance, get_user_transactions
from ..services.analytics_service import PortfolioAnalyticsService
from .auth import decode_jwt

logger = logging.getLogger(__name__)

portfolio_bp = Blueprint('portfolio_bp', __name__)

def require_auth():
    """Helper function to require authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
        
    token = auth_header.split(' ')[1]
    payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
    return payload

@portfolio_bp.route('', methods=['GET'])
def get_portfolio_summary():
    """Get comprehensive portfolio summary with performance metrics - DATABASE DRIVEN"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Get real portfolio stats from database
        portfolio_stats = get_portfolio_stats(current_app.db, user_id)
        
        # Format comprehensive response for frontend
        portfolio_summary = {
            'totalValue': portfolio_stats['summary']['totalValue'],
            'dailyChange': portfolio_stats['summary']['dailyChange'],
            'dailyChangePercent': portfolio_stats['summary']['dailyChangePercent'],
            'totalGainLoss': portfolio_stats['summary']['totalGainLoss'],
            'totalGainLossPercent': portfolio_stats['summary']['totalGainLossPercent'],
            'cashBalance': 0,  # Would be stored separately in a real system
            'holdingsCount': portfolio_stats['summary']['holdingsCount'],
            'holdings': [],
            'recentTransactions': [],
            'performance': calculate_portfolio_performance(current_app.db, portfolio_stats['portfolio']['_id'])
        }
        
        # Format holdings for frontend with enhanced data
        for holding in portfolio_stats['holdings']:
            # Use the enhanced market data from models
            current_price = holding.get('currentPrice', holding['averageCost'])
            market_value = holding.get('marketValue', holding['totalShares'] * holding['averageCost'])
            total_cost = holding['totalCost']
            gain_loss = market_value - total_cost
            gain_loss_percent = (gain_loss / total_cost * 100) if total_cost > 0 else 0
            daily_change = holding.get('dailyChange', 0)
            
            portfolio_summary['holdings'].append({
                'id': str(holding.get('_id', holding['symbol'])),
                'symbol': holding['symbol'],
                'name': holding['symbol'],  # Would get from market data service
                'shares': holding['totalShares'],
                'avgCost': holding['averageCost'],
                'currentPrice': current_price,
                'totalValue': market_value,
                'totalCost': total_cost,
                'unrealizedGain': gain_loss,
                'unrealizedGainPercent': gain_loss_percent,
                'dayChange': daily_change,
                'sector': 'Technology'  # Would get from market data
            })
        
        # Format recent transactions
        for transaction in portfolio_stats['recent_transactions']:
            portfolio_summary['recentTransactions'].append({
                'id': str(transaction['_id']),
                'type': transaction['type'],
                'symbol': transaction['symbol'],
                'shares': transaction['shares'],
                'price': transaction['price'],
                'total': transaction['shares'] * transaction['price'],
                'date': transaction['transactionDate'].isoformat() + 'Z',
                'status': 'completed'
            })
        
        return jsonify({
            'success': True,
            'data': portfolio_summary
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio summary error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio summary'}), 500

@portfolio_bp.route('/holdings', methods=['GET'])
def get_portfolio_holdings():
    """Get detailed portfolio holdings"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock holdings data
        holdings = [
            {
                'id': '1',
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'shares': 150,
                'avgCost': 148.20,
                'currentPrice': 175.50,
                'totalValue': 26325.00,
                'totalCost': 22230.00,
                'unrealizedGain': 4095.00,
                'unrealizedGainPercent': 18.42,
                'dayChange': 2.1,
                'sector': 'Technology'
            },
            {
                'id': '2',
                'symbol': 'MSFT',
                'name': 'Microsoft Corp.',
                'shares': 80,
                'avgCost': 340.25,
                'currentPrice': 415.80,
                'totalValue': 33264.00,
                'totalCost': 27220.00,
                'unrealizedGain': 6044.00,
                'unrealizedGainPercent': 22.20,
                'dayChange': -0.8,
                'sector': 'Technology'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': holdings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio holdings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio holdings'}), 500

@portfolio_bp.route('/risk-analysis', methods=['GET'])
def get_portfolio_risk_analysis():
    """Get portfolio risk analysis"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock risk analysis data
        risk_analysis = {
            'riskScore': 6.8,
            'volatility': 18.5,
            'sharpeRatio': 1.24,
            'beta': 1.15,
            'diversificationScore': 7.2,
            'recommendations': [
                'Consider reducing tech sector exposure from 75% to 60%',
                'Add defensive stocks like utilities or consumer staples',
                'International diversification recommended - currently 0%',
                'Consider adding bonds for stability (recommended 20-30%)'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': risk_analysis
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Risk analysis error: {str(e)}")
        return jsonify({'error': 'Failed to fetch risk analysis'}), 500

@portfolio_bp.route('/activity', methods=['GET'])
def get_portfolio_activity():
    """Get portfolio activity/transaction history - DATABASE DRIVEN"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Get real transaction data from database
        transactions = get_user_transactions(current_app.db, user_id, limit=20)
        
        activity = []
        for transaction in transactions:
            activity.append({
                'id': str(transaction['_id']),
                'type': transaction['type'],
                'symbol': transaction['symbol'],
                'name': transaction['symbol'],  # Would get from market data service
                'shares': transaction['shares'],
                'price': transaction['price'],
                'total': transaction['shares'] * transaction['price'],
                'date': transaction['transactionDate'].isoformat() + 'Z',
                'status': 'completed'
            })
        
        return jsonify({
            'success': True,
            'data': activity
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio activity error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio activity'}), 500

@portfolio_bp.route('/transactions', methods=['GET'])
def get_portfolio_transactions_route():
    """Get user's transaction history"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):
            return payload
            
        user_id = payload['user_id']
        limit = request.args.get('limit', 50, type=int)
        
        transactions = get_user_transactions(current_app.db, user_id, limit=limit)
        
        formatted_transactions = []
        for t in transactions:
            formatted_transactions.append({
                'id': str(t['_id']),
                'type': t.get('type'),
                'symbol': t.get('symbol'),
                'shares': t.get('shares'),
                'price': t.get('price'),
                'total': t.get('shares', 0) * t.get('price', 0),
                'date': t.get('transactionDate').isoformat() + 'Z' if t.get('transactionDate') else None,
                'status': 'completed'
            })
        
        return jsonify({
            'success': True,
            'data': formatted_transactions
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio transactions error: {str(e)}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500

@portfolio_bp.route('/real-time', methods=['GET'])
def get_real_time_portfolio():
    """Get real-time portfolio summary with live market data"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock real-time portfolio data
        real_time_portfolio = {
            'totalValue': 125847.32,
            'dailyChange': 1247.85,
            'dailyChangePercent': 1.00,
            'totalGainLoss': 15847.32,
            'totalGainLossPercent': 14.40,
            'cashBalance': 5000.00,
            'lastUpdated': '2025-07-27T23:07:45Z'
        }
        
        return jsonify({
            'success': True,
            'data': real_time_portfolio
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Real-time portfolio error: {str(e)}")
        return jsonify({'error': 'Failed to fetch real-time portfolio data'}), 500

@portfolio_bp.route('/holdings/real-time', methods=['GET'])
def get_real_time_holdings():
    """Get portfolio holdings with real-time market prices"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock real-time holdings data
        real_time_holdings = [
            {
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'shares': 150,
                'currentPrice': 175.50,
                'previousClose': 172.30,
                'dayChange': 3.20,
                'dayChangePercent': 1.86,
                'totalValue': 26325.00,
                'lastUpdated': '2025-07-27T23:07:45Z'
            },
            {
                'symbol': 'MSFT',
                'name': 'Microsoft Corp.',
                'shares': 80,
                'currentPrice': 415.80,
                'previousClose': 418.90,
                'dayChange': -3.10,
                'dayChangePercent': -0.74,
                'totalValue': 33264.00,
                'lastUpdated': '2025-07-27T23:07:45Z'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': real_time_holdings
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Real-time holdings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch real-time holdings'}), 500

@portfolio_bp.route('/analytics', methods=['GET'])
def get_portfolio_analytics():
    """Get comprehensive portfolio analytics including risk metrics and asset allocation"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock analytics data
        analytics = {
            'asset_allocation': {
                'Technology': 75.2,
                'Healthcare': 12.8,
                'Finance': 8.5,
                'Consumer': 3.5
            },
            'risk_metrics': {
                'beta': 1.15,
                'sharpe_ratio': 1.24,
                'volatility': 18.5,
                'max_drawdown': -12.3
            },
            'insights': [
                'Your portfolio is heavily weighted in technology stocks',
                'Consider diversifying into other sectors',
                'Risk level is moderate to high',
                'Performance has been above market average'
            ],
            'overall_score': 7.2
        }
        
        return jsonify({
            'success': True,
            'data': analytics
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio analytics error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio analytics'}), 500

@portfolio_bp.route('/asset-allocation', methods=['GET'])
def get_asset_allocation():
    """Get portfolio asset allocation by sector"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Mock asset allocation data
        asset_allocation = {
            'allocation': {
                'Technology': 75.2,
                'Healthcare': 12.8,
                'Finance': 8.5,
                'Consumer': 3.5
            },
            'total_value': 125847.32,
            'diversification_score': 6.2,
            'recommendations': [
                'Reduce technology exposure to 60%',
                'Increase healthcare allocation to 20%',
                'Add international exposure',
                'Consider adding bonds for stability'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': asset_allocation
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Asset allocation error: {str(e)}")
        return jsonify({'error': 'Failed to fetch asset allocation'}), 500

@portfolio_bp.route('/risk-metrics', methods=['GET'])
def get_risk_metrics():
    """Get detailed portfolio risk metrics including Beta and Sharpe ratio"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Use analytics service for real calculations
        from ..services.analytics_service import PortfolioAnalyticsService
        analytics_service = PortfolioAnalyticsService(current_app.db)
        
        risk_metrics = analytics_service.calculate_risk_metrics(user_id)
        
        return jsonify({
            'success': True,
            'data': risk_metrics
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Risk metrics error: {str(e)}")
        return jsonify({'error': 'Failed to fetch risk metrics'}), 500

@portfolio_bp.route('/sector-allocation', methods=['GET'])
def get_sector_allocation():
    """Get portfolio sector allocation"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Use analytics service for real calculations
        from ..services.analytics_service import PortfolioAnalyticsService
        analytics_service = PortfolioAnalyticsService(current_app.db)
        
        sector_data = analytics_service.calculate_sector_allocation(user_id)
        
        return jsonify({
            'success': True,
            'data': sector_data
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Sector allocation error: {str(e)}")
        return jsonify({'error': 'Failed to fetch sector allocation'}), 500

@portfolio_bp.route('/ai-insights', methods=['GET'])
def get_ai_insights():
    """Get AI-powered portfolio insights and recommendations"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Use analytics service for AI insights
        from ..services.analytics_service import PortfolioAnalyticsService
        analytics_service = PortfolioAnalyticsService(current_app.db)
        
        insights = analytics_service.get_portfolio_insights(user_id)
        
        return jsonify({
            'success': True,
            'data': insights
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"AI insights error: {str(e)}")
        return jsonify({'error': 'Failed to fetch AI insights'}), 500

@portfolio_bp.route('/performance', methods=['GET'])
def get_portfolio_performance():
    """Get portfolio performance data"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        timeframe = request.args.get('timeframe', '6M')
        
        # Mock performance data based on timeframe
        if timeframe == '1M':
            performance_data = [
                {'date': '2025-06-27', 'value': 122500},
                {'date': '2025-07-04', 'value': 123800},
                {'date': '2025-07-11', 'value': 121200},
                {'date': '2025-07-18', 'value': 124600},
                {'date': '2025-07-27', 'value': 125847}
            ]
        elif timeframe == '3M':
            performance_data = [
                {'date': '2025-04-27', 'value': 108000},
                {'date': '2025-05-27', 'value': 115000},
                {'date': '2025-06-27', 'value': 122000},
                {'date': '2025-07-27', 'value': 125847}
            ]
        else:  # Default 6M
            performance_data = [
                {'date': '2025-01-27', 'value': 95000},
                {'date': '2025-02-27', 'value': 102000},
                {'date': '2025-03-27', 'value': 98000},
                {'date': '2025-04-27', 'value': 108000},
                {'date': '2025-05-27', 'value': 115000},
                {'date': '2025-06-27', 'value': 122000},
                {'date': '2025-07-27', 'value': 125847}
            ]
        
        return jsonify({
            'success': True,
            'data': performance_data
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Portfolio performance error: {str(e)}")
        return jsonify({'error': 'Failed to fetch portfolio performance'}), 500




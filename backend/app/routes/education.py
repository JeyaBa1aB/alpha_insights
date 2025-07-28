"""
Education routes blueprint.
Handles educational content and articles.
"""

import jwt
import logging
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId

from .auth import decode_jwt

logger = logging.getLogger(__name__)

education_bp = Blueprint('education_bp', __name__)

def require_auth():
    """Helper function to require authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
        
    token = auth_header.split(' ')[1]
    payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
    return payload

@education_bp.route('/articles', methods=['GET'])
def get_education_articles():
    """Get all education articles"""
    try:
        category = request.args.get('category')
        
        # Build query
        query = {}
        if category:
            query['category'] = category
        
        # Get articles from database or return mock data
        try:
            articles_cursor = current_app.db.articles.find(query).sort('createdAt', -1)
            articles = []
            
            for article in articles_cursor:
                articles.append({
                    'id': str(article['_id']),
                    'title': article['title'],
                    'summary': article['summary'],
                    'category': article['category'],
                    'createdAt': article['createdAt'].isoformat() + 'Z' if hasattr(article['createdAt'], 'isoformat') else article['createdAt'],
                    'updatedAt': article['updatedAt'].isoformat() + 'Z' if hasattr(article['updatedAt'], 'isoformat') else article['updatedAt']
                })
            
            # If no articles in database, return mock data
            if not articles:
                articles = get_mock_articles(category)
                
        except Exception as db_error:
            logger.warning(f"Database error, using mock data: {db_error}")
            articles = get_mock_articles(category)
        
        return jsonify({
            'success': True,
            'data': articles
        })
        
    except Exception as e:
        logger.error(f"Get articles error: {str(e)}")
        return jsonify({'error': 'Failed to fetch articles'}), 500

@education_bp.route('/articles/<article_id>', methods=['GET'])
def get_single_article(article_id):
    """Get a single article by ID"""
    try:
        # Try to get from database first
        try:
            article = current_app.db.articles.find_one({'_id': ObjectId(article_id)})
            
            if article:
                return jsonify({
                    'success': True,
                    'data': {
                        'id': str(article['_id']),
                        'title': article['title'],
                        'summary': article['summary'],
                        'content': article['content'],
                        'category': article['category'],
                        'createdAt': article['createdAt'].isoformat() + 'Z' if hasattr(article['createdAt'], 'isoformat') else article['createdAt'],
                        'updatedAt': article['updatedAt'].isoformat() + 'Z' if hasattr(article['updatedAt'], 'isoformat') else article['updatedAt']
                    }
                })
        except Exception as db_error:
            logger.warning(f"Database error, using mock data: {db_error}")
        
        # Return mock article if not found in database
        mock_article = get_mock_article_by_id(article_id)
        if mock_article:
            return jsonify({
                'success': True,
                'data': mock_article
            })
        else:
            return jsonify({'error': 'Article not found'}), 404
        
    except Exception as e:
        logger.error(f"Get article error: {str(e)}")
        return jsonify({'error': 'Failed to fetch article'}), 500

def get_mock_articles(category=None):
    """Return mock articles data"""
    all_articles = [
        {
            'id': '1',
            'title': 'Introduction to Stock Market Investing',
            'summary': 'Learn the basics of stock market investing, including key concepts and strategies.',
            'category': 'basics',
            'createdAt': '2025-01-15T10:00:00Z',
            'updatedAt': '2025-01-15T10:00:00Z'
        },
        {
            'id': '2',
            'title': 'Understanding Portfolio Diversification',
            'summary': 'Discover how to build a diversified portfolio to manage risk and maximize returns.',
            'category': 'portfolio',
            'createdAt': '2025-01-20T14:30:00Z',
            'updatedAt': '2025-01-20T14:30:00Z'
        },
        {
            'id': '3',
            'title': 'Risk Management Strategies',
            'summary': 'Essential risk management techniques every investor should know.',
            'category': 'risk',
            'createdAt': '2025-01-25T09:15:00Z',
            'updatedAt': '2025-01-25T09:15:00Z'
        },
        {
            'id': '4',
            'title': 'Technical Analysis Fundamentals',
            'summary': 'Learn to read charts and identify trading opportunities using technical analysis.',
            'category': 'analysis',
            'createdAt': '2025-02-01T11:45:00Z',
            'updatedAt': '2025-02-01T11:45:00Z'
        },
        {
            'id': '5',
            'title': 'Options Trading Basics',
            'summary': 'An introduction to options trading, including calls, puts, and basic strategies.',
            'category': 'advanced',
            'createdAt': '2025-02-05T16:20:00Z',
            'updatedAt': '2025-02-05T16:20:00Z'
        }
    ]
    
    if category:
        return [article for article in all_articles if article['category'] == category]
    
    return all_articles

def get_mock_article_by_id(article_id):
    """Return mock article content by ID"""
    articles = {
        '1': {
            'id': '1',
            'title': 'Introduction to Stock Market Investing',
            'summary': 'Learn the basics of stock market investing, including key concepts and strategies.',
            'content': '''
# Introduction to Stock Market Investing

## What is the Stock Market?

The stock market is a collection of markets where stocks (pieces of ownership in businesses) are traded between investors. It usually refers to the exchanges where stocks and other securities are bought and sold.

## Key Concepts

### Stocks
Stocks represent ownership shares in a company. When you buy stock, you become a shareholder and own a piece of that company.

### Market Capitalization
Market cap is the total value of a company's shares. It's calculated by multiplying the stock price by the number of outstanding shares.

### Dividends
Some companies pay dividends to shareholders as a way to distribute profits. Not all companies pay dividends.

## Getting Started

1. **Education**: Learn the basics before investing
2. **Set Goals**: Define your investment objectives
3. **Risk Assessment**: Understand your risk tolerance
4. **Start Small**: Begin with small investments
5. **Diversify**: Don't put all your money in one stock

## Common Investment Strategies

- **Buy and Hold**: Long-term investment strategy
- **Dollar-Cost Averaging**: Investing fixed amounts regularly
- **Value Investing**: Looking for undervalued stocks
- **Growth Investing**: Focusing on companies with high growth potential

Remember: All investments carry risk, and past performance doesn't guarantee future results.
            ''',
            'category': 'basics',
            'createdAt': '2025-01-15T10:00:00Z',
            'updatedAt': '2025-01-15T10:00:00Z'
        },
        '2': {
            'id': '2',
            'title': 'Understanding Portfolio Diversification',
            'summary': 'Discover how to build a diversified portfolio to manage risk and maximize returns.',
            'content': '''
# Understanding Portfolio Diversification

## What is Diversification?

Diversification is an investment strategy that involves spreading your investments across various assets to reduce risk. The idea is that different investments will perform differently over time.

## Why Diversify?

- **Risk Reduction**: Reduces the impact of poor performance in any single investment
- **Smoother Returns**: Helps create more consistent portfolio performance
- **Protection**: Guards against market volatility

## Types of Diversification

### Asset Class Diversification
- Stocks
- Bonds
- Real Estate
- Commodities
- Cash

### Geographic Diversification
- Domestic investments
- International developed markets
- Emerging markets

### Sector Diversification
- Technology
- Healthcare
- Finance
- Consumer goods
- Energy

## Building a Diversified Portfolio

1. **Assess Your Risk Tolerance**
2. **Set Asset Allocation Targets**
3. **Choose Investments Within Each Category**
4. **Rebalance Regularly**
5. **Monitor and Adjust**

## Common Mistakes

- Over-diversification (too many similar investments)
- Under-diversification (too concentrated)
- Ignoring correlation between investments
- Not rebalancing regularly

Remember: Diversification doesn't guarantee profits or protect against losses, but it can help manage risk.
            ''',
            'category': 'portfolio',
            'createdAt': '2025-01-20T14:30:00Z',
            'updatedAt': '2025-01-20T14:30:00Z'
        }
    }
    
    return articles.get(article_id)
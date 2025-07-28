"""
Transactions routes blueprint.
Handles transaction management (buy/sell orders).
"""

import jwt
import logging
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from .auth import decode_jwt

logger = logging.getLogger(__name__)

transactions_bp = Blueprint('transactions_bp', __name__)

def require_auth():
    """Helper function to require authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
        
    token = auth_header.split(' ')[1]
    payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
    return payload

@transactions_bp.route('', methods=['POST'])
def create_transaction():
    """Create a new transaction (buy/sell order)"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['symbol', 'type', 'shares', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate transaction type
        if data['type'] not in ['buy', 'sell']:
            return jsonify({'error': 'Transaction type must be "buy" or "sell"'}), 400
        
        # Validate numeric fields
        try:
            shares = float(data['shares'])
            price = float(data['price'])
            if shares <= 0 or price <= 0:
                return jsonify({'error': 'Shares and price must be positive numbers'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Shares and price must be valid numbers'}), 400
        
        # Create transaction record
        transaction = {
            'user_id': user_id,
            'symbol': data['symbol'].upper(),
            'type': data['type'],
            'shares': shares,
            'price': price,
            'total': shares * price,
            'status': 'completed',  # In a real system, this might be 'pending' initially
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into database
        result = current_app.db.transactions.insert_one(transaction)
        transaction_id = str(result.inserted_id)
        
        logger.info(f"Transaction created: {transaction_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'message': 'Transaction created successfully',
                'transaction_id': transaction_id
            }
        }), 201
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Create transaction error: {str(e)}")
        return jsonify({'error': 'Failed to create transaction'}), 500

@transactions_bp.route('/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        data = request.get_json()
        
        # Build update document
        update_fields = {}
        
        if 'symbol' in data:
            update_fields['symbol'] = data['symbol'].upper()
        if 'type' in data:
            if data['type'] not in ['buy', 'sell']:
                return jsonify({'error': 'Transaction type must be "buy" or "sell"'}), 400
            update_fields['type'] = data['type']
        if 'shares' in data:
            try:
                shares = float(data['shares'])
                if shares <= 0:
                    return jsonify({'error': 'Shares must be a positive number'}), 400
                update_fields['shares'] = shares
            except (ValueError, TypeError):
                return jsonify({'error': 'Shares must be a valid number'}), 400
        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'error': 'Price must be a positive number'}), 400
                update_fields['price'] = price
            except (ValueError, TypeError):
                return jsonify({'error': 'Price must be a valid number'}), 400
        
        # Recalculate total if shares or price changed
        if 'shares' in update_fields or 'price' in update_fields:
            # Get current transaction to get missing values
            from bson import ObjectId
            current_transaction = current_app.db.transactions.find_one({
                '_id': ObjectId(transaction_id),
                'user_id': user_id
            })
            
            if not current_transaction:
                return jsonify({'error': 'Transaction not found'}), 404
            
            final_shares = update_fields.get('shares', current_transaction['shares'])
            final_price = update_fields.get('price', current_transaction['price'])
            update_fields['total'] = final_shares * final_price
        
        update_fields['updated_at'] = datetime.utcnow()
        
        # Update transaction in database
        from bson import ObjectId
        result = current_app.db.transactions.update_one(
            {'_id': ObjectId(transaction_id), 'user_id': user_id},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Transaction not found'}), 404
        
        logger.info(f"Transaction updated: {transaction_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Transaction updated successfully'}
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Update transaction error: {str(e)}")
        return jsonify({'error': 'Failed to update transaction'}), 500

@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Delete transaction from database
        from bson import ObjectId
        result = current_app.db.transactions.delete_one({
            '_id': ObjectId(transaction_id),
            'user_id': user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Transaction not found'}), 404
        
        logger.info(f"Transaction deleted: {transaction_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Transaction deleted successfully'}
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Delete transaction error: {str(e)}")
        return jsonify({'error': 'Failed to delete transaction'}), 500

@transactions_bp.route('', methods=['GET'])
def get_transactions():
    """Get user's transaction history"""
    try:
        payload = require_auth()
        if isinstance(payload, tuple):  # Error response
            return payload
            
        user_id = payload['user_id']
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        symbol = request.args.get('symbol')
        transaction_type = request.args.get('type')
        
        # Build query
        query = {'user_id': user_id}
        if symbol:
            query['symbol'] = symbol.upper()
        if transaction_type:
            query['type'] = transaction_type
        
        # Get transactions from database
        transactions_cursor = current_app.db.transactions.find(query).sort('created_at', -1).skip(offset).limit(limit)
        transactions = []
        
        for transaction in transactions_cursor:
            transactions.append({
                'id': str(transaction['_id']),
                'symbol': transaction['symbol'],
                'type': transaction['type'],
                'shares': transaction['shares'],
                'price': transaction['price'],
                'total': transaction['total'],
                'status': transaction['status'],
                'created_at': transaction['created_at'].isoformat() + 'Z',
                'updated_at': transaction['updated_at'].isoformat() + 'Z'
            })
        
        # Get total count for pagination
        total_count = current_app.db.transactions.count_documents(query)
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': transactions,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            }
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Get transactions error: {str(e)}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500
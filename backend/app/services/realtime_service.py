"""
Real-time Market Data Service
Handles WebSocket connections and price updates.
"""

import asyncio
import random
import time
from datetime import datetime
from flask_socketio import emit, join_room, leave_room
import logging

logger = logging.getLogger(__name__)

class RealTimeMarketService:
    def __init__(self, socketio, db):
        self.socketio = socketio
        self.db = db
        self.active_symbols = set()
        self.user_subscriptions = {}  # user_id -> set of symbols
        self.price_cache = {}
        self.is_running = False
        
        # Initialize with some base prices
        self.initialize_prices()
    
    def initialize_prices(self):
        """Initialize base prices for common stocks"""
        base_prices = {
            'AAPL': 175.50,
            'MSFT': 415.80,
            'GOOGL': 2650.00,
            'AMZN': 3200.00,
            'TSLA': 240.10,
            'NVDA': 450.25,
            'META': 320.75,
            'JPM': 145.60,
            'JNJ': 162.30,
            'PG': 155.40,
            'KO': 58.90,
            'WMT': 165.20,
            'V': 245.80,
            'MA': 410.30,
            'UNH': 520.40,
            'HD': 330.50,
            'DIS': 95.20,
            'NFLX': 485.60,
            'ADBE': 580.30,
            'CRM': 220.40
        }
        
        for symbol, price in base_prices.items():
            self.price_cache[symbol] = {
                'symbol': symbol,
                'price': price,
                'change': 0,
                'changePercent': 0,
                'volume': random.randint(1000000, 10000000),
                'timestamp': datetime.now().isoformat()
            }
    
    def subscribe_user_to_symbol(self, user_id, symbol):
        """Subscribe a user to price updates for a symbol"""
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        
        self.user_subscriptions[user_id].add(symbol)
        self.active_symbols.add(symbol)
        
        # Send current price immediately
        if symbol in self.price_cache:
            emit('price_update', self.price_cache[symbol])
        
        logger.info(f"User {user_id} subscribed to {symbol}")
    
    def unsubscribe_user_from_symbol(self, user_id, symbol):
        """Unsubscribe a user from price updates for a symbol"""
        if user_id in self.user_subscriptions:
            self.user_subscriptions[user_id].discard(symbol)
            
            # If no users are subscribed to this symbol, remove it from active symbols
            if not any(symbol in subs for subs in self.user_subscriptions.values()):
                self.active_symbols.discard(symbol)
        
        logger.info(f"User {user_id} unsubscribed from {symbol}")
    
    def unsubscribe_user_from_all(self, user_id):
        """Unsubscribe a user from all symbols"""
        if user_id in self.user_subscriptions:
            symbols = self.user_subscriptions[user_id].copy()
            for symbol in symbols:
                self.unsubscribe_user_from_symbol(user_id, symbol)
            del self.user_subscriptions[user_id]
        
        logger.info(f"User {user_id} unsubscribed from all symbols")
    
    def generate_price_update(self, symbol):
        """Generate a realistic price update for a symbol"""
        if symbol not in self.price_cache:
            # Initialize with a random price if not exists
            self.price_cache[symbol] = {
                'symbol': symbol,
                'price': random.uniform(50, 500),
                'change': 0,
                'changePercent': 0,
                'volume': random.randint(1000000, 10000000),
                'timestamp': datetime.now().isoformat()
            }
        
        current_data = self.price_cache[symbol]
        current_price = current_data['price']
        
        # Generate realistic price movement (-2% to +2%)
        change_percent = random.uniform(-2.0, 2.0)
        
        # Apply some market hours logic (more volatile during trading hours)
        now = datetime.now()
        if 9 <= now.hour <= 16:  # Market hours (simplified)
            change_percent *= 1.5  # More volatile during market hours
        else:
            change_percent *= 0.3  # Less volatile after hours
        
        new_price = current_price * (1 + change_percent / 100)
        change = new_price - current_price
        
        # Update cache
        self.price_cache[symbol] = {
            'symbol': symbol,
            'price': round(new_price, 2),
            'change': round(change, 2),
            'changePercent': round(change_percent, 2),
            'volume': current_data['volume'] + random.randint(1000, 100000),
            'timestamp': datetime.now().isoformat()
        }
        
        return self.price_cache[symbol]
    
    def broadcast_price_updates(self):
        """Broadcast price updates to all subscribed users"""
        for symbol in self.active_symbols.copy():  # Copy to avoid modification during iteration
            try:
                price_data = self.generate_price_update(symbol)
                self.socketio.emit('price_update', price_data)
                logger.debug(f"Broadcasted price update for {symbol}: ${price_data['price']}")
            except Exception as e:
                logger.error(f"Error broadcasting price update for {symbol}: {str(e)}")
    
    def start_price_updates(self):
        """Start the price update loop"""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info("Starting real-time price updates")
        
        def update_loop():
            while self.is_running:
                try:
                    if self.active_symbols:
                        self.broadcast_price_updates()
                    time.sleep(5)  # Update every 5 seconds
                except Exception as e:
                    logger.error(f"Error in price update loop: {str(e)}")
                    time.sleep(10)  # Wait longer on error
        
        # Start the update loop in a separate thread
        import threading
        update_thread = threading.Thread(target=update_loop, daemon=True)
        update_thread.start()
    
    def stop_price_updates(self):
        """Stop the price update loop"""
        self.is_running = False
        logger.info("Stopped real-time price updates")
    
    def get_current_price(self, symbol):
        """Get current price for a symbol"""
        if symbol in self.price_cache:
            return self.price_cache[symbol]
        else:
            # Generate initial price if not cached
            return self.generate_price_update(symbol)
    
    def get_market_status(self):
        """Get current market status"""
        now = datetime.now()
        
        # Simplified market hours (9 AM - 4 PM EST)
        if 9 <= now.hour < 16:
            status = "open"
        elif 16 <= now.hour < 20:
            status = "after_hours"
        else:
            status = "closed"
        
        return {
            'status': status,
            'timestamp': now.isoformat(),
            'next_open': '09:00:00',
            'next_close': '16:00:00'
        }

# WebSocket event handlers
def setup_realtime_handlers(socketio, realtime_service):
    """Setup WebSocket event handlers for real-time data"""
    
    @socketio.on('connect')
    def handle_connect():
        logger.info(f"Client connected: {request.sid}")
        emit('connected', {'status': 'connected'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info(f"Client disconnected: {request.sid}")
        # Clean up user subscriptions if needed
    
    @socketio.on('subscribe_price')
    def handle_subscribe_price(data):
        try:
            symbol = data.get('symbol', '').upper()
            user_id = data.get('user_id', 'anonymous')
            
            if symbol:
                realtime_service.subscribe_user_to_symbol(user_id, symbol)
                emit('subscription_confirmed', {'symbol': symbol, 'status': 'subscribed'})
            else:
                emit('error', {'message': 'Symbol is required'})
        except Exception as e:
            logger.error(f"Error in subscribe_price: {str(e)}")
            emit('error', {'message': 'Subscription failed'})
    
    @socketio.on('unsubscribe_price')
    def handle_unsubscribe_price(data):
        try:
            symbol = data.get('symbol', '').upper()
            user_id = data.get('user_id', 'anonymous')
            
            if symbol:
                realtime_service.unsubscribe_user_from_symbol(user_id, symbol)
                emit('subscription_confirmed', {'symbol': symbol, 'status': 'unsubscribed'})
        except Exception as e:
            logger.error(f"Error in unsubscribe_price: {str(e)}")
            emit('error', {'message': 'Unsubscription failed'})
    
    @socketio.on('get_current_price')
    def handle_get_current_price(data):
        try:
            symbol = data.get('symbol', '').upper()
            
            if symbol:
                price_data = realtime_service.get_current_price(symbol)
                emit('current_price', price_data)
            else:
                emit('error', {'message': 'Symbol is required'})
        except Exception as e:
            logger.error(f"Error in get_current_price: {str(e)}")
            emit('error', {'message': 'Failed to get current price'})
    
    @socketio.on('get_market_status')
    def handle_get_market_status():
        try:
            market_status = realtime_service.get_market_status()
            emit('market_status', market_status)
        except Exception as e:
            logger.error(f"Error in get_market_status: {str(e)}")
            emit('error', {'message': 'Failed to get market status'})
    
    # Start the price update service
    realtime_service.start_price_updates()
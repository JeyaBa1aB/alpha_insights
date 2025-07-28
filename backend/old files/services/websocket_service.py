"""
WebSocket Service for Alpha Insights
Handles real-time notifications and market updates
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import asyncio
from threading import Thread
import time

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing and sending real-time notifications"""
    
    def __init__(self, socketio, db=None):
        self.socketio = socketio
        self.db = db
        self.active_connections = {}  # user_id -> session_id mapping
        self.user_subscriptions = {}  # user_id -> list of subscriptions
        self.price_alerts = {}  # alert_id -> alert configuration
        self.last_prices = {}  # symbol -> last known price
        self.last_portfolio_values = {}  # user_id -> last portfolio value
        
        # Start background tasks
        self.monitoring_active = True
        self.alert_monitor_thread = Thread(target=self._monitor_alerts)
        self.alert_monitor_thread.daemon = True
        self.alert_monitor_thread.start()
        
        # Start portfolio monitoring
        self.portfolio_monitor_thread = Thread(target=self._monitor_portfolios)
        self.portfolio_monitor_thread.daemon = True
        self.portfolio_monitor_thread.start()
        
        logger.info("Notification service initialized with portfolio monitoring")
    
    def register_user_connection(self, user_id: str, session_id: str):
        """Register a user's WebSocket connection"""
        self.active_connections[user_id] = session_id
        logger.info(f"User {user_id} connected with session {session_id}")
    
    def unregister_user_connection(self, user_id: str):
        """Unregister a user's WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected")
    
    def add_price_alert(self, user_id: str, alert_config: Dict[str, Any]) -> str:
        """Add a price alert for a user - DATABASE DRIVEN"""
        from app.models import create_price_alert
        
        try:
            alert_id = create_price_alert(
                self.db,
                user_id,
                alert_config['symbol'],
                alert_config['condition'],
                alert_config['target_price']
            )
            
            # Add to user subscriptions for WebSocket tracking
            if user_id not in self.user_subscriptions:
                self.user_subscriptions[user_id] = []
            
            self.user_subscriptions[user_id].append({
                'type': 'price_alert',
                'alert_id': str(alert_id),
                'symbol': alert_config['symbol']
            })
            
            logger.info(f"Added price alert {alert_id} for user {user_id}")
            return str(alert_id)
            
        except Exception as e:
            logger.error(f"Failed to add price alert for user {user_id}: {e}")
            raise
    
    def remove_price_alert(self, user_id: str, alert_id: str) -> bool:
        """Remove a price alert - DATABASE DRIVEN"""
        from app.models import delete_price_alert
        
        try:
            success = delete_price_alert(self.db, alert_id, user_id)
            
            if success:
                # Remove from user subscriptions
                if user_id in self.user_subscriptions:
                    self.user_subscriptions[user_id] = [
                        sub for sub in self.user_subscriptions[user_id]
                        if sub.get('alert_id') != alert_id
                    ]
                
                logger.info(f"Removed price alert {alert_id} for user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to remove price alert {alert_id} for user {user_id}: {e}")
            return False
    
    def get_user_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all alerts for a user - DATABASE DRIVEN"""
        from app.models import get_user_price_alerts
        
        try:
            alerts = get_user_price_alerts(self.db, user_id)
            
            # Format alerts for frontend
            formatted_alerts = []
            for alert in alerts:
                formatted_alerts.append({
                    'id': str(alert['_id']),
                    'user_id': str(alert['userId']),
                    'symbol': alert['symbol'],
                    'condition': alert['condition'],
                    'target_price': alert['targetPrice'],
                    'enabled': alert['isEnabled'],
                    'triggered': alert['isTriggered'],
                    'created_at': alert['createdAt'].isoformat(),
                    'triggered_at': alert['triggeredAt'].isoformat() if alert['triggeredAt'] else None
                })
            
            return formatted_alerts
            
        except Exception as e:
            logger.error(f"Failed to get alerts for user {user_id}: {e}")
            return []
    
    def send_notification(self, user_id: str, notification: Dict[str, Any]):
        """Send notification to a specific user"""
        if user_id in self.active_connections:
            try:
                session_id = self.active_connections[user_id]
                self.socketio.emit('notification', notification, room=session_id)
                logger.info(f"Sent notification to user {user_id}: {notification['type']}")
            except Exception as e:
                logger.error(f"Failed to send notification to user {user_id}: {e}")
    
    def broadcast_market_update(self, market_data: Dict[str, Any]):
        """Broadcast market update to all connected users"""
        try:
            notification = {
                'type': 'market_update',
                'data': market_data,
                'timestamp': datetime.now().isoformat()
            }
            self.socketio.emit('market_update', notification, broadcast=True)
            logger.debug("Broadcasted market update")
        except Exception as e:
            logger.error(f"Failed to broadcast market update: {e}")
    
    def send_price_alert(self, user_id: str, alert: Dict[str, Any], current_price: float):
        """Send price alert notification"""
        notification = {
            'type': 'price_alert',
            'alert_id': alert['id'],
            'symbol': alert['symbol'],
            'condition': alert['condition'],
            'target_price': alert['target_price'],
            'current_price': current_price,
            'message': f"{alert['symbol']} is now ${current_price:.2f} ({alert['condition']} ${alert['target_price']:.2f})",
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_notification(user_id, notification)
        
        # Mark alert as triggered
        alert['triggered'] = True
        alert['triggered_at'] = datetime.now().isoformat()
    
    def send_portfolio_update(self, user_id: str, portfolio_data: Dict[str, Any]):
        """Send portfolio update notification"""
        notification = {
            'type': 'portfolio_update',
            'data': portfolio_data,
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_notification(user_id, notification)
    
    def send_system_notification(self, user_id: str, message: str, level: str = 'info'):
        """Send system notification"""
        notification = {
            'type': 'system',
            'level': level,  # info, warning, error, success
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_notification(user_id, notification)
    
    def _monitor_alerts(self):
        """Background task to monitor price alerts - DATABASE DRIVEN"""
        from .market_data import market_service
        from app.models import get_active_price_alerts, trigger_price_alert
        
        while self.monitoring_active:
            try:
                # Get all active alerts from database
                active_alerts = get_active_price_alerts(self.db)
                
                if not active_alerts:
                    time.sleep(30)  # No alerts to check
                    continue
                
                # Check each active alert
                for alert in active_alerts:
                    try:
                        symbol = alert['symbol']
                        
                        # Get current price
                        quote = market_service.get_stock_quote(symbol)
                        if not quote or not quote.get('price'):
                            continue
                        
                        current_price = float(quote['price'])
                        self.last_prices[symbol] = current_price
                        
                        # Check alert condition
                        target_price = alert['targetPrice']
                        condition = alert['condition']
                        
                        should_trigger = False
                        if condition == 'above' and current_price >= target_price:
                            should_trigger = True
                        elif condition == 'below' and current_price <= target_price:
                            should_trigger = True
                        
                        if should_trigger:
                            # Format alert for notification
                            alert_data = {
                                'id': str(alert['_id']),
                                'user_id': str(alert['userId']),
                                'symbol': alert['symbol'],
                                'condition': alert['condition'],
                                'target_price': alert['targetPrice']
                            }
                            
                            # Send notification
                            self.send_price_alert(str(alert['userId']), alert_data, current_price)
                            
                            # Mark as triggered in database
                            trigger_price_alert(self.db, alert['_id'], current_price)
                            
                            logger.info(f"Triggered alert {alert['_id']} for {symbol} at ${current_price:.2f}")
                    
                    except Exception as e:
                        logger.error(f"Error processing alert {alert.get('_id', 'unknown')}: {e}")
                        continue
                
                # Sleep between checks (adjust based on your needs)
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in alert monitoring: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _monitor_portfolios(self):
        """Background task to monitor portfolio values and send updates"""
        while self.monitoring_active:
            try:
                # Only monitor portfolios for connected users
                connected_users = list(self.active_connections.keys())
                
                if not connected_users:
                    time.sleep(60)  # No users connected, wait longer
                    continue
                
                # Import here to avoid circular imports
                from .portfolio_service import get_portfolio_service
                portfolio_service = get_portfolio_service(self.db)
                
                for user_id in connected_users:
                    try:
                        # Skip anonymous users
                        if user_id == 'anonymous':
                            continue
                        
                        # Get current portfolio summary
                        portfolio_summary = portfolio_service.get_portfolio_summary(user_id)
                        
                        if not portfolio_summary or not portfolio_summary.get('summary'):
                            continue
                        
                        current_value = portfolio_summary['summary']['totalValue']
                        daily_change = portfolio_summary['summary']['dailyChange']
                        daily_change_percent = portfolio_summary['summary']['dailyChangePercent']
                        
                        # Check if we have a previous value to compare
                        previous_value = self.last_portfolio_values.get(user_id)
                        
                        # Determine if we should send an update
                        should_update = False
                        update_reason = None
                        
                        if previous_value is None:
                            # First time monitoring this user
                            should_update = True
                            update_reason = 'initial'
                        else:
                            # Check for significant changes
                            value_change = abs(current_value - previous_value)
                            value_change_percent = (value_change / previous_value * 100) if previous_value > 0 else 0
                            
                            # Send update if:
                            # 1. Value changed by more than 1% or $100
                            # 2. Daily change is significant (> 2%)
                            if value_change_percent >= 1.0 or value_change >= 100:
                                should_update = True
                                update_reason = 'value_change'
                            elif abs(daily_change_percent) >= 2.0:
                                should_update = True
                                update_reason = 'daily_change'
                        
                        if should_update:
                            # Prepare portfolio update data
                            update_data = {
                                'totalValue': current_value,
                                'dailyChange': daily_change,
                                'dailyChangePercent': daily_change_percent,
                                'totalGainLoss': portfolio_summary['summary']['totalGainLoss'],
                                'totalGainLossPercent': portfolio_summary['summary']['totalGainLossPercent'],
                                'holdingsCount': portfolio_summary['summary']['holdingsCount'],
                                'lastUpdated': portfolio_summary['summary']['lastUpdated'],
                                'updateReason': update_reason,
                                'previousValue': previous_value
                            }
                            
                            # Send portfolio update
                            self.send_portfolio_update(user_id, update_data)
                            
                            # Update stored value
                            self.last_portfolio_values[user_id] = current_value
                            
                            logger.info(f"Sent portfolio update to user {user_id}: ${current_value:.2f} ({update_reason})")
                    
                    except Exception as e:
                        logger.error(f"Error monitoring portfolio for user {user_id}: {e}")
                        continue
                
                # Sleep between portfolio checks (every 60 seconds)
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in portfolio monitoring: {e}")
                time.sleep(120)  # Wait longer on error
    
    def stop_monitoring(self):
        """Stop the background monitoring"""
        self.monitoring_active = False
        logger.info("Stopped notification monitoring")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get notification service statistics"""
        return {
            'active_connections': len(self.active_connections),
            'total_alerts': len(self.price_alerts),
            'active_alerts': len([a for a in self.price_alerts.values() if a['enabled'] and not a['triggered']]),
            'triggered_alerts': len([a for a in self.price_alerts.values() if a['triggered']]),
            'monitoring_active': self.monitoring_active,
            'tracked_symbols': len(self.last_prices)
        }

# WebSocket event handlers
def setup_websocket_handlers(socketio, notification_service: NotificationService):
    """Setup WebSocket event handlers"""
    
    @socketio.on('connect')
    def handle_connect(auth):
        """Handle client connection"""
        try:
            # You might want to authenticate the user here
            user_id = auth.get('user_id') if auth else 'anonymous'
            session_id = socketio.request.sid
            
            notification_service.register_user_connection(user_id, session_id)
            
            # Send welcome message
            socketio.emit('connected', {
                'message': 'Connected to Alpha Insights real-time service',
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        try:
            # Find and remove user connection
            session_id = socketio.request.sid
            user_id = None
            
            for uid, sid in notification_service.active_connections.items():
                if sid == session_id:
                    user_id = uid
                    break
            
            if user_id:
                notification_service.unregister_user_connection(user_id)
                
        except Exception as e:
            logger.error(f"Disconnection error: {e}")
    
    @socketio.on('subscribe_alerts')
    def handle_subscribe_alerts(data):
        """Handle alert subscription"""
        try:
            user_id = data.get('user_id')
            alert_config = data.get('alert_config')
            
            if user_id and alert_config:
                alert_id = notification_service.add_price_alert(user_id, alert_config)
                
                socketio.emit('alert_subscribed', {
                    'alert_id': alert_id,
                    'status': 'success',
                    'message': f"Alert created for {alert_config['symbol']}"
                })
            else:
                socketio.emit('error', {'message': 'Invalid alert subscription data'})
                
        except Exception as e:
            logger.error(f"Alert subscription error: {e}")
            socketio.emit('error', {'message': 'Failed to create alert'})
    
    @socketio.on('unsubscribe_alert')
    def handle_unsubscribe_alert(data):
        """Handle alert unsubscription"""
        try:
            user_id = data.get('user_id')
            alert_id = data.get('alert_id')
            
            if user_id and alert_id:
                success = notification_service.remove_price_alert(user_id, alert_id)
                
                if success:
                    socketio.emit('alert_unsubscribed', {
                        'alert_id': alert_id,
                        'status': 'success'
                    })
                else:
                    socketio.emit('error', {'message': 'Alert not found or unauthorized'})
            else:
                socketio.emit('error', {'message': 'Invalid unsubscribe data'})
                
        except Exception as e:
            logger.error(f"Alert unsubscription error: {e}")
            socketio.emit('error', {'message': 'Failed to remove alert'})
    
    @socketio.on('ping')
    def handle_ping():
        """Handle ping for connection health check"""
        socketio.emit('pong', {'timestamp': datetime.now().isoformat()})

# Global notification service instance (will be initialized in app.py)
notification_service = None 
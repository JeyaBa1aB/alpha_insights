// src/components/NotificationCenter.tsx
import React, { useState, useEffect, useRef } from 'react';
import GlassmorphicCard from './GlassmorphicCard';
import GradientButton from './GradientButton';
import { getWebSocketClient } from '../utils/websocket';
import { notificationsService } from '../utils/api';
import { getToken } from '../utils/auth';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlertForm, setNewAlertForm] = useState({
    symbol: '',
    condition: 'above',
    target_price: ''
  });
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const wsClient = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initializeWebSocket();
      loadAlerts();
    }

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, [isOpen]);

  const initializeWebSocket = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Get user info from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      wsClient.current = getWebSocketClient();
      await wsClient.current.connect(userId);

      wsClient.current.onConnectionStatus((status) => {
        setIsConnected(status.connected);
      });

      wsClient.current.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Alpha Insights', {
            body: notification.message || 'New notification received',
            icon: '/vite.svg'
          });
        }
      });

      wsClient.current.onPriceAlert((alert) => {
        // Handle price alert specifically
        console.log('Price alert triggered:', alert);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await notificationsService.getAlerts();
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const createAlert = async () => {
    if (!newAlertForm.symbol || !newAlertForm.target_price) return;

    try {
      const response = await notificationsService.createAlert({
        symbol: newAlertForm.symbol.toUpperCase(),
        condition: newAlertForm.condition,
        target_price: parseFloat(newAlertForm.target_price)
      });

      if (response.success) {
        setNewAlertForm({ symbol: '', condition: 'above', target_price: '' });
        setShowNewAlertForm(false);
        loadAlerts();
        
        // Subscribe to WebSocket alerts
        if (wsClient.current && wsClient.current.getConnectionStatus()) {
          const token = getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            wsClient.current.subscribeToAlert({
              user_id: payload.user_id,
              alert_config: {
                symbol: newAlertForm.symbol.toUpperCase(),
                condition: newAlertForm.condition,
                target_price: parseFloat(newAlertForm.target_price)
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await notificationsService.deleteAlert(alertId);
      if (response.success) {
        loadAlerts();
        
        // Unsubscribe from WebSocket
        if (wsClient.current && wsClient.current.getConnectionStatus()) {
          const token = getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            wsClient.current.unsubscribeFromAlert({
              user_id: payload.user_id,
              alert_id: alertId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'price_alert': return '📈';
      case 'portfolio_update': return '💼';
      case 'system': return '⚙️';
      case 'market_update': return '📊';
      default: return '🔔';
    }
  };

  const getNotificationColor = (level) => {
    switch (level) {
      case 'success': return 'text-success border-success/20 bg-success/10';
      case 'warning': return 'text-warning border-warning/20 bg-warning/10';
      case 'error': return 'text-error border-error/20 bg-error/10';
      default: return 'text-gray-300 border-slate-600/20 bg-slate-700/10';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <GlassmorphicCard className="w-full max-w-4xl h-[80vh] m-4 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Notification Center</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <GradientButton 
              variant="secondary" 
              size="sm"
              onClick={requestNotificationPermission}
            >
              Enable Browser Notifications
            </GradientButton>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          
          {/* Notifications List */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Notifications</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${getNotificationColor(notification.level)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-white text-sm leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Price Alerts Management */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Price Alerts</h3>
              <GradientButton 
                size="sm"
                onClick={() => setShowNewAlertForm(!showNewAlertForm)}
              >
                Add Alert
              </GradientButton>
            </div>

            {/* New Alert Form */}
            {showNewAlertForm && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Stock Symbol
                    </label>
                    <input
                      type="text"
                      value={newAlertForm.symbol}
                      onChange={(e) => setNewAlertForm(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="e.g., AAPL"
                      className="input-glass w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Condition
                    </label>
                    <select
                      value={newAlertForm.condition}
                      onChange={(e) => setNewAlertForm(prev => ({ ...prev, condition: e.target.value }))}
                      className="input-glass w-full"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Target Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAlertForm.target_price}
                      onChange={(e) => setNewAlertForm(prev => ({ ...prev, target_price: e.target.value }))}
                      placeholder="0.00"
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <GradientButton size="sm" onClick={createAlert}>
                      Create Alert
                    </GradientButton>
                    <GradientButton 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setShowNewAlertForm(false)}
                    >
                      Cancel
                    </GradientButton>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No price alerts set</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-4 bg-slate-800/30 rounded-lg border border-slate-600/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{alert.symbol}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.triggered 
                              ? 'bg-success/20 text-success' 
                              : alert.enabled 
                              ? 'bg-primary/20 text-primary'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {alert.triggered ? 'Triggered' : alert.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Alert when price goes {alert.condition} ${alert.target_price}
                        </p>
                        {alert.triggered && alert.triggered_at && (
                          <p className="text-xs text-success mt-1">
                            Triggered: {formatDate(alert.triggered_at)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-error hover:text-red-400 transition-colors p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default NotificationCenter; 
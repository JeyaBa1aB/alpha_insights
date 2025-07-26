import React, { useEffect, useState } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import { getWebSocketClient, Notification, PriceAlertNotification } from '../utils/websocket';
import { notificationsService } from '../utils/api';
import { getToken } from '../utils/auth';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await Promise.all([
        initializeWebSocket(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      const wsClient = getWebSocketClient();
      await wsClient.connect(userId);

      wsClient.onConnectionStatus((status: { connected: boolean }) => {
        setIsConnected(status.connected);
      });

      wsClient.onNotification((notification: Notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
      });

      wsClient.onPriceAlert((alert: PriceAlertNotification) => {
        // Add price alert to notifications
        const notification: Notification = {
          type: 'price_alert',
          message: `${alert.symbol} reached $${alert.current_price} (${alert.condition} $${alert.target_price})`,
          timestamp: alert.timestamp,
          data: alert
        };
        setNotifications(prev => [notification, ...prev.slice(0, 99)]);
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

  const clearNotifications = () => {
    setNotifications([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert': return '📈';
      case 'portfolio_update': return '💼';
      case 'system': return '⚙️';
      case 'market_update': return '📊';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string, level?: string) => {
    if (level) {
      switch (level) {
        case 'success': return 'border-l-success bg-success/5';
        case 'warning': return 'border-l-warning bg-warning/5';
        case 'error': return 'border-l-error bg-error/5';
        default: return 'border-l-primary bg-primary/5';
      }
    }
    
    switch (type) {
      case 'price_alert': return 'border-l-success bg-success/5';
      case 'portfolio_update': return 'border-l-primary bg-primary/5';
      case 'system': return 'border-l-warning bg-warning/5';
      default: return 'border-l-gray-500 bg-slate-700/5';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Notifications Center
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">
                  Manage your alerts and view real-time notifications
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`} />
                  <span className="text-sm text-gray-400">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            {notifications.length > 0 && (
              <GradientButton variant="secondary" onClick={clearNotifications}>
                Clear All
              </GradientButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Real-time Notifications */}
          <div className="lg:col-span-2">
            <GlassmorphicCard className="animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Live Notifications</h2>
                <div className="text-sm text-gray-400">
                  {notifications.length} total
                </div>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔔</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
                    <p className="text-gray-400">
                      Set up price alerts to receive real-time notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${getNotificationColor(notification.type, notification.level)} bg-slate-800/30 hover:bg-slate-700/30 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">
                              {notification.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-white text-sm leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.data && (
                            <div className="mt-2 text-xs text-gray-400">
                              <pre className="font-mono">
                                {JSON.stringify(notification.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassmorphicCard>
          </div>

          {/* Active Alerts Summary */}
          <div>
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-semibold text-white mb-4">Active Price Alerts</h3>
              
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-gray-400 text-sm">No active alerts</p>
                  </div>
                ) : (
                  alerts.filter(alert => alert.enabled && !alert.triggered).map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-white">{alert.symbol}</span>
                          <p className="text-xs text-gray-400 mt-1">
                            Alert when {alert.condition} ${alert.target_price}
                          </p>
                        </div>
                        <div className="text-xs text-primary">
                          Active
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-slate-600/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {alerts.filter(a => a.enabled && !a.triggered).length}
                    </div>
                    <div className="text-xs text-gray-400">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {alerts.filter(a => a.triggered).length}
                    </div>
                    <div className="text-xs text-gray-400">Triggered</div>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>

            {/* Connection Status */}
            <GlassmorphicCard className="mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold text-white mb-4">Connection Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">WebSocket</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
                    <span className="text-sm text-white">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Notifications</span>
                  <span className="text-sm text-white">
                    {notifications.length} received
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Update</span>
                  <span className="text-sm text-white">
                    {notifications.length > 0 
                      ? new Date(notifications[0].timestamp).toLocaleTimeString()
                      : 'None'
                    }
                  </span>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        </div>
      </div>
    </div>
  );
}

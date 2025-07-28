// src/utils/websocket.ts
// WebSocket client for real-time notifications

import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

export interface AppNotification {
  type: 'price_alert' | 'portfolio_update' | 'system' | 'market_update';
  level?: 'info' | 'warning' | 'error' | 'success';
  message?: string;
  data?: any;
  timestamp: string;
}

export interface PriceAlertNotification extends AppNotification {
  type: 'price_alert';
  alert_id: string;
  symbol: string;
  condition: 'above' | 'below';
  target_price: number;
  current_price: number;
}

export interface MarketUpdateNotification extends AppNotification {
  type: 'market_update';
  data: {
    symbol?: string;
    price?: number;
    change?: number;
    indices?: Record<string, any>;
  };
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;

  constructor(private url: string = 'http://localhost:5000') {}

  connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = getToken();
        const auth = userId ? { user_id: userId } : {};

        this.socket = io(this.url, {
          auth,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connection_status', { connected: true });
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.emit('connection_status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect after maximum attempts'));
          }
        });

        // Handle incoming notifications
        this.socket.on('notification', (notification: AppNotification) => {
          this.emit('notification', notification);
        });

        this.socket.on('market_update', (update: MarketUpdateNotification) => {
          this.emit('market_update', update);
        });

        this.socket.on('alert_subscribed', (data) => {
          this.emit('alert_subscribed', data);
        });

        this.socket.on('alert_unsubscribed', (data) => {
          this.emit('alert_unsubscribed', data);
        });

        this.socket.on('error', (error) => {
          this.emit('error', error);
        });

        this.socket.on('pong', (data) => {
          this.emit('pong', data);
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Event subscription
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emit to listeners
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Price alert management
  subscribeToAlert(alertConfig: {
    user_id: string;
    alert_config: {
      symbol: string;
      condition: 'above' | 'below';
      target_price: number;
    };
  }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_alerts', alertConfig);
    } else {
      console.warn('Cannot subscribe to alert: WebSocket not connected');
    }
  }

  unsubscribeFromAlert(data: { user_id: string; alert_id: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_alert', data);
    } else {
      console.warn('Cannot unsubscribe from alert: WebSocket not connected');
    }
  }

  // Health check
  ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Utility methods for common notification patterns
  onNotification(callback: (notification: AppNotification) => void): void {
    this.on('notification', callback);
  }

  onPriceAlert(callback: (alert: PriceAlertNotification) => void): void {
    this.on('notification', (notification: AppNotification) => {
      if (notification.type === 'price_alert') {
        callback(notification as PriceAlertNotification);
      }
    });
  }

  onMarketUpdate(callback: (update: MarketUpdateNotification) => void): void {
    this.on('market_update', callback);
  }

  onConnectionStatus(callback: (status: { connected: boolean; reason?: string }) => void): void {
    this.on('connection_status', callback);
  }

  onError(callback: (error: any) => void): void {
    this.on('error', callback);
  }
}

// Global WebSocket client instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
};

export const connectWebSocket = async (userId?: string): Promise<WebSocketClient> => {
  const client = getWebSocketClient();
  await client.connect(userId);
  return client;
};

export const disconnectWebSocket = (): void => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
};

// Utility function to create a WebSocket hook (to be used in React components)
export const createWebSocketHook = () => {
  // This will be implemented in individual React components
  // using the WebSocket client utilities above
  return {
    getWebSocketClient,
    connectWebSocket,
    disconnectWebSocket
  };
}; 
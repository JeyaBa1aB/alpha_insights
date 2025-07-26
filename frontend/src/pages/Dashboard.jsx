// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import Chart from '../components/Chart';
import NotificationCenter from '../components/NotificationCenter';
import { marketDataService } from '../utils/api';
import { getWebSocketClient } from '../utils/websocket';
import { getToken } from '../utils/auth';

const Dashboard = () => {
  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Mock data for demonstration (will be replaced with real portfolio data)
  const portfolioValue = 125847.32;
  const dailyChange = 2847.12;
  const dailyChangePercent = 2.31;
  const totalGainLoss = 18943.21;
  const totalGainLossPercent = 17.68;

  const chartData = [
    { date: 'Jan', value: 95000 },
    { date: 'Feb', value: 102000 },
    { date: 'Mar', value: 98000 },
    { date: 'Apr', value: 108000 },
    { date: 'May', value: 115000 },
    { date: 'Jun', value: 125847 },
  ];

  const topHoldings = [
    { symbol: 'AAPL', name: 'Apple Inc.', value: 25640.50, change: 2.1, shares: 150 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', value: 18920.75, change: -0.8, shares: 80 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 15670.25, change: 1.5, shares: 45 },
    { symbol: 'TSLA', name: 'Tesla Inc.', value: 12450.80, change: 3.2, shares: 60 },
  ];

  const recentActivities = [
    { type: 'buy', symbol: 'AAPL', shares: 10, price: 175.50, date: '2025-01-25' },
    { type: 'sell', symbol: 'NVDA', shares: 5, price: 890.25, date: '2025-01-24' },
    { type: 'buy', symbol: 'MSFT', shares: 15, price: 415.80, date: '2025-01-23' },
  ];

  // WebSocket and data loading effects
  useEffect(() => {
    initializeWebSocket();
    loadMarketData();
  }, []);

  const initializeWebSocket = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Get user info from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      const wsClient = getWebSocketClient();
      await wsClient.connect(userId);

      wsClient.onConnectionStatus((status) => {
        setIsConnected(status.connected);
      });

      wsClient.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
      });

      wsClient.onMarketUpdate((update) => {
        // Update market data when received
        setMarketData(prev => ({ ...prev, ...update.data }));
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await marketDataService.getMarketStatus();
      if (response.success && response.data) {
        setMarketData(response.data);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Portfolio Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">
                  Track your investments and monitor market performance
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`} />
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative glass-card hover:glass-card-hover p-3 rounded-lg transition-all"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{notifications.length}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Portfolio Value */}
          <GlassmorphicCard hover className="animate-slide-up">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Portfolio Value</h3>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                ${portfolioValue.toLocaleString()}
              </p>
              <div className={`flex items-center justify-center gap-1 text-sm ${
                dailyChange >= 0 ? 'text-success' : 'text-error'
              }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={dailyChange >= 0 
                    ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  } clipRule="evenodd" />
                </svg>
                ${Math.abs(dailyChange).toLocaleString()} ({dailyChangePercent}%) today
              </div>
            </div>
          </GlassmorphicCard>

          {/* Total Gain/Loss */}
          <GlassmorphicCard hover className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Gain/Loss</h3>
              <p className={`text-2xl sm:text-3xl font-bold mb-1 ${
                totalGainLoss >= 0 ? 'text-success' : 'text-error'
              }`}>
                ${totalGainLoss.toLocaleString()}
              </p>
              <p className={`text-sm ${totalGainLoss >= 0 ? 'text-success' : 'text-error'}`}>
                +{totalGainLossPercent}% all time
              </p>
            </div>
          </GlassmorphicCard>

          {/* Number of Holdings */}
          <GlassmorphicCard hover className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Holdings</h3>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">12</p>
              <p className="text-sm text-gray-400">Active positions</p>
            </div>
          </GlassmorphicCard>

          {/* Cash Balance */}
          <GlassmorphicCard hover className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Cash Balance</h3>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">$8,245</p>
              <p className="text-sm text-gray-400">Available to invest</p>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2">
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-primary/20 text-primary rounded-lg">6M</button>
                  <button className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">1Y</button>
                  <button className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">ALL</button>
                </div>
              </div>
              <div className="h-64">
                <Chart data={chartData} />
              </div>
            </GlassmorphicCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            
            {/* Action Buttons */}
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GradientButton className="w-full" size="md">
                  Add Investment
                </GradientButton>
                <GradientButton variant="secondary" className="w-full" size="md">
                  Research Stocks
                </GradientButton>
                <GradientButton variant="secondary" className="w-full" size="md">
                  View Analytics
                </GradientButton>
              </div>
            </GlassmorphicCard>

            {/* Market Status */}
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">S&P 500</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">4,789.52</span>
                    <span className="text-success text-sm">+0.8%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">NASDAQ</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">15,432.10</span>
                    <span className="text-success text-sm">+1.2%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">DOW</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">38,654.32</span>
                    <span className="text-error text-sm">-0.3%</span>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        </div>

        {/* Holdings and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Top Holdings */}
          <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-xl font-semibold text-white mb-6">Top Holdings</h3>
            <div className="space-y-4">
              {topHoldings.map((holding, index) => (
                <div key={holding.symbol} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{holding.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{holding.symbol}</p>
                      <p className="text-gray-400 text-sm">{holding.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${holding.value.toLocaleString()}</p>
                    <p className={`text-sm ${holding.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassmorphicCard>

          {/* Recent Activity */}
          <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'buy' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={activity.type === 'buy'
                          ? "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          : "M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                        } clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {activity.type.toUpperCase()} {activity.shares} {activity.symbol}
                      </p>
                      <p className="text-gray-400 text-sm">
                        ${activity.price} per share
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white">${(activity.shares * activity.price).toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassmorphicCard>
        </div>

        {/* Recent Notifications Banner */}
        {notifications.length > 0 && (
          <div className="mt-8">
            <GlassmorphicCard className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="text-primary hover:text-secondary transition-colors text-sm"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-lg">
                      {notification.type === 'price_alert' ? '📈' : 
                       notification.type === 'portfolio_update' ? '💼' : '🔔'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphicCard>
          </div>
        )}
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Dashboard;

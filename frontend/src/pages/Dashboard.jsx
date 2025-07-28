// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import Chart from '../components/Chart';
import NotificationCenter from '../components/NotificationCenter';
import AIChatWidget from '../components/AIChatWidget';
import { marketDataService, portfolioService, transactionService } from '../utils/api';
import { getWebSocketClient } from '../utils/websocket';
import { getToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Check authentication on component mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.log('No authentication token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.log('Token expired, redirecting to login');
        navigate('/login');
        return;
      }
    } catch (error) {
      console.log('Invalid token, redirecting to login');
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Enhanced State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6M');
  const [aiInsights, setAiInsights] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    portfolioValue: 0,
    dailyChange: 0,
    totalGainLoss: 0
  });

  // Enhanced portfolio data with real-time updates
  const [portfolioValue, setPortfolioValue] = useState(125847.32);
  const [dailyChange, setDailyChange] = useState(2847.12);
  const [dailyChangePercent, setDailyChangePercent] = useState(2.31);
  const [totalGainLoss, setTotalGainLoss] = useState(18943.21);
  const [totalGainLossPercent, setTotalGainLossPercent] = useState(17.68);

  // Refs for animations
  const portfolioValueRef = useRef(null);
  const wsClient = useRef(null);

  // Database-driven state
  const [chartData, setChartData] = useState([]);
  const [topHoldings, setTopHoldings] = useState([
    { symbol: 'AAPL', name: 'Apple Inc.', value: 25847, change: 2.3, shares: 150 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', value: 18932, change: -0.8, shares: 75 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 15643, change: 1.7, shares: 45 },
    { symbol: 'TSLA', name: 'Tesla Inc.', value: 12456, change: 4.2, shares: 60 }
  ]);
  const [recentActivities, setRecentActivities] = useState([
    { type: 'buy', symbol: 'NVDA', shares: 25, price: 875.50, date: '2024-01-15' },
    { type: 'sell', symbol: 'META', shares: 10, price: 485.20, date: '2024-01-14' },
    { type: 'buy', symbol: 'AMZN', shares: 15, price: 155.75, date: '2024-01-13' }
  ]);
  const [error, setError] = useState(null);

  // Enhanced effects for data loading and animations
  useEffect(() => {
    initializeWebSocket();
    loadMarketData();
    loadPortfolioData();
    loadHoldingsData();
    loadActivityData();
    loadAiInsights();
    loadRiskMetrics();
  }, []);

  // Animated counter effect
  useEffect(() => {
    animateValue('portfolioValue', portfolioValue);
    animateValue('dailyChange', Math.abs(dailyChange));
    animateValue('totalGainLoss', Math.abs(totalGainLoss));
  }, [portfolioValue, dailyChange, totalGainLoss]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        loadMarketData();
        loadPortfolioData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

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

  // Enhanced data loading functions
  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await portfolioService.getPortfolioSummary();
      if (response.success && response.data) {
        setPortfolioData(response.data);
        // Update portfolio values with real data
        setPortfolioValue(response.data.totalValue || portfolioValue);
        setDailyChange(response.data.dailyChange || dailyChange);
        setDailyChangePercent(response.data.dailyChangePercent || dailyChangePercent);
        setTotalGainLoss(response.data.totalGainLoss || totalGainLoss);
        setTotalGainLossPercent(response.data.totalGainLossPercent || totalGainLossPercent);
      } else {
        // If API fails, use mock data for demo purposes
        console.warn('Portfolio API failed, using mock data:', response.error);
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      // Continue with mock data for demo purposes
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async () => {
    try {
      // Mock AI insights for now - will be replaced with real AI service
      const mockInsights = [
        {
          type: 'recommendation',
          title: 'Portfolio Diversification',
          message: 'Consider adding more international exposure to reduce risk',
          confidence: 85,
          action: 'View Suggestions'
        },
        {
          type: 'alert',
          title: 'Market Opportunity',
          message: 'Tech stocks showing strong momentum - NVDA up 15% this week',
          confidence: 92,
          action: 'Research Stocks'
        },
        {
          type: 'warning',
          title: 'Risk Assessment',
          message: 'Your portfolio concentration in tech is above recommended levels',
          confidence: 78,
          action: 'Rebalance'
        }
      ];
      setAiInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  };

  // New database-driven data loading functions
  const loadHoldingsData = async () => {
    try {
      const response = await portfolioService.getHoldings();
      if (response.success && response.data) {
        // Format holdings data for display
        const formattedHoldings = response.data.slice(0, 4).map(holding => ({
          symbol: holding.symbol,
          name: holding.name || holding.symbol,
          value: holding.totalValue || 0,
          change: holding.dayChange || 0,
          shares: holding.shares || 0
        }));
        setTopHoldings(formattedHoldings);

        // Update chart data from portfolio performance
        if (portfolioData?.performance) {
          setChartData(portfolioData.performance.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
            value: item.value
          })));
        }
      } else {
        console.warn('Holdings API failed:', response.error);
        setError('Failed to load holdings data');
      }
    } catch (error) {
      console.error('Failed to load holdings data:', error);
      setError('Failed to load holdings data');
    }
  };

  const loadActivityData = async () => {
    try {
      const response = await portfolioService.getActivity();
      if (response.success && response.data) {
        // Format activity data for display
        const formattedActivities = response.data.slice(0, 3).map(activity => ({
          type: activity.type,
          symbol: activity.symbol,
          shares: activity.shares,
          price: activity.price,
          date: new Date(activity.date).toLocaleDateString()
        }));
        setRecentActivities(formattedActivities);
      } else {
        console.warn('Activity API failed:', response.error);
        // Keep empty array for now
      }
    } catch (error) {
      console.error('Failed to load activity data:', error);
    }
  };

  const loadRiskMetrics = async () => {
    try {
      const response = await portfolioService.getRiskMetrics();
      if (response.success && response.data) {
        setRiskMetrics(response.data);
      } else {
        // Fallback to mock data if API fails
        const mockRiskMetrics = {
          riskScore: 6.8,
          volatility: 18.5,
          sharpeRatio: 1.24,
          beta: 1.15,
          diversificationScore: 7.2,
          recommendations: [
            'Consider reducing tech sector exposure',
            'Add defensive stocks for stability',
            'International diversification recommended'
          ]
        };
        setRiskMetrics(mockRiskMetrics);
      }
    } catch (error) {
      console.error('Failed to load risk metrics:', error);
    }
  };

  // Animated counter function
  const animateValue = (key, endValue) => {
    const startValue = animatedValues[key];
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      setAnimatedValues(prev => ({
        ...prev,
        [key]: currentValue
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Handle timeframe changes for charts
  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    // Load new chart data based on timeframe
    // This would typically make an API call
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
              {/* AI Insights Toggle */}
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`glass-card hover:glass-card-hover p-3 rounded-lg transition-all ${showAiPanel ? 'bg-primary/20 border-primary/50' : ''
                  }`}
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {aiInsights.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{aiInsights.length}</span>
                  </div>
                )}
              </button>

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

        {/* Enhanced Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Total Portfolio Value */}
          <GlassmorphicCard hover className="animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-10 -mt-10" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-400">Total Portfolio Value</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2" ref={portfolioValueRef}>
                ${loading ? '---,---' : animatedValues.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className={`flex items-center justify-center gap-1 text-sm transition-colors duration-300 ${dailyChange >= 0 ? 'text-success' : 'text-error'
                }`}>
                <svg className={`w-4 h-4 transition-transform duration-300 ${dailyChange >= 0 ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  ${animatedValues.dailyChange.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Today's change</p>
            </div>
          </GlassmorphicCard>

          {/* Total Gain/Loss */}
          <GlassmorphicCard hover className="animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 ${totalGainLoss >= 0 ? 'bg-gradient-to-br from-success/20 to-transparent' : 'bg-gradient-to-br from-error/20 to-transparent'
              }`} />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalGainLoss >= 0 ? 'bg-gradient-to-r from-success to-green-600' : 'bg-gradient-to-r from-error to-red-600'
                  }`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-400">Total Gain/Loss</h3>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${totalGainLoss >= 0 ? 'text-success' : 'text-error'
                }`}>
                {totalGainLoss >= 0 ? '+' : ''}${animatedValues.totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-success' : 'text-error'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent}% all time
              </div>
              <p className="text-xs text-gray-500 mt-1">Since inception</p>
            </div>
          </GlassmorphicCard>

          {/* Number of Holdings */}
          <GlassmorphicCard hover className="animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-10 -mt-10" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-400">Holdings</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {portfolioData?.holdings?.length || 12}
              </p>
              <div className="text-sm text-gray-400">Active positions</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">All tracking</span>
              </div>
            </div>
          </GlassmorphicCard>

          {/* Cash Balance */}
          <GlassmorphicCard hover className="animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.3s' }}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-10 -mt-10" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-400">Cash Balance</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                ${portfolioData?.cashBalance?.toLocaleString() || '8,245'}
              </p>
              <div className="text-sm text-gray-400">Available to invest</div>
              <div className="mt-2">
                <GradientButton size="xs" className="text-xs px-3 py-1">
                  Add Funds
                </GradientButton>
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2">
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
                  <p className="text-sm text-gray-400 mt-1">Track your investment growth over time</p>
                </div>
                <div className="flex gap-2">
                  {['1M', '3M', '6M', '1Y', 'ALL'].map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => handleTimeframeChange(timeframe)}
                      className={`px-3 py-1 text-xs rounded-lg transition-all ${selectedTimeframe === timeframe
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <Chart 
                  data={chartData} 
                  timeframe={selectedTimeframe}
                  height={320}
                  showArea={true}
                  animated={true}
                  color="#6366f1"
                />
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'buy' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
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

        {/* AI Insights Panel */}
        {showAiPanel && (
          <div className="mt-8">
            <GlassmorphicCard className="animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">AI Insights</h3>
                    <p className="text-sm text-gray-400">Personalized recommendations for your portfolio</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${insight.type === 'recommendation' ? 'border-l-blue-500 bg-blue-500/10' :
                      insight.type === 'alert' ? 'border-l-green-500 bg-green-500/10' :
                        'border-l-yellow-500 bg-yellow-500/10'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${insight.type === 'recommendation' ? 'bg-blue-500 text-white' :
                          insight.type === 'alert' ? 'bg-green-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                          {insight.type === 'recommendation' ? '💡' :
                            insight.type === 'alert' ? '🚀' : '⚠️'}
                        </div>
                        <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${insight.confidence >= 90 ? 'bg-green-500' :
                          insight.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        <span className="text-xs text-gray-400">{insight.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">{insight.message}</p>
                    <GradientButton size="sm" variant="secondary" className="w-full">
                      {insight.action}
                    </GradientButton>
                  </div>
                ))}
              </div>
            </GlassmorphicCard>
          </div>
        )}

        {/* Risk Metrics & Analytics */}
        {riskMetrics && (
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Risk Score Dashboard */}
              <GlassmorphicCard className="animate-slide-up">
                <h3 className="text-xl font-semibold text-white mb-6">Portfolio Risk Analysis</h3>

                {/* Risk Score Gauge */}
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="rgb(51 65 85)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={riskMetrics.riskScore <= 3 ? '#10b981' :
                          riskMetrics.riskScore <= 7 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeDasharray={`${(riskMetrics.riskScore / 10) * 314} 314`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{riskMetrics.riskScore}</div>
                        <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${riskMetrics.riskScore <= 3 ? 'text-green-400' :
                    riskMetrics.riskScore <= 7 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                    {riskMetrics.riskScore <= 3 ? 'Conservative' :
                      riskMetrics.riskScore <= 7 ? 'Moderate' : 'Aggressive'} Risk Profile
                  </p>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volatility</span>
                    <span className="text-white font-medium">{riskMetrics.volatility}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sharpe Ratio</span>
                    <span className="text-white font-medium">{riskMetrics.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Beta</span>
                    <span className="text-white font-medium">{riskMetrics.beta}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Diversification Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{riskMetrics.diversificationScore}/10</span>
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-1000"
                          style={{ width: `${(riskMetrics.diversificationScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </GlassmorphicCard>

              {/* Risk Recommendations */}
              <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-semibold text-white mb-6">Risk Management Recommendations</h3>

                <div className="space-y-4">
                  {riskMetrics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm leading-relaxed">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-600/50">
                  <GradientButton className="w-full" size="md">
                    Get Detailed Risk Report
                  </GradientButton>
                </div>
              </GlassmorphicCard>
            </div>
          </div>
        )}

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

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
};

export default Dashboard;

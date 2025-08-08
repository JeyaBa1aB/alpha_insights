// src/pages/StockResearchPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import Chart from '../components/Chart';
import { marketDataService } from '../utils/api';

const StockResearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New features state
  const [compareStocks, setCompareStocks] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bestStockRecommendation, setBestStockRecommendation] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [watchlist, setWatchlist] = useState([]);

  // Popular stocks for quick access
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  // Mock stock recommendations data
  const stockRecommendations = [
    { symbol: 'AAPL', score: 95, reason: 'Strong earnings growth and innovation pipeline', price: 175.50, change: 2.3 },
    { symbol: 'NVDA', score: 92, reason: 'AI market leadership and data center growth', price: 603.80, change: 5.2 },
    { symbol: 'MSFT', score: 89, reason: 'Cloud computing dominance and AI integration', price: 415.80, change: 1.8 },
    { symbol: 'GOOGL', score: 87, reason: 'Search monopoly and AI advancements', price: 132.55, change: -0.5 },
    { symbol: 'AMZN', score: 85, reason: 'E-commerce recovery and AWS growth', price: 145.30, change: 3.1 }
  ];

  // Generate best stock recommendation every 30 seconds
  useEffect(() => {
    const generateRecommendation = () => {
      const randomStock = stockRecommendations[Math.floor(Math.random() * stockRecommendations.length)];
      setBestStockRecommendation(randomStock);
      
      // Add notification
      const notification = {
        id: Date.now(),
        type: 'recommendation',
        title: `🚀 Best Stock Alert`,
        message: `${randomStock.symbol} is trending up! Score: ${randomStock.score}/100`,
        stock: randomStock,
        timestamp: new Date(),
        autoHide: true
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    };

    // Generate initial recommendation
    generateRecommendation();
    
    // Set interval for new recommendations
    const interval = setInterval(generateRecommendation, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-hide notifications after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => !n.autoHide || Date.now() - n.timestamp.getTime() < 10000));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [notifications]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setError('');
    
    try {
      const response = await marketDataService.searchStocks(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        // Mock search results
        const mockResults = [
          { symbol: searchQuery.toUpperCase(), name: `${searchQuery.toUpperCase()} Inc.`, type: 'Stock' },
          { symbol: `${searchQuery.toUpperCase()}2`, name: `${searchQuery.toUpperCase()} Corp.`, type: 'Stock' }
        ];
        setSearchResults(mockResults);
      }
    } catch (err) {
      setError('Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStockSelect = async (symbol) => {
    setLoading(true);
    setError('');
    
    try {
      // Mock stock data
      const mockStock = {
        symbol: symbol,
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 20,
        change_percent: (Math.random() - 0.5) * 10,
        high: Math.random() * 500 + 60,
        low: Math.random() * 500 + 40,
        open: Math.random() * 500 + 45,
        previous_close: Math.random() * 500 + 48,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        market_cap: Math.floor(Math.random() * 1000000000000) + 100000000000,
        pe_ratio: Math.random() * 30 + 10,
        dividend_yield: Math.random() * 5
      };
      
      setSelectedStock(mockStock);
      
      // Generate mock historical data
      const chartData = [];
      let basePrice = mockStock.price;
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        basePrice += (Math.random() - 0.5) * 10;
        chartData.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(10, basePrice)
        });
      }
      setHistoricalData(chartData);
      
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToComparison = (stock) => {
    if (compareStocks.length < 4 && !compareStocks.find(s => s.symbol === stock.symbol)) {
      setCompareStocks(prev => [...prev, stock]);
      
      // Add notification
      const notification = {
        id: Date.now(),
        type: 'success',
        title: '✅ Added to Comparison',
        message: `${stock.symbol} added to comparison list`,
        timestamp: new Date(),
        autoHide: true
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }
  };

  const handleRemoveFromComparison = (symbol) => {
    setCompareStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const handleBuyStock = (stock) => {
    setBestStockRecommendation(stock);
    setShowBuyModal(true);
  };

  const handleConfirmBuy = () => {
    const notification = {
      id: Date.now(),
      type: 'success',
      title: '🎉 Order Placed',
      message: `Successfully placed order for ${buyQuantity} shares of ${bestStockRecommendation.symbol}`,
      timestamp: new Date(),
      autoHide: true
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    setShowBuyModal(false);
    setBuyQuantity(1);
  };

  const handleAddToWatchlist = (stock) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, stock]);
      
      const notification = {
        id: Date.now(),
        type: 'info',
        title: '👁️ Added to Watchlist',
        message: `${stock.symbol} added to your watchlist`,
        timestamp: new Date(),
        autoHide: true
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatPercent = (percent) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const formatLargeNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Stock Research
              </h1>
              <p className="text-gray-400">
                Research stocks, compare performance, and discover investment opportunities
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showComparison 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Compare ({compareStocks.length})
              </button>
              <button
                className="px-4 py-2 bg-slate-700 text-gray-300 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Watchlist ({watchlist.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <GlassmorphicCard className="animate-slide-up">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search stocks by symbol or company name..."
                  className="input-glass w-full text-lg"
                />
              </div>
              <GradientButton
                onClick={handleSearch}
                loading={searchLoading}
                disabled={!searchQuery.trim()}
                size="lg"
              >
                Search
              </GradientButton>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Stock Comparison Panel */}
        {showComparison && compareStocks.length > 0 && (
          <div className="mb-8">
            <GlassmorphicCard className="animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Stock Comparison</h3>
                <button
                  onClick={() => setCompareStocks([])}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 text-gray-300">Symbol</th>
                      <th className="text-left py-3 text-gray-300">Price</th>
                      <th className="text-left py-3 text-gray-300">Change</th>
                      <th className="text-left py-3 text-gray-300">Market Cap</th>
                      <th className="text-left py-3 text-gray-300">P/E Ratio</th>
                      <th className="text-left py-3 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareStocks.map((stock, index) => (
                      <tr key={stock.symbol} className="border-b border-slate-800">
                        <td className="py-4 text-white font-medium">{stock.symbol}</td>
                        <td className="py-4 text-white">{formatPrice(stock.price)}</td>
                        <td className={`py-4 ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatChange(stock.change)} ({formatPercent(stock.change_percent)})
                        </td>
                        <td className="py-4 text-white">{formatLargeNumber(stock.market_cap)}</td>
                        <td className="py-4 text-white">{stock.pe_ratio?.toFixed(2) || 'N/A'}</td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBuyStock(stock)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => handleRemoveFromComparison(stock.symbol)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassmorphicCard>
          </div>
        )}

        {/* Popular Stocks */}
        <div className="mb-8">
          <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Popular Stocks</h3>
            <div className="flex flex-wrap gap-2">
              {popularStocks.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => handleStockSelect(symbol)}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </GlassmorphicCard>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleStockSelect(result.symbol)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-white font-medium">{result.symbol}</p>
                      <p className="text-gray-400 text-sm">{result.name}</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.type}
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphicCard>
          </div>
        )}

        {/* Selected Stock Details */}
        {selectedStock && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stock Info */}
            <div className="lg:col-span-1">
              <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedStock.symbol}
                  </h2>
                  <p className="text-3xl font-bold text-white mb-2">
                    {formatPrice(selectedStock.price)}
                  </p>
                  {selectedStock.change !== undefined && (
                    <div className={`flex items-center justify-center gap-2 ${
                      selectedStock.change >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={selectedStock.change >= 0 
                          ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        } clipRule="evenodd" />
                      </svg>
                      <span>
                        {formatChange(selectedStock.change)}
                        {selectedStock.change_percent && ` (${formatPercent(selectedStock.change_percent)})`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="space-y-4">
                  {selectedStock.high && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Day High</span>
                      <span className="text-white">{formatPrice(selectedStock.high)}</span>
                    </div>
                  )}
                  {selectedStock.low && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Day Low</span>
                      <span className="text-white">{formatPrice(selectedStock.low)}</span>
                    </div>
                  )}
                  {selectedStock.market_cap && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Cap</span>
                      <span className="text-white">{formatLargeNumber(selectedStock.market_cap)}</span>
                    </div>
                  )}
                  {selectedStock.pe_ratio && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">P/E Ratio</span>
                      <span className="text-white">{selectedStock.pe_ratio.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedStock.volume && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volume</span>
                      <span className="text-white">{selectedStock.volume.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <GradientButton 
                    className="w-full"
                    onClick={() => handleBuyStock(selectedStock)}
                  >
                    Buy Stock
                  </GradientButton>
                  <div className="grid grid-cols-2 gap-2">
                    <GradientButton 
                      variant="secondary" 
                      className="w-full text-sm"
                      onClick={() => handleAddToComparison(selectedStock)}
                    >
                      Compare
                    </GradientButton>
                    <GradientButton 
                      variant="secondary" 
                      className="w-full text-sm"
                      onClick={() => handleAddToWatchlist(selectedStock)}
                    >
                      Watch
                    </GradientButton>
                  </div>
                  <GradientButton variant="secondary" className="w-full">
                    Set Price Alert
                  </GradientButton>
                </div>
              </GlassmorphicCard>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2">
              <GlassmorphicCard className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">30-Day Price Chart</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs bg-primary/20 text-primary rounded-lg">30D</button>
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">90D</button>
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">1Y</button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : historicalData.length > 0 ? (
                  <div className="h-64">
                    <Chart data={historicalData} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No historical data available
                  </div>
                )}
              </GlassmorphicCard>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedStock && searchResults.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center opacity-50">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Your Research</h3>
            <p className="text-gray-400 mb-6">
              Search for stocks or click on popular stocks to begin your analysis
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading stock data...</p>
          </div>
        )}
      </div>

      {/* Popup Notifications */}
      <div className="fixed bottom-4 left-4 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border backdrop-blur-sm animate-slide-up ${
              notification.type === 'success' 
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : notification.type === 'recommendation'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : notification.type === 'info'
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/90 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
                {notification.stock && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleBuyStock(notification.stock)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={() => handleStockSelect(notification.stock.symbol)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="ml-3 text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Buy Stock Modal */}
      {showBuyModal && bestStockRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Buy {bestStockRecommendation.symbol}
            </h2>
            
            <div className="space-y-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatPrice(bestStockRecommendation.price)}
                </div>
                <div className={`text-sm ${bestStockRecommendation.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatChange(bestStockRecommendation.change)} today
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-white font-medium">
                    {formatPrice(bestStockRecommendation.price * buyQuantity)}
                  </span>
                </div>
              </div>

              {bestStockRecommendation.reason && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    💡 {bestStockRecommendation.reason}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmBuy}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Purchase
              </button>
              <button
                onClick={() => setShowBuyModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockResearchPage;
// src/pages/StockResearchPage.jsx
import React, { useState, useEffect } from 'react';
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

  // Popular stocks for quick access
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setError('');
    
    try {
      const response = await marketDataService.searchStocks(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setError(response.error || 'Search failed');
        setSearchResults([]);
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
      // Get stock quote
      const quoteResponse = await marketDataService.getQuote(symbol);
      if (quoteResponse.success && quoteResponse.data) {
        setSelectedStock(quoteResponse.data);
        
        // Get historical data
        const historicalResponse = await marketDataService.getHistoricalData(symbol, 30);
        if (historicalResponse.success && historicalResponse.data) {
          // Transform data for chart
          const chartData = historicalResponse.data.map(item => ({
            date: item.date,
            value: item.close
          }));
          setHistoricalData(chartData);
        }
      } else {
        setError(quoteResponse.error || 'Failed to fetch stock data');
      }
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Stock Research
          </h1>
          <p className="text-gray-400">
            Research stocks, analyze performance, and discover investment opportunities
          </p>
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
                  {selectedStock.open && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Open</span>
                      <span className="text-white">{formatPrice(selectedStock.open)}</span>
                    </div>
                  )}
                  {selectedStock.previous_close && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Previous Close</span>
                      <span className="text-white">{formatPrice(selectedStock.previous_close)}</span>
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
                  <GradientButton className="w-full">
                    Add to Portfolio
                  </GradientButton>
                  <GradientButton variant="secondary" className="w-full">
                    Set Price Alert
                  </GradientButton>
                  <GradientButton variant="secondary" className="w-full">
                    View Company Info
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
    </div>
  );
};

export default StockResearchPage;

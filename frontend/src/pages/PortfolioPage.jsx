// src/pages/PortfolioPage.jsx
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import { portfolioService, transactionService, marketDataService } from '../utils/api';

const PortfolioPage = () => {
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'buy',
    shares: '',
    price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load holdings and activity in parallel
      const [holdingsResponse, activityResponse] = await Promise.all([
        portfolioService.getHoldings(),
        portfolioService.getActivity()
      ]);

      if (holdingsResponse.success) {
        setHoldings(holdingsResponse.data);
      } else {
        console.error('Failed to load holdings:', holdingsResponse.error);
      }

      if (activityResponse.success) {
        setTransactions(activityResponse.data);
      } else {
        console.error('Failed to load activity:', activityResponse.error);
      }

    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.shares || !formData.price) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const transactionData = {
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        shares: parseFloat(formData.shares),
        price: parseFloat(formData.price)
      };

      const response = await transactionService.createTransaction(transactionData);

      if (response.success) {
        // Reset form
        setFormData({
          symbol: '',
          type: 'buy',
          shares: '',
          price: ''
        });
        setShowAddForm(false);
        
        // Reload portfolio data
        await loadPortfolioData();
        
        // Show success message (you could add a toast notification here)
        console.log('Transaction created successfully');
      } else {
        setError(response.error || 'Failed to create transaction');
      }

    } catch (error) {
      console.error('Failed to create transaction:', error);
      setError('Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await transactionService.deleteTransaction(transactionId);
      
      if (response.success) {
        // Reload portfolio data
        await loadPortfolioData();
        console.log('Transaction deleted successfully');
      } else {
        setError(response.error || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Portfolio Management
              </h1>
              <p className="text-gray-400">
                Manage your holdings and track transactions
              </p>
            </div>
            <GradientButton 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </GradientButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="mb-8">
            <GlassmorphicCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add New Transaction</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g., AAPL"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Shares
                  </label>
                  <input
                    type="number"
                    name="shares"
                    value={formData.shares}
                    onChange={handleInputChange}
                    placeholder="100"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price per Share
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="150.00"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-4 flex gap-3">
                  <GradientButton 
                    type="submit" 
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add Transaction
                      </>
                    )}
                  </GradientButton>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </GlassmorphicCard>
          </div>
        )}

        {/* Portfolio Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Current Holdings */}
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold text-white mb-6">Current Holdings</h3>
            {holdings.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-400 mb-4">No holdings yet</p>
                <GradientButton onClick={() => setShowAddForm(true)} size="sm">
                  Add Your First Transaction
                </GradientButton>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding, index) => (
                  <div key={holding.id || index} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{holding.symbol}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{holding.symbol}</p>
                        <p className="text-gray-400 text-sm">{holding.shares} shares</p>
                        <p className="text-gray-400 text-xs">Avg: ${holding.avgCost?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${holding.totalValue?.toLocaleString() || '0'}</p>
                      <p className={`text-sm ${(holding.unrealizedGain || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                        {(holding.unrealizedGain || 0) >= 0 ? '+' : ''}${(holding.unrealizedGain || 0).toFixed(2)}
                      </p>
                      <p className={`text-xs ${(holding.unrealizedGainPercent || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                        {(holding.unrealizedGainPercent || 0) >= 0 ? '+' : ''}{(holding.unrealizedGainPercent || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassmorphicCard>

          {/* Transaction History */}
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold text-white mb-6">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'buy' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                      }`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d={transaction.type === 'buy'
                            ? "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            : "M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                          } clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {transaction.type.toUpperCase()} {transaction.shares} {transaction.symbol}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ${transaction.price} per share
                        </p>
                        <p className="text-gray-400 text-xs">
                          {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-medium">
                          ${transaction.totalValue?.toLocaleString() || (transaction.shares * transaction.price).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        title="Delete transaction"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
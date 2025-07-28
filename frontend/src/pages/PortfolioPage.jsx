// src/pages/PortfolioPage.jsx
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';

import PortfolioSummaryCards from '../components/portfolio/PortfolioSummaryCards';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import TransactionHistory from '../components/portfolio/TransactionHistory';
import SectorAllocationChart from '../components/analytics/SectorAllocationChart';
import PerformanceChart from '../components/analytics/PerformanceChart';
import RiskMetricsCard from '../components/analytics/RiskMetricsCard';
import AIRecommendations from '../components/ai/AIRecommendations';
import AlertManager from '../components/alerts/AlertManager';
import OrderForm from '../components/orders/OrderForm';
import { portfolioService, transactionService } from '../utils/api';
import { useSimulatedRealTimeData } from '../hooks/useRealTimeData';

const PortfolioPage = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedOrder, setShowAdvancedOrder] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'buy',
    shares: '',
    price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Get symbols for real-time data
  const symbols = holdings.map(h => h.symbol);
  const realTimeData = useSimulatedRealTimeData(symbols);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load comprehensive portfolio data
      const [summaryResponse, transactionsResponse] = await Promise.all([
        portfolioService.getPortfolioSummary(),
        portfolioService.getActivity()
      ]);

      if (summaryResponse.success) {
        setPortfolioData(summaryResponse.data);
        setHoldings(summaryResponse.data.holdings || []);
      } else {
        console.error('Failed to load portfolio summary:', summaryResponse.error);
        setError('Failed to load portfolio data');
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
      } else {
        console.error('Failed to load transactions:', transactionsResponse.error);
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
        setShowAddModal(false);

        // Reload portfolio data to reflect changes
        await loadPortfolioData();

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
        // Reload portfolio data to reflect changes
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0) >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
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
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Interactive Particle Background */}
      <InteractiveParticles />
      
      <div className="max-w-7xl mx-auto relative z-10">

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
              onClick={() => setShowAddModal(true)}
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

        {/* Enhanced Portfolio Summary Cards */}
        <PortfolioSummaryCards portfolioData={portfolioData} realTimeData={realTimeData} />

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'ai-insights', label: 'AI Insights', icon: '🤖' },
              { id: 'alerts', label: 'Alerts', icon: '🔔' },
              { id: 'orders', label: 'Orders', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add New Transaction</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
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
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary"
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
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
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
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <GradientButton
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2"
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
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Holdings Table */}
            <HoldingsTable 
              holdings={holdings} 
              realTimeData={realTimeData}
              onAdvancedOrder={(symbol) => {
                setSelectedSymbol(symbol || '');
                setShowAdvancedOrder(true);
              }}
            />

            {/* Enhanced Transaction History */}
            <TransactionHistory 
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <SectorAllocationChart holdings={holdings} />
              <RiskMetricsCard portfolioData={portfolioData} />
            </div>
            <PerformanceChart portfolioData={portfolioData} />
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="space-y-8">
            <AIRecommendations portfolioData={portfolioData} />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <AlertManager holdings={holdings} />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <GlassmorphicCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Advanced Order Management</h3>
                <GradientButton 
                  onClick={() => setShowAdvancedOrder(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Order
                </GradientButton>
              </div>
              
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No active orders</p>
                <p className="text-gray-500 text-sm">Create limit orders, stop losses, and more advanced order types</p>
              </div>
            </GlassmorphicCard>
          </div>
        )}

        {/* Advanced Order Form Modal */}
        {showAdvancedOrder && (
          <OrderForm
            symbol={selectedSymbol}
            currentPrice={selectedSymbol ? (realTimeData.prices[selectedSymbol]?.price || 100) : 100}
            onSubmit={async (orderData) => {
              console.log('Advanced order submitted:', orderData);
              // In a real app, this would call the orders API
              setShowAdvancedOrder(false);
              setSelectedSymbol('');
            }}
            onCancel={() => {
              setShowAdvancedOrder(false);
              setSelectedSymbol('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
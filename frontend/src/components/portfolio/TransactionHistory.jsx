import React, { useState } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';

const TransactionHistory = ({ transactions, onDeleteTransaction }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'amount') {
      const aAmount = a.total || (a.shares * a.price);
      const bAmount = b.total || (b.shares * b.price);
      return bAmount - aAmount;
    } else if (sortBy === 'symbol') {
      return a.symbol.localeCompare(b.symbol);
    }
    return 0;
  });

  const totalBuys = transactions.filter(t => t.type === 'buy').length;
  const totalSells = transactions.filter(t => t.type === 'sell').length;
  const totalVolume = transactions.reduce((sum, t) => sum + (t.total || (t.shares * t.price)), 0);

  if (transactions.length === 0) {
    return (
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-6">Transaction History</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No transactions yet</p>
          <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Transaction History</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{transactions.length} transactions</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-800/30 rounded-lg">
        <div className="text-center">
          <p className="text-green-400 text-lg font-semibold">{totalBuys}</p>
          <p className="text-gray-400 text-sm">Buys</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">{totalSells}</p>
          <p className="text-gray-400 text-sm">Sells</p>
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">{formatCurrency(totalVolume)}</p>
          <p className="text-gray-400 text-sm">Total Volume</p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-primary"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="symbol">Symbol</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedTransactions.map((transaction, index) => (
          <div key={transaction.id || index} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={transaction.type === 'buy'
                    ? "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    : "M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                  } clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium">
                    {transaction.type.toUpperCase()} {transaction.shares} {transaction.symbol}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    transaction.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{formatCurrency(transaction.price)} per share</span>
                  <span>•</span>
                  <span>{formatDate(transaction.date)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white font-medium">
                  {formatCurrency(transaction.total || (transaction.shares * transaction.price))}
                </p>
                <p className="text-gray-400 text-sm">
                  {transaction.shares} × {formatCurrency(transaction.price)}
                </p>
              </div>
              
              <button
                onClick={() => onDeleteTransaction(transaction.id)}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded hover:bg-red-500/10"
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

      {filteredTransactions.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-gray-400">No {filter} transactions found</p>
          <button
            onClick={() => setFilter('all')}
            className="text-primary hover:text-primary/80 text-sm mt-2"
          >
            Show all transactions
          </button>
        </div>
      )}
    </GlassmorphicCard>
  );
};

export default TransactionHistory;
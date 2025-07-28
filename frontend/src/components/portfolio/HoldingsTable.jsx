import React, { useState } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';
import GradientButton from '../GradientButton';

const HoldingsTable = ({ holdings, realTimeData, onAdvancedOrder }) => {
  const [sortBy, setSortBy] = useState('totalValue');
  const [sortOrder, setSortOrder] = useState('desc');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0) >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedHoldings = [...holdings].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle real-time price data
    if (sortBy === 'currentPrice') {
      aValue = realTimeData.prices[a.symbol]?.price || a.currentPrice || a.avgCost;
      bValue = realTimeData.prices[b.symbol]?.price || b.currentPrice || b.avgCost;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
    >
      {children}
      <svg className={`w-4 h-4 transition-transform ${
        sortBy === field ? (sortOrder === 'asc' ? 'rotate-180' : '') : 'opacity-50'
      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  if (holdings.length === 0) {
    return (
      <GlassmorphicCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Current Holdings</h3>
          <button
            onClick={onAdvancedOrder}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Advanced Order
          </button>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-400 mb-4">No holdings yet</p>
          <p className="text-gray-500 text-sm mb-4">Start building your portfolio by adding your first transaction</p>
          <GradientButton onClick={onAdvancedOrder} size="sm">
            Add Your First Position
          </GradientButton>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Current Holdings</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{holdings.length} positions</span>
          <button
            onClick={onAdvancedOrder}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Advanced Order
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2">
                  <SortButton field="symbol">Symbol</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton field="shares">Shares</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton field="avgCost">Avg Cost</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton field="currentPrice">Current Price</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton field="totalValue">Market Value</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton field="unrealizedGain">Gain/Loss</SortButton>
                </th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding, index) => {
                const livePrice = realTimeData.prices[holding.symbol];
                const currentPrice = livePrice?.price || holding.currentPrice || holding.avgCost;
                const priceChange = livePrice?.change || 0;
                const priceChangePercent = livePrice?.changePercent || 0;
                const marketValue = holding.shares * currentPrice;
                const totalCost = holding.totalCost || (holding.shares * holding.avgCost);
                const unrealizedGain = marketValue - totalCost;
                const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

                return (
                  <tr key={holding.id || index} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{holding.symbol}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{holding.symbol}</p>
                          <p className="text-gray-400 text-xs">{holding.name || holding.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="text-white">{holding.shares}</span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="text-gray-300">{formatCurrency(holding.avgCost)}</span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-white font-medium">{formatCurrency(currentPrice)}</span>
                        {livePrice && (
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            priceChange >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                          }`}>
                            {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="text-white font-medium">{formatCurrency(marketValue)}</span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-medium ${unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {unrealizedGain >= 0 ? '+' : ''}{formatCurrency(unrealizedGain)}
                        </span>
                        <span className={`text-xs ${unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(unrealizedGainPercent)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button
                        onClick={() => onAdvancedOrder(holding.symbol)}
                        className="text-primary hover:text-primary/80 text-sm transition-colors"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {sortedHoldings.map((holding, index) => {
          const livePrice = realTimeData.prices[holding.symbol];
          const currentPrice = livePrice?.price || holding.currentPrice || holding.avgCost;
          const priceChange = livePrice?.change || 0;
          const priceChangePercent = livePrice?.changePercent || 0;
          const marketValue = holding.shares * currentPrice;
          const totalCost = holding.totalCost || (holding.shares * holding.avgCost);
          const unrealizedGain = marketValue - totalCost;
          const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

          return (
            <div key={holding.id || index} className="p-4 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{holding.symbol}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{holding.symbol}</p>
                    <p className="text-gray-400 text-sm">{holding.shares} shares</p>
                  </div>
                </div>
                <button
                  onClick={() => onAdvancedOrder(holding.symbol)}
                  className="text-primary hover:text-primary/80 text-sm transition-colors px-3 py-1 rounded border border-primary/30"
                >
                  Trade
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Avg Cost</p>
                  <p className="text-white">{formatCurrency(holding.avgCost)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Current Price</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{formatCurrency(currentPrice)}</p>
                    {livePrice && (
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        priceChange >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      }`}>
                        {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Market Value</p>
                  <p className="text-white font-medium">{formatCurrency(marketValue)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Gain/Loss</p>
                  <div>
                    <p className={`font-medium ${unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unrealizedGain >= 0 ? '+' : ''}{formatCurrency(unrealizedGain)}
                    </p>
                    <p className={`text-xs ${unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(unrealizedGainPercent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassmorphicCard>
  );
};

export default HoldingsTable;
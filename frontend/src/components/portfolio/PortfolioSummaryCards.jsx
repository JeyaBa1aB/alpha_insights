import React from 'react';
import GlassmorphicCard from '../GlassmorphicCard';

const PortfolioSummaryCards = ({ portfolioData, realTimeData }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0) >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
  };

  const formatLargeNumber = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  if (!portfolioData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <GlassmorphicCard key={i} className="animate-pulse">
            <div className="h-20 bg-slate-700/30 rounded"></div>
          </GlassmorphicCard>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(portfolioData.totalValue),
      subtitle: realTimeData.connectionStatus === 'simulated' ? '● Live Data' : 'Static Data',
      subtitleColor: realTimeData.connectionStatus === 'simulated' ? 'text-blue-400' : 'text-gray-400',
      icon: '💰',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: "Today's Change",
      value: formatCurrency(portfolioData.dailyChange),
      subtitle: formatPercent(portfolioData.dailyChangePercent),
      subtitleColor: portfolioData.dailyChange >= 0 ? 'text-green-400' : 'text-red-400',
      valueColor: portfolioData.dailyChange >= 0 ? 'text-green-400' : 'text-red-400',
      icon: portfolioData.dailyChange >= 0 ? '📈' : '📉',
      gradient: portfolioData.dailyChange >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
    },
    {
      title: 'Total Gain/Loss',
      value: formatCurrency(portfolioData.totalGainLoss),
      subtitle: formatPercent(portfolioData.totalGainLossPercent),
      subtitleColor: portfolioData.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400',
      valueColor: portfolioData.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400',
      icon: portfolioData.totalGainLoss >= 0 ? '🚀' : '📊',
      gradient: portfolioData.totalGainLoss >= 0 ? 'from-green-500 to-teal-600' : 'from-orange-500 to-red-600'
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(portfolioData.cashBalance),
      subtitle: 'Available to invest',
      subtitleColor: 'text-gray-400',
      icon: '💵',
      gradient: 'from-gray-500 to-slate-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <GlassmorphicCard key={index} className="relative overflow-hidden group hover:scale-105 transition-transform duration-200">
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-200`}></div>
          
          {/* Content */}
          <div className="relative z-10 text-center p-2">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">{card.icon}</span>
              <p className="text-gray-400 text-sm font-medium">{card.title}</p>
            </div>
            
            <p className={`text-2xl font-bold mb-1 ${card.valueColor || 'text-white'}`}>
              {card.value}
            </p>
            
            <p className={`text-sm ${card.subtitleColor}`}>
              {card.subtitle}
            </p>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </GlassmorphicCard>
      ))}
    </div>
  );
};

export default PortfolioSummaryCards;
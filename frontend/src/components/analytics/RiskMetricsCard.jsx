import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';
import { portfolioService } from '../../utils/api';

const RiskMetricsCard = ({ portfolioData }) => {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskMetrics();
  }, [portfolioData]);

  const loadRiskMetrics = async () => {
    try {
      setLoading(true);
      const response = await portfolioService.getRiskMetrics();
      if (response.success) {
        setRiskMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to load risk metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-4">Risk Analysis</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </GlassmorphicCard>
    );
  }

  if (!riskMetrics) {
    return (
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-4">Risk Analysis</h3>
        <div className="text-center py-12">
          <p className="text-gray-400">Unable to load risk metrics</p>
        </div>
      </GlassmorphicCard>
    );
  }

  const getRiskColor = (score) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 5) return 'text-yellow-400';
    if (score <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (score) => {
    if (score <= 3) return 'bg-green-400/10 border-green-400/20';
    if (score <= 5) return 'bg-yellow-400/10 border-yellow-400/20';
    if (score <= 7) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  const metrics = [
    { label: 'Beta', value: riskMetrics.beta, description: 'Market sensitivity' },
    { label: 'Sharpe Ratio', value: riskMetrics.sharpe_ratio, description: 'Risk-adjusted return' },
    { label: 'Volatility', value: `${riskMetrics.volatility}%`, description: 'Price fluctuation' },
    { label: 'Alpha', value: riskMetrics.alpha, description: 'Excess return vs market' },
    { label: 'Max Drawdown', value: `${riskMetrics.max_drawdown}%`, description: 'Largest peak-to-trough decline' },
    { label: 'VaR (95%)', value: `${riskMetrics.var_95}%`, description: 'Value at Risk' }
  ];

  return (
    <GlassmorphicCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Risk Analysis</h3>
        <div className={`px-3 py-1 rounded-lg border ${getRiskBgColor(riskMetrics.risk_score)}`}>
          <span className={`text-sm font-medium ${getRiskColor(riskMetrics.risk_score)}`}>
            {riskMetrics.risk_level}
          </span>
        </div>
      </div>

      {/* Risk Score */}
      <div className="mb-6 text-center">
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#374151"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={riskMetrics.risk_score <= 3 ? '#10B981' : 
                     riskMetrics.risk_score <= 5 ? '#F59E0B' :
                     riskMetrics.risk_score <= 7 ? '#F97316' : '#EF4444'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(riskMetrics.risk_score / 10) * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskColor(riskMetrics.risk_score)}`}>
                {riskMetrics.risk_score}
              </div>
              <div className="text-xs text-gray-400">Risk Score</div>
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Out of 10 (Higher = More Risk)</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">{metric.label}</span>
              <span className="text-white font-semibold">{metric.value}</span>
            </div>
            <p className="text-gray-500 text-xs">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {riskMetrics.recommendations && riskMetrics.recommendations.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-400 font-medium text-sm">Risk Management Tips</span>
          </div>
          <ul className="space-y-2">
            {riskMetrics.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-blue-300 text-sm flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassmorphicCard>
  );
};

export default RiskMetricsCard;
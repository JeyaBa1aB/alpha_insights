import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';
import GradientButton from '../GradientButton';
import { portfolioService } from '../../utils/api';

const AIRecommendations = ({ portfolioData }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [portfolioScore, setPortfolioScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (portfolioData && portfolioData.holdings && portfolioData.holdings.length > 0) {
      getRecommendations();
    }
  }, [portfolioData]);

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await portfolioService.getAIInsights();
      if (response.success) {
        setRecommendations(response.data.insights || []);
        setPortfolioScore(response.data.portfolio_score || 0);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-400/10 border-green-400/20';
    if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/20';
    if (score >= 40) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'buy':
        return '📈';
      case 'sell':
        return '📉';
      case 'diversification':
        return '🎯';
      case 'risk':
        return '⚠️';
      case 'rebalance':
        return '⚖️';
      case 'performance':
        return '🚀';
      default:
        return '💡';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'text-red-400 bg-red-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'low':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Score Card */}
      <GlassmorphicCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Portfolio Health Score</h3>
          <GradientButton onClick={getRecommendations} size="sm" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Analysis
              </div>
            )}
          </GradientButton>
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#374151"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={portfolioScore >= 80 ? '#10B981' : 
                       portfolioScore >= 60 ? '#F59E0B' :
                       portfolioScore >= 40 ? '#F97316' : '#EF4444'}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(portfolioScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(portfolioScore)}`}>
                  {portfolioScore}
                </div>
                <div className="text-xs text-gray-400">out of 100</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className={`inline-flex px-3 py-1 rounded-lg border ${getScoreBgColor(portfolioScore)}`}>
            <span className={`text-sm font-medium ${getScoreColor(portfolioScore)}`}>
              {portfolioScore >= 80 ? 'Excellent Portfolio' :
               portfolioScore >= 60 ? 'Good Portfolio' :
               portfolioScore >= 40 ? 'Needs Improvement' : 'High Risk Portfolio'}
            </span>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-center text-gray-400 text-xs">
            Last updated: {lastUpdated}
          </p>
        )}
      </GlassmorphicCard>

      {/* AI Recommendations */}
      <GlassmorphicCard>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-semibold text-white">AI-Powered Insights</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Analyzing your portfolio...</p>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-gray-400 mb-4">No recommendations available</p>
            <p className="text-gray-500 text-sm mb-4">
              Add some holdings to get personalized AI insights
            </p>
            <GradientButton onClick={getRecommendations} size="sm">
              Generate Insights
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{rec.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getImpactColor(rec.impact)}`}>
                          {rec.impact} Impact
                        </span>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-300">
                          {rec.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{rec.description}</p>
                    {rec.action && (
                      <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-blue-300 text-sm font-medium">Action: {rec.action}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
};

export default AIRecommendations;
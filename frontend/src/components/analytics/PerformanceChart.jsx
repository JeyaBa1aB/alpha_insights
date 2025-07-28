import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassmorphicCard from '../GlassmorphicCard';
import { portfolioService } from '../../utils/api';

const PerformanceChart = ({ portfolioData }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [timeframe, setTimeframe] = useState('6M');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [timeframe, portfolioData]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await portfolioService.getPerformance(timeframe);
      if (response.success) {
        setPerformanceData(response.data);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const timeframes = [
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'All' }
  ];

  return (
    <GlassmorphicCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf.value
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : performanceData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No performance data available</p>
          <p className="text-gray-500 text-sm">Performance tracking will begin after your first transaction</p>
        </div>
      ) : (
        <>
          {/* Performance Summary */}
          {performanceData.length > 1 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Starting Value</p>
                <p className="text-white font-semibold">
                  {formatCurrency(performanceData[0]?.value)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Current Value</p>
                <p className="text-white font-semibold">
                  {formatCurrency(performanceData[performanceData.length - 1]?.value)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Return</p>
                {(() => {
                  const startValue = performanceData[0]?.value || 0;
                  const endValue = performanceData[performanceData.length - 1]?.value || 0;
                  const totalReturn = endValue - startValue;
                  const totalReturnPercent = startValue > 0 ? (totalReturn / startValue) * 100 : 0;
                  
                  return (
                    <div>
                      <p className={`font-semibold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                      </p>
                      <p className={`text-sm ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Portfolio Value']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </GlassmorphicCard>
  );
};

export default PerformanceChart;
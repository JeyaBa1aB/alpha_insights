import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import GlassmorphicCard from '../GlassmorphicCard';
import { portfolioService } from '../../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

const SectorAllocationChart = ({ holdings }) => {
  const [sectorData, setSectorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectorData();
  }, [holdings]);

  const loadSectorData = async () => {
    try {
      setLoading(true);
      const response = await portfolioService.getSectorAllocation();
      if (response.success) {
        setSectorData(response.data);
      }
    } catch (error) {
      console.error('Failed to load sector data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-4">Sector Allocation</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </GlassmorphicCard>
    );
  }

  if (!sectorData || !sectorData.allocation || Object.keys(sectorData.allocation).length === 0) {
    return (
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-4">Sector Allocation</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No sector data available</p>
          <p className="text-gray-500 text-sm">Add some holdings to see sector allocation</p>
        </div>
      </GlassmorphicCard>
    );
  }

  const chartData = Object.entries(sectorData.allocation).map(([sector, percentage]) => ({
    name: sector,
    value: percentage,
    displayValue: `${percentage}%`
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <GlassmorphicCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Sector Allocation</h3>
        <div className="text-right">
          <p className="text-sm text-gray-400">Diversification Score</p>
          <p className="text-lg font-semibold text-white">{sectorData.diversification_score}/10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Allocation']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(sectorData.total_value)}</p>
          </div>

          {chartData.map((sector, index) => (
            <div key={sector.name} className="flex items-center justify-between p-2 rounded bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-white text-sm">{sector.name}</span>
              </div>
              <span className="text-gray-300 text-sm font-medium">{sector.displayValue}</span>
            </div>
          ))}

          {sectorData.recommendations && sectorData.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm font-medium mb-2">💡 Recommendations</p>
              <ul className="space-y-1">
                {sectorData.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-blue-300 text-xs">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </GlassmorphicCard>
  );
};

export default SectorAllocationChart;
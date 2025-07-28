import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

const Chart = ({ 
  data = [], 
  title = 'Performance', 
  color = '#6366f1', 
  height = 300,
  showArea = true,
  showGrid = true,
  showTooltip = true,
  animated = true,
  timeframe = '6M'
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Generate sample data if no data provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }

    // Generate realistic sample portfolio data
    const generateSampleData = () => {
      const now = new Date();
      const dataPoints = [];
      const baseValue = 125000;
      let currentValue = baseValue;
      
      // Generate data points based on timeframe
      const timeframes = {
        '1M': { days: 30, interval: 1 },
        '3M': { days: 90, interval: 3 },
        '6M': { days: 180, interval: 7 },
        '1Y': { days: 365, interval: 14 },
        'ALL': { days: 730, interval: 30 }
      };
      
      const { days, interval } = timeframes[timeframe] || timeframes['6M'];
      
      for (let i = days; i >= 0; i -= interval) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Add some realistic market volatility
        const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
        const trend = 0.0002; // Slight upward trend
        currentValue = currentValue * (1 + trend + volatility);
        
        dataPoints.push({
          date: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            ...(timeframe === '1Y' || timeframe === 'ALL' ? { year: '2-digit' } : {})
          }),
          value: Math.round(currentValue),
          fullDate: date.toISOString(),
          change: currentValue - baseValue,
          changePercent: ((currentValue - baseValue) / baseValue * 100).toFixed(2)
        });
      }
      
      return dataPoints;
    };

    return generateSampleData();
  }, [data, timeframe]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue * 100).toFixed(2);
    const isPositive = change >= 0;
    
    return {
      change,
      changePercent,
      isPositive,
      firstValue,
      lastValue
    };
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-white font-semibold text-lg">
              ${payload[0].value.toLocaleString()}
            </p>
            {data.change !== undefined && (
              <p className={`text-sm font-medium ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.change >= 0 ? '+' : ''}${Math.abs(data.change).toLocaleString()} 
                ({data.change >= 0 ? '+' : ''}{data.changePercent}%)
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for hover effects
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (hoveredPoint && payload.fullDate === hoveredPoint.fullDate) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill="#6366f1" 
          stroke="#ffffff" 
          strokeWidth={3}
          className="animate-pulse"
        />
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Performance Summary */}
      {performanceMetrics && (
        <div className="mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${performanceMetrics.lastValue.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">{timeframe} Performance</p>
              <div className={`flex items-center gap-2 ${performanceMetrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <svg 
                  className={`w-4 h-4 ${performanceMetrics.isPositive ? '' : 'rotate-180'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">
                  {performanceMetrics.isPositive ? '+' : ''}${Math.abs(performanceMetrics.change).toLocaleString()} 
                  ({performanceMetrics.isPositive ? '+' : ''}{performanceMetrics.changePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          {showArea ? (
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseMove={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#334155" 
                  strokeOpacity={0.3}
                />
              )}
              
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              
              {/* Reference line for break-even */}
              {performanceMetrics && (
                <ReferenceLine 
                  y={performanceMetrics.firstValue} 
                  stroke="#64748b" 
                  strokeDasharray="2 2" 
                  strokeOpacity={0.5}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                fill="url(#portfolioGradient)"
                dot={<CustomDot />}
                activeDot={{ 
                  r: 6, 
                  stroke: '#ffffff', 
                  strokeWidth: 2, 
                  fill: color,
                  className: 'drop-shadow-lg'
                }}
                animationDuration={animated ? 1500 : 0}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseMove={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#334155" 
                  strokeOpacity={0.3}
                />
              )}
              
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 6, 
                  stroke: '#ffffff', 
                  strokeWidth: 2, 
                  fill: color,
                  className: 'drop-shadow-lg'
                }}
                animationDuration={animated ? 1500 : 0}
                animationEasing="ease-out"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;

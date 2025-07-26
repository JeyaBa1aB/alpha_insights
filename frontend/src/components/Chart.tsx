import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface ChartProps {
  data: Array<{ date: string; value: number }>;
  title?: string;
  color?: string;
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ data, title = 'Performance', color = '#8884d8', height = 300 }) => (
  <div className="w-full">
    {title && <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>}
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#c7d2fe" />
        <YAxis stroke="#c7d2fe" />
        <Tooltip contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '0.5rem' }} />
        <Legend wrapperStyle={{ color: '#fff' }} />
        <Line type="monotone" dataKey="value" stroke="url(#chartGradient)" strokeWidth={3} dot={{ r: 5, stroke: color, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} name={title} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default Chart;

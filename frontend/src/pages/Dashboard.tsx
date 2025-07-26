// src/pages/Dashboard.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { name: 'Jan', value: 12000 },
  { name: 'Feb', value: 12500 },
  { name: 'Mar', value: 13000 },
  { name: 'Apr', value: 12800 },
  { name: 'May', value: 13500 },
  { name: 'Jun', value: 14000 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl bg-white/20 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/30">
        <h1 className="text-3xl font-bold text-white mb-6">Portfolio Overview</h1>
        <div className="flex flex-wrap gap-8 mb-8">
          <div className="bg-white/30 rounded-lg p-6 shadow w-64">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Total Value</h2>
            <p className="text-2xl font-bold text-blue-700">$14,000</p>
          </div>
          <div className="bg-white/30 rounded-lg p-6 shadow w-64">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">Growth (6M)</h2>
            <p className="text-2xl font-bold text-purple-700">+16.7%</p>
          </div>
          <div className="bg-white/30 rounded-lg p-6 shadow w-64">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Stocks Held</h2>
            <p className="text-2xl font-bold text-green-700">8</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-4">Performance Chart</h2>
        <div className="bg-white/10 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

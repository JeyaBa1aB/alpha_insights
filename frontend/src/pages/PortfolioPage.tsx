import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Example initial data
const initialPortfolio = [
  { symbol: 'AAPL', shares: 10, price: 180, date: '2025-07-01' },
  { symbol: 'MSFT', shares: 5, price: 340, date: '2025-07-10' },
];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [form, setForm] = useState({ symbol: '', shares: '', price: '', date: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.shares || !form.price || !form.date) return;
    setPortfolio([...portfolio, { ...form, shares: Number(form.shares), price: Number(form.price) }]);
    setForm({ symbol: '', shares: '', price: '', date: '' });
  };

  // Prepare chart data
  const chartData = portfolio.map((entry) => ({
    date: entry.date,
    value: entry.shares * entry.price,
    symbol: entry.symbol,
  }));

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Portfolio Management</h1>
      <div className="glassmorphic-card mb-8 p-6">
        <form className="flex flex-col md:flex-row gap-4 items-center" onSubmit={handleAdd}>
          <input name="symbol" value={form.symbol} onChange={handleChange} placeholder="Stock Symbol (e.g. AAPL)" className="input" />
          <input name="shares" value={form.shares} onChange={handleChange} placeholder="Shares" type="number" className="input" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price per Share" type="number" className="input" />
          <input name="date" value={form.date} onChange={handleChange} placeholder="Date (YYYY-MM-DD)" type="date" className="input" />
          <button type="submit" className="gradient-btn">Add Stock</button>
        </form>
      </div>
      <div className="glassmorphic-card p-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Total Value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="glassmorphic-card mt-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Current Holdings</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Price</th>
              <th>Date</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.symbol}</td>
                <td>{entry.shares}</td>
                <td>${entry.price}</td>
                <td>{entry.date}</td>
                <td>${entry.shares * entry.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

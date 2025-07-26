import React, { useState } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';

// Mock API function (replace with real API call)
const fetchStockMetrics = async (symbol) => {
  // Simulate API response
  const mockData = {
    AAPL: { price: 180, volume: 1200000, pe: 28.5, marketCap: '2.8T' },
    MSFT: { price: 340, volume: 900000, pe: 35.2, marketCap: '2.6T' },
    TSLA: { price: 260, volume: 1500000, pe: 70.1, marketCap: '800B' },
  };
  return mockData[symbol.toUpperCase()] || null;
};

export default function StockResearchPage() {
  const [symbol, setSymbol] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    const data = await fetchStockMetrics(symbol);
    if (data) {
      setMetrics(data);
    } else {
      setMetrics(null);
      setError('Stock not found. Try AAPL, MSFT, or TSLA.');
    }
  };

  const handleAddToPortfolio = () => {
    if (metrics) {
      setPortfolio([...portfolio, { symbol: symbol.toUpperCase(), ...metrics }]);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Stock Research</h1>
      <GlassmorphicCard className="mb-8">
        <form className="flex gap-4 items-center" onSubmit={handleSearch}>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter Stock Symbol (e.g. AAPL)"
            className="w-full p-3 rounded-lg bg-white/20 backdrop-blur-lg border border-white/30 text-white placeholder-gray-300"
          />
          <GradientButton type="submit">Search</GradientButton>
        </form>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </GlassmorphicCard>
      {metrics && (
        <GlassmorphicCard className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Metrics for {symbol.toUpperCase()}</h2>
          <ul className="mb-4 space-y-2">
            <li>Price: ${metrics.price}</li>
            <li>Volume: {metrics.volume.toLocaleString()}</li>
            <li>P/E Ratio: {metrics.pe}</li>
            <li>Market Cap: {metrics.marketCap}</li>
          </ul>
          <GradientButton onClick={handleAddToPortfolio}>Add to Portfolio</GradientButton>
        </GlassmorphicCard>
      )}
      {portfolio.length > 0 && (
        <GlassmorphicCard>
          <h2 className="text-xl font-semibold mb-4">Added to Portfolio</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Volume</th>
                <th className="pb-2">P/E Ratio</th>
                <th className="pb-2">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((entry, idx) => (
                <tr key={idx} className="border-b border-white/10">
                  <td className="py-2">{entry.symbol}</td>
                  <td className="py-2">${entry.price}</td>
                  <td className="py-2">{entry.volume.toLocaleString()}</td>
                  <td className="py-2">{entry.pe}</td>
                  <td className="py-2">{entry.marketCap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassmorphicCard>
      )}
    </div>
  );
}

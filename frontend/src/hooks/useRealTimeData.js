import { useEffect, useState } from 'react';

export const useSimulatedRealTimeData = (symbols) => {
  const [prices, setPrices] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    if (!symbols || symbols.length === 0) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('simulated');

    // Initialize prices with base values
    const initialPrices = {};
    symbols.forEach(symbol => {
      initialPrices[symbol] = {
        price: getBasePrice(symbol),
        change: 0,
        changePercent: 0,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        lastUpdated: new Date().toISOString()
      };
    });
    setPrices(initialPrices);

    // Simulate real-time price updates
    const interval = setInterval(() => {
      setPrices(prevPrices => {
        const updatedPrices = { ...prevPrices };
        
        symbols.forEach(symbol => {
          if (updatedPrices[symbol]) {
            const currentPrice = updatedPrices[symbol].price;
            const basePrice = getBasePrice(symbol);
            
            // Simulate price movement (-2% to +2% per update)
            const changePercent = (Math.random() - 0.5) * 0.04; // -2% to +2%
            const newPrice = Math.max(0.01, currentPrice * (1 + changePercent));
            
            // Calculate change from base price
            const totalChange = newPrice - basePrice;
            const totalChangePercent = ((newPrice - basePrice) / basePrice) * 100;
            
            updatedPrices[symbol] = {
              ...updatedPrices[symbol],
              price: Math.round(newPrice * 100) / 100,
              change: Math.round(totalChange * 100) / 100,
              changePercent: Math.round(totalChangePercent * 100) / 100,
              volume: updatedPrices[symbol].volume + Math.floor(Math.random() * 1000),
              lastUpdated: new Date().toISOString()
            };
          }
        });
        
        return updatedPrices;
      });
    }, 3000); // Update every 3 seconds

    return () => {
      clearInterval(interval);
      setConnectionStatus('disconnected');
    };
  }, [symbols]);

  return {
    prices,
    connectionStatus
  };
};

// Helper function to get consistent base prices for symbols
const getBasePrice = (symbol) => {
  const basePrices = {
    'AAPL': 175.50,
    'MSFT': 415.80,
    'GOOGL': 132.55,
    'AMZN': 145.30,
    'TSLA': 240.10,
    'NVDA': 603.80,
    'JPM': 145.60,
    'JNJ': 162.40,
    'PG': 155.20,
    'KO': 61.80,
    'WMT': 165.90,
    'V': 285.40,
    'MA': 485.20
  };
  
  return basePrices[symbol] || 100.00;
};
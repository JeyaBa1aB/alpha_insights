import React, { useState } from 'react';
import '../../App.css';

const mockApiKeys = [
  { name: 'Polygon.io', key: 'pk_live_1234...', usage: 1200, limit: 5000 },
  { name: 'Finnhub', key: 'fh_live_5678...', usage: 800, limit: 3000 },
];

const mockRedis = {
  status: 'Online',
  cacheSize: '24MB',
  keys: 320,
  lastFlush: '2025-07-25 22:10',
};

export default function SystemSettings() {
  const [redisStatus, setRedisStatus] = useState(mockRedis.status);
  const [message, setMessage] = useState('');

  const handleFlushCache = () => {
    setRedisStatus('Flushing...');
    setTimeout(() => {
      setRedisStatus('Online');
      setMessage('Redis cache flushed successfully!');
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">System & Settings</h1>
      <div className="glassmorphic-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">API Key Usage</h2>
        <table className="w-full text-left mb-4">
          <thead>
            <tr>
              <th>Service</th>
              <th>Key</th>
              <th>Usage</th>
              <th>Limit</th>
            </tr>
          </thead>
          <tbody>
            {mockApiKeys.map((api, idx) => (
              <tr key={idx}>
                <td>{api.name}</td>
                <td className="truncate max-w-xs">{api.key}</td>
                <td>{api.usage}</td>
                <td>{api.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glassmorphic-card p-6">
        <h2 className="text-xl font-semibold mb-4">Redis Cache Management</h2>
        <ul className="mb-4">
          <li>Status: <span className={redisStatus === 'Online' ? 'text-green-600' : 'text-yellow-600'}>{redisStatus}</span></li>
          <li>Cache Size: {mockRedis.cacheSize}</li>
          <li>Keys: {mockRedis.keys}</li>
          <li>Last Flush: {mockRedis.lastFlush}</li>
        </ul>
        <button className="gradient-btn" onClick={handleFlushCache}>Flush Cache</button>
        {message && <div className="text-green-500 mt-2">{message}</div>}
      </div>
    </div>
  );
}

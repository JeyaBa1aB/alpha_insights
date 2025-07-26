import React, { useEffect, useState } from 'react';

// Mock WebSocket notifications
const mockNotifications = [
  { id: 1, symbol: 'AAPL', price: 185, type: 'Price Alert', time: '2025-07-26 10:15' },
  { id: 2, symbol: 'TSLA', price: 265, type: 'Price Alert', time: '2025-07-26 10:17' },
  { id: 3, symbol: 'MSFT', price: 345, type: 'Price Alert', time: '2025-07-26 10:20' },
];

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [history, setHistory] = useState([]);

  // Simulate receiving new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (notifications.length > 0) {
        setHistory((prev) => [notifications[0], ...prev]);
        setNotifications((prev) => prev.slice(1));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [notifications]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Notifications Center</h1>
      <div className="glassmorphic-card mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Real-Time Price Alerts</h2>
        {notifications.length === 0 ? (
          <div className="text-gray-500">No new alerts.</div>
        ) : (
          <ul>
            {notifications.map((note) => (
              <li key={note.id} className="mb-2 p-2 rounded bg-blue-50">
                <strong>{note.symbol}</strong> hit <strong>${note.price}</strong> at {note.time} ({note.type})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="glassmorphic-card p-6">
        <h2 className="text-xl font-semibold mb-4">Notification History</h2>
        {history.length === 0 ? (
          <div className="text-gray-500">No history yet.</div>
        ) : (
          <ul>
            {history.map((note) => (
              <li key={note.id} className="mb-2 p-2 rounded bg-gray-50">
                <strong>{note.symbol}</strong> hit <strong>${note.price}</strong> at {note.time} ({note.type})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

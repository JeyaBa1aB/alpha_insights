// src/admin/SystemMonitoring.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

const SystemMonitoring = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: { usage: 0, cores: 8, temperature: 0 },
    memory: { used: 0, total: 16, percentage: 0 },
    disk: { used: 0, total: 500, percentage: 0 },
    network: { inbound: 0, outbound: 0 },
    database: { connections: 0, queries: 0, size: 0 },
    api: { requests: 0, errors: 0, avgResponseTime: 0 }
  });

  const [alerts, setAlerts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    loadSystemMetrics();
    loadAlerts();
    loadServices();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadSystemMetrics();
        loadAlerts();
        loadServices();
      }, refreshInterval);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const loadSystemMetrics = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockMetrics = {
        cpu: { 
          usage: Math.random() * 100, 
          cores: 8, 
          temperature: 45 + Math.random() * 20 
        },
        memory: { 
          used: 8.5 + Math.random() * 2, 
          total: 16, 
          percentage: (8.5 + Math.random() * 2) / 16 * 100 
        },
        disk: { 
          used: 250 + Math.random() * 50, 
          total: 500, 
          percentage: (250 + Math.random() * 50) / 500 * 100 
        },
        network: { 
          inbound: Math.random() * 100, 
          outbound: Math.random() * 50 
        },
        database: { 
          connections: Math.floor(Math.random() * 50) + 10, 
          queries: Math.floor(Math.random() * 1000) + 500, 
          size: 2.3 + Math.random() * 0.5 
        },
        api: { 
          requests: Math.floor(Math.random() * 500) + 200, 
          errors: Math.floor(Math.random() * 10), 
          avgResponseTime: Math.random() * 200 + 50 
        }
      };
      setSystemMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const mockAlerts = [
        {
          id: 1,
          type: 'warning',
          title: 'High CPU Usage',
          message: 'CPU usage has been above 80% for the last 10 minutes',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          severity: 'medium'
        },
        {
          id: 2,
          type: 'info',
          title: 'Database Backup Completed',
          message: 'Scheduled database backup completed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          severity: 'low'
        },
        {
          id: 3,
          type: 'error',
          title: 'API Rate Limit Exceeded',
          message: 'Multiple clients have exceeded API rate limits',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          severity: 'high'
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadServices = async () => {
    try {
      const mockServices = [
        { name: 'Web Server', status: 'running', uptime: '15d 8h 23m', port: 5000 },
        { name: 'Database', status: 'running', uptime: '15d 8h 23m', port: 27017 },
        { name: 'Redis Cache', status: 'running', uptime: '15d 8h 23m', port: 6379 },
        { name: 'WebSocket Server', status: 'running', uptime: '15d 8h 23m', port: 5001 },
        { name: 'Background Jobs', status: 'running', uptime: '15d 8h 23m', port: null },
        { name: 'Email Service', status: 'warning', uptime: '2h 15m', port: null }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'stopped': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MetricCard = ({ title, value, unit, percentage, icon, color = 'indigo' }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toFixed(1) : value}
            <span className="text-sm text-gray-400 ml-1">{unit}</span>
          </div>
          <div className="text-sm text-gray-400">{title}</div>
        </div>
      </div>
      {percentage !== undefined && (
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading system monitoring...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Monitoring</h1>
              <p className="text-gray-400">Real-time system performance and health monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">Auto Refresh</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={1000}>1s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="CPU Usage"
            value={systemMetrics.cpu.usage}
            unit="%"
            percentage={systemMetrics.cpu.usage}
            icon="🖥️"
            color="blue"
          />
          <MetricCard
            title="Memory Usage"
            value={systemMetrics.memory.used}
            unit={`GB / ${systemMetrics.memory.total}GB`}
            percentage={systemMetrics.memory.percentage}
            icon="💾"
            color="green"
          />
          <MetricCard
            title="Disk Usage"
            value={systemMetrics.disk.used}
            unit={`GB / ${systemMetrics.disk.total}GB`}
            percentage={systemMetrics.disk.percentage}
            icon="💿"
            color="purple"
          />
          <MetricCard
            title="Network In"
            value={systemMetrics.network.inbound}
            unit="MB/s"
            icon="📥"
            color="cyan"
          />
          <MetricCard
            title="Network Out"
            value={systemMetrics.network.outbound}
            unit="MB/s"
            icon="📤"
            color="orange"
          />
          <MetricCard
            title="API Requests"
            value={systemMetrics.api.requests}
            unit="/min"
            icon="🔌"
            color="pink"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Services Status */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Services Status</h2>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'running' ? 'bg-green-500' :
                      service.status === 'warning' ? 'bg-yellow-500' :
                      service.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <div className="text-white font-medium">{service.name}</div>
                      <div className="text-gray-400 text-sm">
                        Uptime: {service.uptime}
                        {service.port && ` • Port: ${service.port}`}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                    {service.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Metrics */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Database Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Connections</span>
                <span className="text-white font-medium">{systemMetrics.database.connections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Queries/min</span>
                <span className="text-white font-medium">{systemMetrics.database.queries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Database Size</span>
                <span className="text-white font-medium">{systemMetrics.database.size.toFixed(1)} GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Avg Response Time</span>
                <span className="text-white font-medium">{systemMetrics.api.avgResponseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Error Rate</span>
                <span className={`font-medium ${systemMetrics.api.errors > 5 ? 'text-red-400' : 'text-green-400'}`}>
                  {((systemMetrics.api.errors / systemMetrics.api.requests) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm">
              View All Alerts
            </button>
          </div>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <h3 className="font-medium text-white">{alert.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                    <p className="text-gray-400 text-xs">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-white ml-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Restart Services
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Run Backup
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Clear Cache
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Emergency Stop
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
// src/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPortfolios: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  apiCallsToday: number;
  errorRate: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPortfolios: 0,
    systemUptime: '0h 0m',
    memoryUsage: 0,
    cpuUsage: 0,
    apiCallsToday: 0,
    errorRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSystemStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStats = async () => {
    try {
      const token = getToken();
      const response = await api.get('/admin/stats', token);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Mock data for now since backend endpoint doesn't exist yet
        setStats({
          totalUsers: 1247,
          activeUsers: 89,
          totalPortfolios: 892,
          systemUptime: '7d 14h 23m',
          memoryUsage: 68.5,
          cpuUsage: 23.7,
          apiCallsToday: 15420,
          errorRate: 0.12
        });
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch system stats');
      setLoading(false);
      // Use mock data on error
      setStats({
        totalUsers: 1247,
        activeUsers: 89,
        totalPortfolios: 892,
        systemUptime: '7d 14h 23m',
        memoryUsage: 68.5,
        cpuUsage: 23.7,
        apiCallsToday: 15420,
        errorRate: 0.12
      });
    }
  };

  const getHealthStatus = () => {
    if (stats.cpuUsage > 80 || stats.memoryUsage > 85 || stats.errorRate > 1) {
      return { status: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    } else if (stats.cpuUsage > 60 || stats.memoryUsage > 70 || stats.errorRate > 0.5) {
      return { status: 'Warning', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    }
    return { status: 'Healthy', color: 'text-green-500', bgColor: 'bg-green-500/20' };
  };

  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">System overview and analytics</p>
        </div>

        {/* System Health Status */}
        <div className={`mb-8 p-6 rounded-xl ${healthStatus.bgColor} border border-gray-700`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">System Health</h2>
              <p className={`text-lg font-medium ${healthStatus.color}`}>
                Status: {healthStatus.status}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Uptime</p>
              <p className="text-2xl font-bold">{stats.systemUptime}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-green-400 text-sm mt-2">↗ +12% from last month</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Active Users</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold">{stats.activeUsers}</p>
            <p className="text-green-400 text-sm mt-2">↗ +5% from yesterday</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Total Portfolios</h3>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold">{stats.totalPortfolios.toLocaleString()}</p>
            <p className="text-green-400 text-sm mt-2">↗ +8% from last week</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">API Calls Today</h3>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold">{stats.apiCallsToday.toLocaleString()}</p>
            <p className="text-green-400 text-sm mt-2">↗ +15% from yesterday</p>
          </div>
        </div>

        {/* System Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">System Performance</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-white">{stats.cpuUsage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${stats.cpuUsage > 80 ? 'bg-red-500' : stats.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${stats.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white">{stats.memoryUsage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${stats.memoryUsage > 85 ? 'bg-red-500' : stats.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${stats.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-white">{stats.errorRate}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${stats.errorRate > 1 ? 'bg-red-500' : stats.errorRate > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.max(stats.errorRate * 10, 2)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link 
                to="/admin/users"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                View User Management
              </Link>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                System Settings
              </button>
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                View System Logs
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Emergency Actions
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Recent System Activity</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>New user registration: john.doe@example.com</span>
              </div>
              <span className="text-gray-400 text-sm">2 minutes ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Portfolio created by user ID: 1247</span>
              </div>
              <span className="text-gray-400 text-sm">5 minutes ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>API rate limit warning for IP: 192.168.1.100</span>
              </div>
              <span className="text-gray-400 text-sm">12 minutes ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>System backup completed successfully</span>
              </div>
              <span className="text-gray-400 text-sm">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
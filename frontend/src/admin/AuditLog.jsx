// src/admin/AuditLog.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const actionTypes = [
    'all', 'login', 'logout', 'user_created', 'user_updated', 'user_deleted',
    'settings_changed', 'data_export', 'password_reset', 'permission_changed',
    'system_backup', 'maintenance_mode', 'api_access', 'security_alert'
  ];

  const severityColors = {
    low: 'text-green-400 bg-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    high: 'text-orange-400 bg-orange-500/20',
    critical: 'text-red-400 bg-red-500/20'
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, userFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockLogs = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          action: 'login',
          user: 'admin',
          userId: '1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'low',
          description: 'Admin user logged in successfully',
          metadata: {
            sessionId: 'sess_123456',
            location: 'New York, NY',
            device: 'Desktop'
          }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          action: 'user_created',
          user: 'admin',
          userId: '1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium',
          description: 'New user account created: john_doe',
          metadata: {
            targetUserId: '4',
            targetUsername: 'john_doe',
            role: 'user'
          }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          action: 'settings_changed',
          user: 'admin',
          userId: '1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'high',
          description: 'System settings modified: Security settings updated',
          metadata: {
            settingsCategory: 'security',
            changes: ['passwordMinLength', 'twoFactorRequired']
          }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          action: 'security_alert',
          user: 'system',
          userId: null,
          ipAddress: '192.168.1.200',
          userAgent: 'Unknown',
          severity: 'critical',
          description: 'Multiple failed login attempts detected',
          metadata: {
            attempts: 5,
            targetUser: 'jane_smith',
            blocked: true
          }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          action: 'data_export',
          user: 'analyst_user',
          userId: '2',
          ipAddress: '192.168.1.150',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          severity: 'medium',
          description: 'User data exported to CSV',
          metadata: {
            exportType: 'user_list',
            recordCount: 150,
            fileSize: '2.3MB'
          }
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs.filter(log => {
      const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.ipAddress.includes(searchTerm);
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesUser = userFilter === 'all' || log.user === userFilter;
      
      return matchesSearch && matchesAction && matchesUser;
    });

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'User', 'IP Address', 'Severity', 'Description'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.user,
        log.ipAddress,
        log.severity,
        log.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionIcon = (action) => {
    const icons = {
      login: '🔐',
      logout: '🚪',
      user_created: '👤',
      user_updated: '✏️',
      user_deleted: '🗑️',
      settings_changed: '⚙️',
      data_export: '📤',
      password_reset: '🔑',
      permission_changed: '🛡️',
      system_backup: '💾',
      maintenance_mode: '🔧',
      api_access: '🔌',
      security_alert: '🚨'
    };
    return icons[action] || '📝';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getUniqueUsers = () => {
    const users = [...new Set(logs.map(log => log.user))];
    return users.filter(user => user !== null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading audit logs...</div>
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
              <h1 className="text-3xl font-bold text-white mb-2">Audit Log</h1>
              <p className="text-gray-400">Track system activities and security events</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportLogs}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {actionTypes.map(action => (
                  <option key={action} value={action}>
                    {action === 'all' ? 'All Actions' : action.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                {getUniqueUsers().map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-gray-400 text-sm">
                {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                        <span className="text-sm text-white capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {log.user || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[log.severity]}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetails(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{logs.length}</div>
            <div className="text-sm text-gray-400">Total Events</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">
              {logs.filter(log => log.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-400">Critical Events</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {logs.filter(log => log.action === 'security_alert').length}
            </div>
            <div className="text-sm text-gray-400">Security Alerts</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">
              {getUniqueUsers().length}
            </div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Log Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedLog.timestamp)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getActionIcon(selectedLog.action)}</span>
                    <span className="text-white capitalize">{selectedLog.action.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">User</label>
                  <div className="text-white">{selectedLog.user || 'System'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">IP Address</label>
                  <div className="text-white font-mono">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[selectedLog.severity]}`}>
                    {selectedLog.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <div className="text-white">{selectedLog.description}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">User Agent</label>
                <div className="text-white text-sm break-all">{selectedLog.userAgent}</div>
              </div>

              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Additional Data</label>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
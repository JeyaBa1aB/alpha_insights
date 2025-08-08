// src/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkActions, setBulkActions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [dataPrivacyLevel, setDataPrivacyLevel] = useState('full'); // full, masked, minimal
  
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    isActive: true,
    permissions: {
      portfolioAccess: 'read',
      marketData: 'delayed',
      reports: 'basic',
      userManagement: false,
      systemSettings: false
    }
  });

  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    permissions: {
      portfolioAccess: 'read',
      marketData: 'delayed',
      reports: 'basic',
      userManagement: false,
      systemSettings: false
    }
  });

  // Data privacy levels
  const privacyLevels = {
    full: { label: 'Full Access', description: 'Show all user data including PII' },
    masked: { label: 'Masked PII', description: 'Hide sensitive personal information' },
    minimal: { label: 'Minimal Data', description: 'Show only essential user information' }
  };

  // Permission templates
  const permissionTemplates = {
    admin: {
      portfolioAccess: 'full',
      marketData: 'realtime',
      reports: 'advanced',
      userManagement: true,
      systemSettings: true
    },
    analyst: {
      portfolioAccess: 'read',
      marketData: 'realtime',
      reports: 'advanced',
      userManagement: false,
      systemSettings: false
    },
    user: {
      portfolioAccess: 'read',
      marketData: 'delayed',
      reports: 'basic',
      userManagement: false,
      systemSettings: false
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const response = await api.get('/admin/users', token);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Enhanced mock data with permissions
        const mockUsers = [
          {
            _id: '1',
            username: 'john_doe',
            email: 'john.doe@example.com',
            role: 'user',
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-01-20T14:22:00Z',
            isActive: true,
            permissions: permissionTemplates.user,
            portfolioValue: 125000,
            lastActivity: '2024-01-20T14:22:00Z'
          },
          {
            _id: '2',
            username: 'jane_smith',
            email: 'jane.smith@example.com',
            role: 'analyst',
            createdAt: '2024-01-10T09:15:00Z',
            lastLogin: '2024-01-19T16:45:00Z',
            isActive: true,
            permissions: permissionTemplates.analyst,
            portfolioValue: 250000,
            lastActivity: '2024-01-19T16:45:00Z'
          },
          {
            _id: '3',
            username: 'admin_user',
            email: 'admin@example.com',
            role: 'admin',
            createdAt: '2024-01-01T08:00:00Z',
            lastLogin: '2024-01-20T18:30:00Z',
            isActive: true,
            permissions: permissionTemplates.admin,
            portfolioValue: null,
            lastActivity: '2024-01-20T18:30:00Z'
          }
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      const token = getToken();
      const response = await api.post('/admin/users', createFormData, token);
      
      if (response.ok) {
        fetchUsers();
        setShowCreateModal(false);
        setCreateFormData({
          username: '',
          email: '',
          password: '',
          role: 'user',
          permissions: permissionTemplates.user
        });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = getToken();
      const response = await api.put(`/admin/users/${editingUser._id}`, editFormData, token);
      
      if (response.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = getToken();
      const response = await api.delete(`/admin/users/${userId}`, token);
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete user');
    }
  };

  const handleBulkAction = async (action) => {
    const userIds = Array.from(selectedUsers);
    
    try {
      const token = getToken();
      
      switch (action) {
        case 'activate':
          await Promise.all(userIds.map(id => 
            api.put(`/admin/users/${id}`, { isActive: true }, token)
          ));
          break;
        case 'deactivate':
          await Promise.all(userIds.map(id => 
            api.put(`/admin/users/${id}`, { isActive: false }, token)
          ));
          break;
        case 'delete':
          if (window.confirm(`Delete ${userIds.length} users?`)) {
            await Promise.all(userIds.map(id => 
              api.delete(`/admin/users/${id}`, token)
            ));
          }
          break;
      }
      
      fetchUsers();
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
      setError('Bulk action failed');
    }
  };

  const applyPermissionTemplate = (template) => {
    setEditFormData(prev => ({
      ...prev,
      permissions: { ...permissionTemplates[template] }
    }));
  };

  const maskUserData = (user, field) => {
    if (dataPrivacyLevel === 'full') return user[field];
    
    switch (field) {
      case 'email':
        if (dataPrivacyLevel === 'masked') {
          const [name, domain] = user.email.split('@');
          return `${name.slice(0, 2)}***@${domain}`;
        }
        return '***@***.com';
      case 'portfolioValue':
        if (dataPrivacyLevel === 'masked') {
          return user.portfolioValue ? `$${Math.round(user.portfolioValue / 1000)}k` : 'N/A';
        }
        return 'Hidden';
      default:
        return user[field];
    }
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user._id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading users...</div>
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
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-gray-400">Manage users, roles, and permissions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Privacy Level */}
            <div>
              <select
                value={dataPrivacyLevel}
                onChange={(e) => setDataPrivacyLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(privacyLevels).map(([key, level]) => (
                  <option key={key} value={key}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-white">{selectedUsers.size} users selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
                      className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Portfolio Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-sm text-gray-400">{maskUserData(user, 'email')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-300'
                          : user.role === 'analyst'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {maskUserData(user, 'portfolioValue')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditFormData({
                              username: user.username,
                              email: user.email,
                              role: user.role,
                              isActive: user.isActive,
                              permissions: user.permissions || permissionTemplates[user.role]
                            });
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionsModal(true);
                          }}
                          className="text-yellow-400 hover:text-yellow-300 text-sm"
                        >
                          Permissions
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
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
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive).length}</div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-sm text-gray-400">Admins</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'analyst').length}</div>
            <div className="text-sm text-gray-400">Analysts</div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setCreateFormData(prev => ({ 
                      ...prev, 
                      role,
                      permissions: permissionTemplates[role]
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Edit User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setEditFormData(prev => ({ 
                      ...prev, 
                      role,
                      permissions: permissionTemplates[role]
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Active Status</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Permission Template</label>
                <div className="flex gap-2">
                  {Object.keys(permissionTemplates).map(template => (
                    <button
                      key={template}
                      onClick={() => applyPermissionTemplate(template)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateUser}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Update User
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              User Permissions - {selectedUser.username}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio Access</label>
                  <div className="text-sm text-gray-400">
                    {selectedUser.permissions?.portfolioAccess || 'read'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Market Data</label>
                  <div className="text-sm text-gray-400">
                    {selectedUser.permissions?.marketData || 'delayed'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reports</label>
                  <div className="text-sm text-gray-400">
                    {selectedUser.permissions?.reports || 'basic'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User Management</label>
                  <div className="text-sm text-gray-400">
                    {selectedUser.permissions?.userManagement ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
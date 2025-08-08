// src/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        systemName: 'Alpha Insights',
        maintenanceMode: false,
        allowNewRegistrations: true,
        maxUsersPerAccount: 1000,
        sessionTimeout: 24,
        backupFrequency: 'daily',
        emailNotifications: true,
        systemAlerts: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            // For now, use mock data since the backend endpoint doesn't exist yet
            // const token = getToken();
            // const response = await api.get('/admin/settings', token);

            // Mock data for demonstration
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Failed to load settings:', error);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // const token = getToken();
            // const response = await api.put('/admin/settings', settings, token);

            // Mock save for demonstration
            setTimeout(() => {
                setSaving(false);
                setMessage('Settings saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            }, 1000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaving(false);
            setMessage('Failed to save settings');
        }
    };

    const handleInputChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading system settings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
                    <p className="text-gray-400">Configure system-wide settings and preferences</p>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('success')
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                        : 'bg-red-500/20 border border-red-500/50 text-red-300'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">General Settings</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    System Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.systemName}
                                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Session Timeout (hours)
                                </label>
                                <input
                                    type="number"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Max Users Per Account
                                </label>
                                <input
                                    type="number"
                                    value={settings.maxUsersPerAccount}
                                    onChange={(e) => handleInputChange('maxUsersPerAccount', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Backup Frequency
                                </label>
                                <select
                                    value={settings.backupFrequency}
                                    onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security & Access Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Security & Access</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-300">
                                        Maintenance Mode
                                    </label>
                                    <p className="text-xs text-gray-400">Disable user access for maintenance</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenanceMode}
                                        onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-300">
                                        Allow New Registrations
                                    </label>
                                    <p className="text-xs text-gray-400">Enable new user sign-ups</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.allowNewRegistrations}
                                        onChange={(e) => handleInputChange('allowNewRegistrations', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-300">
                                        Email Notifications
                                    </label>
                                    <p className="text-xs text-gray-400">Send system notifications via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-300">
                                        System Alerts
                                    </label>
                                    <p className="text-xs text-gray-400">Enable system health alerts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.systemAlerts}
                                        onChange={(e) => handleInputChange('systemAlerts', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Information */}
                <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">System Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-400">v2.1.0</div>
                            <div className="text-sm text-gray-400">System Version</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">99.9%</div>
                            <div className="text-sm text-gray-400">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">2.3GB</div>
                            <div className="text-sm text-gray-400">Database Size</div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {saving && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
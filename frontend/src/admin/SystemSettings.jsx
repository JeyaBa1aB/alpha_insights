// src/admin/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Alpha Insights',
    systemDescription: 'Advanced Portfolio Management Platform',
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxUsersPerAccount: 1000,
    sessionTimeout: 24,
    backupFrequency: 'daily',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    twoFactorRequired: false,
    sessionSecurityLevel: 'standard',
    ipWhitelisting: false,
    allowedIPs: '',
    encryptionLevel: 'AES-256'
  });

  // Data Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    dataRetentionPeriod: 365,
    automaticDataPurging: true,
    piiMaskingLevel: 'partial',
    auditLogRetention: 90,
    gdprCompliance: true,
    dataExportRestrictions: true,
    anonymizeInactiveUsers: true,
    consentManagement: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    systemAlerts: true,
    marketAlerts: true,
    portfolioAlerts: true,
    securityAlerts: true,
    maintenanceNotifications: true,
    emailProvider: 'sendgrid',
    smsProvider: 'twilio'
  });

  // API & Integration Settings
  const [apiSettings, setApiSettings] = useState({
    rateLimitPerMinute: 100,
    rateLimitPerHour: 1000,
    apiKeyExpiration: 365,
    webhookTimeout: 30,
    allowCors: true,
    corsOrigins: '*',
    apiVersioning: true,
    deprecationWarnings: true,
    marketDataProvider: 'polygon',
    marketDataRefreshRate: 5
  });

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    advancedAnalytics: true,
    aiInsights: true,
    socialTrading: false,
    cryptoSupport: false,
    optionsTrading: false,
    marginTrading: false,
    paperTrading: true,
    mobileApp: true,
    darkMode: true,
    betaFeatures: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'privacy', label: 'Data Privacy', icon: '🛡️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'api', label: 'API & Integrations', icon: '🔌' },
    { id: 'features', label: 'Feature Flags', icon: '🚩' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Mock data loading - replace with actual API calls
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async (settingsType, settings) => {
    try {
      setSaving(true);
      // Mock save - replace with actual API call
      // const token = getToken();
      // await api.put(`/admin/settings/${settingsType}`, settings, token);
      
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

  const handleSave = () => {
    switch (activeTab) {
      case 'general':
        saveSettings('general', generalSettings);
        break;
      case 'security':
        saveSettings('security', securitySettings);
        break;
      case 'privacy':
        saveSettings('privacy', privacySettings);
        break;
      case 'notifications':
        saveSettings('notifications', notificationSettings);
        break;
      case 'api':
        saveSettings('api', apiSettings);
        break;
      case 'features':
        saveSettings('features', featureFlags);
        break;
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all settings to default values?')) {
      // Reset logic here
      setMessage('Settings reset to defaults');
    }
  };

  const exportSettings = () => {
    const allSettings = {
      general: generalSettings,
      security: securitySettings,
      privacy: privacySettings,
      notifications: notificationSettings,
      api: apiSettings,
      features: featureFlags
    };
    
    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system-settings.json';
    link.click();
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">System Name</label>
          <input
            type="text"
            value={generalSettings.systemName}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemName: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
          <select
            value={generalSettings.timezone}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
            <option value="GMT">Greenwich Mean Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (hours)</label>
          <input
            type="number"
            value={generalSettings.sessionTimeout}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Users</label>
          <input
            type="number"
            value={generalSettings.maxUsersPerAccount}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxUsersPerAccount: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">System Description</label>
        <textarea
          value={generalSettings.systemDescription}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemDescription: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
            <p className="text-xs text-gray-400">Disable user access for maintenance</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={generalSettings.maintenanceMode}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Allow New Registrations</label>
            <p className="text-xs text-gray-400">Enable new user sign-ups</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={generalSettings.allowNewRegistrations}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowNewRegistrations: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password Min Length</label>
          <input
            type="number"
            value={securitySettings.passwordMinLength}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
          <input
            type="number"
            value={securitySettings.maxLoginAttempts}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Lockout Duration (minutes)</label>
          <input
            type="number"
            value={securitySettings.lockoutDuration}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Session Security Level</label>
          <select
            value={securitySettings.sessionSecurityLevel}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionSecurityLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="maximum">Maximum</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'passwordRequireSpecialChars', label: 'Require Special Characters', desc: 'Passwords must contain special characters' },
          { key: 'passwordRequireNumbers', label: 'Require Numbers', desc: 'Passwords must contain numbers' },
          { key: 'passwordRequireUppercase', label: 'Require Uppercase', desc: 'Passwords must contain uppercase letters' },
          { key: 'twoFactorRequired', label: 'Two-Factor Authentication', desc: 'Require 2FA for all users' },
          { key: 'ipWhitelisting', label: 'IP Whitelisting', desc: 'Restrict access to specific IP addresses' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">{setting.label}</label>
              <p className="text-xs text-gray-400">{setting.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings[setting.key]}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>

      {securitySettings.ipWhitelisting && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Allowed IP Addresses</label>
          <textarea
            value={securitySettings.allowedIPs}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, allowedIPs: e.target.value }))}
            placeholder="Enter IP addresses, one per line"
            rows={4}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Data Retention Period (days)</label>
          <input
            type="number"
            value={privacySettings.dataRetentionPeriod}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataRetentionPeriod: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Audit Log Retention (days)</label>
          <input
            type="number"
            value={privacySettings.auditLogRetention}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, auditLogRetention: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">PII Masking Level</label>
          <select
            value={privacySettings.piiMaskingLevel}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, piiMaskingLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="none">No Masking</option>
            <option value="partial">Partial Masking</option>
            <option value="full">Full Masking</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'automaticDataPurging', label: 'Automatic Data Purging', desc: 'Automatically delete old data' },
          { key: 'gdprCompliance', label: 'GDPR Compliance', desc: 'Enable GDPR compliance features' },
          { key: 'dataExportRestrictions', label: 'Data Export Restrictions', desc: 'Restrict data export capabilities' },
          { key: 'anonymizeInactiveUsers', label: 'Anonymize Inactive Users', desc: 'Anonymize data for inactive users' },
          { key: 'consentManagement', label: 'Consent Management', desc: 'Enable user consent tracking' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">{setting.label}</label>
              <p className="text-xs text-gray-400">{setting.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings[setting.key]}
                onChange={(e) => setPrivacySettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeatureFlags = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(featureFlags).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <p className="text-xs text-gray-400">
                {key === 'advancedAnalytics' && 'Enable advanced portfolio analytics'}
                {key === 'aiInsights' && 'AI-powered investment insights'}
                {key === 'socialTrading' && 'Social trading features'}
                {key === 'cryptoSupport' && 'Cryptocurrency trading support'}
                {key === 'optionsTrading' && 'Options trading capabilities'}
                {key === 'marginTrading' && 'Margin trading features'}
                {key === 'paperTrading' && 'Paper trading simulation'}
                {key === 'mobileApp' && 'Mobile application access'}
                {key === 'darkMode' && 'Dark mode interface'}
                {key === 'betaFeatures' && 'Access to beta features'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setFeatureFlags(prev => ({ ...prev, [key]: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'features':
        return renderFeatureFlags();
      default:
        return <div className="text-gray-400">Content for {activeTab} tab</div>;
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
              <p className="text-gray-400">Configure system-wide settings and preferences</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportSettings}
                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Export Settings
              </button>
              <button
                onClick={resetToDefaults}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                <p className="text-gray-400 text-sm">
                  Configure {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} settings
                </p>
              </div>

              {renderTabContent()}

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
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
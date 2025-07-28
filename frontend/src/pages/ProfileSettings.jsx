// src/pages/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import { userService } from '../utils/api';

const ProfileSettings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getProfile();
      
      if (response.success) {
        setProfile(response.data);
        setFormData({
          username: response.data.username,
          email: response.data.email
        });
      } else {
        setError(response.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updates = {};
      if (formData.username !== profile.username) {
        updates.username = formData.username.trim();
      }
      if (formData.email !== profile.email) {
        updates.email = formData.email.trim();
      }

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        return;
      }

      const response = await userService.updateProfile(updates);

      if (response.success) {
        setSuccess('Profile updated successfully');
        // Reload profile to get updated data
        await loadProfile();
      } else {
        setError(response.error || 'Failed to update profile');
      }

    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <GlassmorphicCard>
              <h3 className="text-xl font-semibold text-white mb-6">Account Information</h3>
              
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <GradientButton 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </GradientButton>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        username: profile.username,
                        email: profile.email
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </GlassmorphicCard>
          </div>

          {/* Profile Info Sidebar */}
          <div className="space-y-6">
            
            {/* Account Status */}
            <GlassmorphicCard>
              <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${profile?.isActive ? 'bg-success' : 'bg-error'}`} />
                    <span className={`text-sm ${profile?.isActive ? 'text-success' : 'text-error'}`}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="text-white capitalize">{profile?.role}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white text-sm">
                    {formatDate(profile?.createdAt).split(',')[0]}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Login</span>
                  <span className="text-white text-sm">
                    {profile?.lastLogin ? formatDate(profile.lastLogin).split(',')[0] : 'Never'}
                  </span>
                </div>
              </div>
            </GlassmorphicCard>

            {/* Security Settings */}
            <GlassmorphicCard>
              <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Change Password</p>
                      <p className="text-gray-400 text-sm">Update your account password</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Two-Factor Auth</p>
                      <p className="text-gray-400 text-sm">Enable 2FA for extra security</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-error text-sm">Disabled</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </GlassmorphicCard>

            {/* Preferences */}
            <GlassmorphicCard>
              <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-gray-400 text-sm">Receive portfolio updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Price Alerts</p>
                    <p className="text-gray-400 text-sm">Get notified of price changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Dark Mode</p>
                    <p className="text-gray-400 text-sm">Use dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </GlassmorphicCard>

            {/* Danger Zone */}
            <GlassmorphicCard>
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-400 font-medium">Delete Account</p>
                      <p className="text-gray-400 text-sm">Permanently delete your account</p>
                    </div>
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </button>
              </div>
            </GlassmorphicCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';
import GradientButton from '../GradientButton';
import { notificationsService } from '../../utils/api';

const AlertManager = ({ holdings }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    condition: 'above',
    target_price: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await notificationsService.getAlerts();
      if (response.success) {
        setAlerts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.target_price) {
      return;
    }

    try {
      const response = await notificationsService.createAlert({
        symbol: formData.symbol.toUpperCase(),
        condition: formData.condition,
        target_price: parseFloat(formData.target_price)
      });

      if (response.success) {
        setFormData({ symbol: '', condition: 'above', target_price: '' });
        setShowCreateForm(false);
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      const response = await notificationsService.deleteAlert(alertId);
      if (response.success) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* Create Alert Form */}
      <GlassmorphicCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Price Alerts</h3>
          <GradientButton 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Alert
          </GradientButton>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAlert} className="mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  placeholder="e.g., AAPL"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Price
                </label>
                <input
                  type="number"
                  value={formData.target_price}
                  onChange={(e) => setFormData({...formData, target_price: e.target.value})}
                  placeholder="150.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <GradientButton type="submit" size="sm">
                Create Alert
              </GradientButton>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Quick Alert Suggestions */}
        {holdings.length > 0 && !showCreateForm && (
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-3">Quick alerts for your holdings:</p>
            <div className="flex flex-wrap gap-2">
              {holdings.slice(0, 4).map((holding) => (
                <button
                  key={holding.symbol}
                  onClick={() => {
                    setFormData({
                      symbol: holding.symbol,
                      condition: 'above',
                      target_price: (holding.currentPrice * 1.1).toFixed(2)
                    });
                    setShowCreateForm(true);
                  }}
                  className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {holding.symbol} +10%
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassmorphicCard>

      {/* Active Alerts */}
      <GlassmorphicCard>
        <h3 className="text-xl font-semibold text-white mb-4">Active Alerts</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A1 1 0 002 7.414V11H1V7.414a2 2 0 01.586-1.414l.707-.707a5 5 0 013.535-1.465z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">No active alerts</p>
            <p className="text-gray-500 text-sm mb-4">
              Create price alerts to get notified when your stocks hit target prices
            </p>
            <GradientButton onClick={() => setShowCreateForm(true)} size="sm">
              Create Your First Alert
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    alert.condition === 'above' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        alert.condition === 'above' 
                          ? "M7 11l5-5m0 0l5 5m-5-5v12"
                          : "M17 13l-5 5m0 0l-5-5m5 5V6"
                      } />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {alert.symbol} {alert.condition === 'above' ? 'above' : 'below'} {formatCurrency(alert.target_price)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs ${
                    alert.enabled 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {alert.enabled ? 'Active' : 'Disabled'}
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    title="Delete alert"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
};

export default AlertManager;
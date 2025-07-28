// src/pages/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import { portfolioService, notificationsService } from '../utils/api';
import { getWebSocketClient } from '../utils/websocket';
import { getToken } from '../utils/auth';

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [realTimeUpdates, setRealTimeUpdates] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [showCreateAlert, setShowCreateAlert] = useState(false);
    const [alertForm, setAlertForm] = useState({
        symbol: '',
        condition: 'above',
        target_price: ''
    });

    useEffect(() => {
        loadAnalytics();
        loadAlerts();

        if (realTimeUpdates) {
            setupWebSocket();
        }
    }, [realTimeUpdates]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await portfolioService.getAnalytics();

            if (response.success) {
                setAnalytics(response.data);
                setLastUpdate(new Date());
            } else {
                setError(response.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const loadAlerts = async () => {
        try {
            const response = await notificationsService.getAlerts();
            if (response.success) {
                setAlerts(response.data);
            }
        } catch (error) {
            console.error('Failed to load alerts:', error);
        }
    };

    const setupWebSocket = () => {
        try {
            const token = getToken();
            if (!token) return;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.user_id;

            const wsClient = getWebSocketClient();
            wsClient.connect(userId);

            wsClient.onPortfolioUpdate((update) => {
                console.log('Portfolio update received:', update);
                // Refresh analytics when portfolio updates
                loadAnalytics();
            });

            wsClient.onNotification((notification) => {
                if (notification.type === 'price_alert') {
                    // Refresh alerts when price alert is triggered
                    loadAlerts();
                }
            });

        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    };

    const handleCreateAlert = async (e) => {
        e.preventDefault();

        try {
            const response = await notificationsService.createAlert({
                symbol: alertForm.symbol.toUpperCase(),
                condition: alertForm.condition,
                target_price: parseFloat(alertForm.target_price)
            });

            if (response.success) {
                setAlertForm({ symbol: '', condition: 'above', target_price: '' });
                setShowCreateAlert(false);
                loadAlerts();
            } else {
                setError(response.error || 'Failed to create alert');
            }
        } catch (error) {
            console.error('Failed to create alert:', error);
            setError('Failed to create alert');
        }
    };

    const handleDeleteAlert = async (alertId) => {
        try {
            const response = await notificationsService.deleteAlert(alertId);
            if (response.success) {
                loadAlerts();
            }
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    const getRiskLevelColor = (level) => {
        const colors = {
            'Conservative': 'text-green-400',
            'Moderate': 'text-yellow-400',
            'Aggressive': 'text-orange-400',
            'Very Aggressive': 'text-red-400'
        };
        return colors[level] || 'text-gray-400';
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                Portfolio Analytics
                            </h1>
                            <p className="text-gray-400">
                                Advanced portfolio analysis with real-time market data
                            </p>
                            {lastUpdate && (
                                <p className="text-gray-500 text-sm mt-1">
                                    Last updated: {lastUpdate.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                                className={`px-4 py-2 rounded-lg text-sm transition-all ${realTimeUpdates
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    }`}
                            >
                                {realTimeUpdates ? '🟢 Live' : '⚫ Paused'}
                            </button>
                            <GradientButton onClick={loadAnalytics} size="sm">
                                Refresh
                            </GradientButton>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {analytics && (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                            {/* Overall Score */}
                            <GlassmorphicCard>
                                <div className="text-center">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Portfolio Score</h3>
                                    <div className={`text-3xl font-bold mb-2 ${getScoreColor(analytics.overall_score)}`}>
                                        {analytics.overall_score}/100
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${analytics.overall_score >= 80 ? 'bg-green-500' :
                                                analytics.overall_score >= 60 ? 'bg-yellow-500' :
                                                    analytics.overall_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${analytics.overall_score}%` }}
                                        />
                                    </div>
                                </div>
                            </GlassmorphicCard>

                            {/* Risk Level */}
                            <GlassmorphicCard>
                                <div className="text-center">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Risk Level</h3>
                                    <div className={`text-xl font-bold mb-2 ${getRiskLevelColor(analytics.risk_metrics.risk_level)}`}>
                                        {analytics.risk_metrics.risk_level}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        Score: {analytics.risk_metrics.risk_score}/10
                                    </div>
                                </div>
                            </GlassmorphicCard>

                            {/* Diversification */}
                            <GlassmorphicCard>
                                <div className="text-center">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Diversification</h3>
                                    <div className="text-2xl font-bold text-white mb-2">
                                        {analytics.asset_allocation.diversification_score}/10
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {Object.keys(analytics.asset_allocation.allocation).length} sectors
                                    </div>
                                </div>
                            </GlassmorphicCard>

                            {/* Sharpe Ratio */}
                            <GlassmorphicCard>
                                <div className="text-center">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Sharpe Ratio</h3>
                                    <div className={`text-2xl font-bold mb-2 ${analytics.risk_metrics.sharpe_ratio > 1 ? 'text-green-400' :
                                        analytics.risk_metrics.sharpe_ratio > 0 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {analytics.risk_metrics.sharpe_ratio}
                                    </div>
                                    <div className="text-sm text-gray-400">Risk-adjusted return</div>
                                </div>
                            </GlassmorphicCard>
                        </div>

                        {/* Main Analytics Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                            {/* Asset Allocation */}
                            <GlassmorphicCard>
                                <h3 className="text-xl font-semibold text-white mb-6">Asset Allocation</h3>
                                <div className="space-y-4">
                                    {Object.entries(analytics.asset_allocation.allocation).map(([sector, data]) => (
                                        <div key={sector} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: data.color }}
                                                />
                                                <span className="text-white font-medium">{sector}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-medium">{data.percentage}%</div>
                                                <div className="text-gray-400 text-sm">
                                                    ${data.value.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {analytics.asset_allocation.recommendations.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <h4 className="text-blue-400 font-medium mb-2">Recommendations</h4>
                                        <ul className="space-y-1">
                                            {analytics.asset_allocation.recommendations.map((rec, index) => (
                                                <li key={index} className="text-gray-300 text-sm">• {rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </GlassmorphicCard>

                            {/* Risk Metrics */}
                            <GlassmorphicCard>
                                <h3 className="text-xl font-semibold text-white mb-6">Risk Metrics</h3>
                                <div className="grid grid-cols-2 gap-4">

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.beta}</div>
                                        <div className="text-gray-400 text-sm">Beta</div>
                                    </div>

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.volatility}%</div>
                                        <div className="text-gray-400 text-sm">Volatility</div>
                                    </div>

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.alpha}%</div>
                                        <div className="text-gray-400 text-sm">Alpha</div>
                                    </div>

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.max_drawdown}%</div>
                                        <div className="text-gray-400 text-sm">Max Drawdown</div>
                                    </div>

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.correlation}</div>
                                        <div className="text-gray-400 text-sm">Market Correlation</div>
                                    </div>

                                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{analytics.risk_metrics.var_95}%</div>
                                        <div className="text-gray-400 text-sm">VaR (95%)</div>
                                    </div>
                                </div>

                                {analytics.risk_metrics.recommendations.length > 0 && (
                                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <h4 className="text-yellow-400 font-medium mb-2">Risk Recommendations</h4>
                                        <ul className="space-y-1">
                                            {analytics.risk_metrics.recommendations.map((rec, index) => (
                                                <li key={index} className="text-gray-300 text-sm">• {rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </GlassmorphicCard>
                        </div>

                        {/* Insights and Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Portfolio Insights */}
                            <GlassmorphicCard>
                                <h3 className="text-xl font-semibold text-white mb-6">Portfolio Insights</h3>
                                {analytics.insights.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400">No insights available</div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {analytics.insights.map((insight, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border-l-4 ${insight.type === 'success' ? 'border-l-green-500 bg-green-500/10' :
                                                    insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-500/10' :
                                                        'border-l-red-500 bg-red-500/10'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                                                        <p className="text-gray-300 text-sm">{insight.message}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {insight.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassmorphicCard>

                            {/* Price Alerts */}
                            <GlassmorphicCard>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white">Price Alerts</h3>
                                    <GradientButton
                                        onClick={() => setShowCreateAlert(true)}
                                        size="sm"
                                    >
                                        Add Alert
                                    </GradientButton>
                                </div>

                                {/* Create Alert Form */}
                                {showCreateAlert && (
                                    <form onSubmit={handleCreateAlert} className="mb-6 p-4 bg-slate-800/30 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Symbol (e.g., AAPL)"
                                                value={alertForm.symbol}
                                                onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value })}
                                                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                                                required
                                            />
                                            <select
                                                value={alertForm.condition}
                                                onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                                                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-primary"
                                            >
                                                <option value="above">Above</option>
                                                <option value="below">Below</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                step="0.01"
                                                value={alertForm.target_price}
                                                onChange={(e) => setAlertForm({ ...alertForm, target_price: e.target.value })}
                                                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <GradientButton type="submit" size="sm">Create</GradientButton>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateAlert(false)}
                                                className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Alerts List */}
                                {alerts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400">No price alerts set</div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {alerts.map((alert) => (
                                            <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {alert.symbol} {alert.condition} ${alert.target_price}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {alert.triggered ? 'Triggered' : 'Active'} • {new Date(alert.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAlert(alert.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassmorphicCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
// src/utils/api.ts
// Enhanced API utility functions for Alpha Insights

import { getToken } from './auth';

const API_BASE_URL = 'http://localhost:5000';

// Types
export interface StockQuote {
  symbol: string;
  price: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  previous_close?: number;
  timestamp: string;
  source: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  source: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AIResponse {
  agent: string;
  agent_name?: string;
  response: string;
  confidence: number;
  reasoning: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  condition: 'above' | 'below';
  target_price: number;
  enabled: boolean;
  created_at: string;
  triggered: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Base API class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token && !(headers as Record<string, string>).Authorization) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Initialize API client
const apiClient = new ApiClient(API_BASE_URL);

// Market Data Service
export const marketDataService = {
  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    return apiClient.get<StockQuote>(`/api/stocks/quote/${symbol.toUpperCase()}`);
  },

  async searchStocks(query: string, limit = 10): Promise<ApiResponse<StockSearchResult[]>> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return apiClient.get<StockSearchResult[]>(`/api/stocks/search?${params}`);
  },

  async getHistoricalData(symbol: string, days = 30): Promise<ApiResponse<HistoricalData[]>> {
    const params = new URLSearchParams({ days: days.toString() });
    return apiClient.get<HistoricalData[]>(`/api/stocks/historical/${symbol.toUpperCase()}?${params}`);
  },

  async getMarketStatus(): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/api/market/status');
  },
};

// AI Chat Service with enhanced analytics and memory features
export const aiChatService = {
  async sendMessage(message: string, context?: Record<string, any>): Promise<ApiResponse<AIResponse>> {
    return apiClient.post<AIResponse>('/api/ai/chat', { message, context });
  },

  async getHistory(agent?: string): Promise<ApiResponse<any[]>> {
    const params = agent ? new URLSearchParams({ agent }) : '';
    return apiClient.get<any[]>(`/api/ai/history${params ? `?${params}` : ''}`);
  },

  async clearHistory(agent?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/ai/clear-history', { agent });
  },

  async getAnalytics(): Promise<ApiResponse<{
    user_id: string;
    agent_interactions: any[];
    expertise_levels: Record<string, string>;
    total_conversations: number;
    generated_at: string;
  }>> {
    return apiClient.get('/api/ai/analytics');
  },

  async getSuggestions(currentQuery: string): Promise<ApiResponse<{
    suggestions: string[];
    based_on_query: string;
  }>> {
    return apiClient.post('/api/ai/suggestions', { current_query: currentQuery });
  },

  async exportHistory(agentName?: string): Promise<ApiResponse<{
    user_id: string;
    agent_name?: string;
    conversations: any[];
    total_count: number;
    exported_at: string;
  }>> {
    const params = agentName ? `?agent_name=${encodeURIComponent(agentName)}` : '';
    return apiClient.get(`/api/ai/export-history${params}`);
  },

  async getConversationFlow(sessionId?: string): Promise<ApiResponse<{
    user_id: string;
    session_id?: string;
    agent_sequence: any[];
    handoff_events: any[];
    agent_durations: Record<string, number>;
    total_conversations: number;
    unique_agents: number;
    analysis_timestamp: string;
  }>> {
    const params = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    return apiClient.get(`/api/ai/conversation-flow${params}`);
  },
};

// Portfolio Service - Enhanced with Real-Time Market Data
export const portfolioService = {
  async getPortfolioSummary(): Promise<ApiResponse<{
    totalValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    cashBalance: number;
    holdings: any[];
    performance: any[];
  }>> {
    return apiClient.get('/api/portfolio');
  },

  async getRealTimePortfolio(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/portfolio/real-time');
  },

  async getHoldings(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/api/portfolio/holdings');
  },

  async getRealTimeHoldings(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/api/portfolio/holdings/real-time');
  },

  async getActivity(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/api/portfolio/activity');
  },

  async getPerformance(timeframe = '6M'): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ timeframe });
    return apiClient.get(`/api/portfolio/performance?${params}`);
  },

  async getAnalytics(): Promise<ApiResponse<{
    asset_allocation: any;
    risk_metrics: any;
    insights: any[];
    overall_score: number;
  }>> {
    return apiClient.get('/api/portfolio/analytics');
  },

  async getAssetAllocation(): Promise<ApiResponse<{
    allocation: any;
    total_value: number;
    diversification_score: number;
    recommendations: string[];
  }>> {
    return apiClient.get('/api/portfolio/asset-allocation');
  },

  async getRiskMetrics(period = 252): Promise<ApiResponse<{
    beta: number;
    sharpe_ratio: number;
    volatility: number;
    alpha: number;
    correlation: number;
    max_drawdown: number;
    var_95: number;
    risk_score: number;
    risk_level: string;
    recommendations: string[];
  }>> {
    const params = new URLSearchParams({ period: period.toString() });
    return apiClient.get(`/api/portfolio/risk-metrics?${params}`);
  },

  async getRiskAnalysis(): Promise<ApiResponse<{
    riskScore: number;
    volatility: number;
    sharpeRatio: number;
    beta: number;
    diversificationScore: number;
    recommendations: string[];
  }>> {
    return apiClient.get('/api/portfolio/risk-analysis');
  },
};

// Transaction Service - New Database-Driven Service
export const transactionService = {
  async createTransaction(transaction: {
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
  }): Promise<ApiResponse<{ message: string; transaction_id: string }>> {
    return apiClient.post('/api/transactions', transaction);
  },

  async updateTransaction(transactionId: string, updates: {
    symbol?: string;
    type?: 'buy' | 'sell';
    shares?: number;
    price?: number;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put(`/api/transactions/${transactionId}`, updates);
  },

  async deleteTransaction(transactionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/transactions/${transactionId}`);
  },
};

// Education Service - New Database-Driven Service
export const educationService = {
  async getArticles(category?: string): Promise<ApiResponse<{
    id: string;
    title: string;
    summary: string;
    category: string;
    createdAt: string;
    updatedAt: string;
  }[]>> {
    const params = category ? new URLSearchParams({ category }) : '';
    return apiClient.get(`/api/education/articles${params ? `?${params}` : ''}`);
  },

  async getArticle(articleId: string): Promise<ApiResponse<{
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    return apiClient.get(`/api/education/articles/${articleId}`);
  },
};

// User Profile Service - New Database-Driven Service
export const userService = {
  async getProfile(): Promise<ApiResponse<{
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    lastLogin: string | null;
    isActive: boolean;
  }>> {
    return apiClient.get('/api/user/profile');
  },

  async updateProfile(updates: {
    username?: string;
    email?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put('/api/user/profile', updates);
  },
};

// Notifications Service
export const notificationsService = {
  async getAlerts(): Promise<ApiResponse<PriceAlert[]>> {
    return apiClient.get<PriceAlert[]>('/api/notifications/alerts');
  },

  async createAlert(alertConfig: {
    symbol: string;
    condition: 'above' | 'below';
    target_price: number;
  }): Promise<ApiResponse<{ alert_id: string }>> {
    return apiClient.post<{ alert_id: string }>('/api/notifications/alerts', alertConfig);
  },

  async deleteAlert(alertId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/notifications/alerts/${alertId}`);
  },
};

// Auth Service
export const authService = {
  async signup(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ message: string; user_id: string }>> {
    return apiClient.post<{ message: string; user_id: string }>('/signup', userData);
  },

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ message: string; token: string; user: any }>> {
    return apiClient.post<{ message: string; token: string; user: any }>('/login', credentials);
  },
};

// Legacy API for backward compatibility
export const api = {
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async get(endpoint: string, token?: string | null) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers });
  },

  async put(endpoint: string, data: any, token?: string | null) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string, token?: string | null) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
  }
};
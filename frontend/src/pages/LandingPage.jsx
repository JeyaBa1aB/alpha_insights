// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        
        {/* Animated Geometric Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-xl animate-float" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-40 right-1/3 w-72 h-72 bg-primary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" 
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '50px 50px'
               }} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto animate-fade-in">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 animate-slide-up">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-300">
              AI-Powered Portfolio Management
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">Alpha Insights</span>
            <br />
            <span className="text-white">Portfolio Tracker</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Experience the future of investment management with real-time market data, 
            AI-driven insights, and a beautiful glassmorphic interface designed for modern investors.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup" className="btn-primary text-lg px-8 py-4 no-underline">
              Get Started Free
            </Link>
            <Link to="/education" className="btn-secondary text-lg px-8 py-4 no-underline">
              Learn More
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
          
          {/* Portfolio Dashboard Card */}
          <div className="glass-card glass-card-hover p-8 text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Portfolio Dashboard</h3>
            <p className="text-gray-300 leading-relaxed">
              Track your investments with beautiful, interactive charts and real-time performance metrics.
            </p>
          </div>

          {/* AI Chat Agents Card */}
          <div className="glass-card glass-card-hover p-8 text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">AI Chat Agents</h3>
            <p className="text-gray-300 leading-relaxed">
              Get instant answers and insights from our multi-agent AI system designed for financial guidance.
            </p>
          </div>

          {/* Stock Research Card */}
          <div className="glass-card glass-card-hover p-8 text-center group md:col-span-2 lg:col-span-1">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Stock Research</h3>
            <p className="text-gray-300 leading-relaxed">
              Analyze stocks with comprehensive metrics and add promising investments to your portfolio.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">10K+</div>
            <div className="text-gray-400 text-sm">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">$2.5B+</div>
            <div className="text-gray-400 text-sm">Assets Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">99.9%</div>
            <div className="text-gray-400 text-sm">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">24/7</div>
            <div className="text-gray-400 text-sm">AI Support</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <p className="text-gray-400 mb-6">Ready to transform your investment journey?</p>
          <Link to="/signup" className="btn-primary text-lg px-8 py-4 no-underline">
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

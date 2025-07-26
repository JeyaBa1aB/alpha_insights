// src/pages/LandingPage.tsx
import React from 'react';
// For 3D background, you can use three.js or a CSS/Canvas effect. Here is a placeholder for integration.

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700 overflow-hidden">
      {/* Animated 3D background placeholder */}
      <div className="absolute inset-0 z-0">
        {/* TODO: Integrate Three.js or CSS/Canvas 3D animation here */}
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-700 opacity-60 blur-2xl animate-pulse" />
      </div>
      <div className="relative z-10 text-center p-8">
        <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">Welcome to Alpha Insights</h1>
        <p className="text-xl text-white/80 mb-8">AI-powered portfolio management, real-time analytics, and multi-agent chat.</p>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-6 shadow-lg w-64">
            <h2 className="text-lg font-bold text-white mb-2">Portfolio Dashboard</h2>
            <p className="text-white/70">Track your investments and performance with interactive charts.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-6 shadow-lg w-64">
            <h2 className="text-lg font-bold text-white mb-2">AI Chat Agents</h2>
            <p className="text-white/70">Get instant answers and insights from multiple AI agents.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-6 shadow-lg w-64">
            <h2 className="text-lg font-bold text-white mb-2">Stock Research</h2>
            <p className="text-white/70">Analyze stocks, metrics, and add to your portfolio easily.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

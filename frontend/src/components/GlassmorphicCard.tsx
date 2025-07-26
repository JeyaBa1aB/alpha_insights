import React from 'react';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/20 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 p-6 ${className}`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassmorphicCard;

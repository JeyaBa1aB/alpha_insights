import React from 'react';

const GlassmorphicCard = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  style
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = `glass-card ${paddingClasses[padding]}`;
  const hoverClasses = hover ? 'glass-card-hover' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} style={style}>
      {children}
    </div>
  );
};

export default GlassmorphicCard;

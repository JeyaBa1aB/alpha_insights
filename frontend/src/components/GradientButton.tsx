import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition-all hover:scale-105 hover:from-indigo-600 hover:to-pink-600 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GradientButton;

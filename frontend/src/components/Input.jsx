import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 mb-4 ${className}`}>
    {label && <label className="text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <input
      className="bg-slate-800 text-white font-inter rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400"
      {...props}
    />
  </div>
);

interface FormProps {
  children: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit, className = '' }) => (
  <form className={`bg-slate-900/80 rounded-xl p-6 shadow-lg ${className}`} onSubmit={onSubmit}>
    {children}
  </form>
);

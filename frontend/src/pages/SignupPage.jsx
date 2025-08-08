// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const SignupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/signup', { username, email, password });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        // Redirect to login page after successful signup
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form
        className="backdrop-blur-lg bg-slate-800/50 rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-700/50"
        onSubmit={handleSubmit}
      >
        <div className="text-center mb-8">
          <img 
            src="/alpha-insights-logo.png" 
            alt="Alpha Insights" 
            className="h-16 w-16 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-white">Join Alpha Insights</h2>
          <p className="text-gray-400 text-sm mt-2">Create your account to start investing</p>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          required
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <button
          type="submit"
          className="w-full py-3 rounded bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow transition-colors"
        >
          Sign Up
        </button>

        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;

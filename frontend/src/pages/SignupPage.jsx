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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <form
        className="backdrop-blur-lg bg-white/20 rounded-xl shadow-lg p-8 w-full max-w-md border border-white/30"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-white">Sign Up</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-white/40 text-black placeholder-gray-600"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-white/40 text-black placeholder-gray-600"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-white/40 text-black placeholder-gray-600"
          required
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <button
          type="submit"
          className="w-full py-3 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow"
        >
          Sign Up
        </button>
        
        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-300 hover:text-yellow-100 underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;

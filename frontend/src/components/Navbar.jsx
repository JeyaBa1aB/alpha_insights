import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="container mx-auto flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
        <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-white">
          Alpha Insights
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/portfolio" className="text-sm text-gray-300 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link to="/research" className="text-sm text-gray-300 hover:text-white transition-colors">
                Research
              </Link>
              <Link to="/notifications" className="text-sm text-gray-300 hover:text-white transition-colors">
                Notifications
              </Link>
              <Link to="/education" className="text-sm text-gray-300 hover:text-white transition-colors">
                Education
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="text-sm text-yellow-400 hover:text-white transition-colors">
                  Admin
                </Link>
              )}
              <Link to="/settings" className="text-sm text-gray-300 hover:text-white transition-colors">
                Settings
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/education" className="text-sm text-gray-300 hover:text-white transition-colors">
                Education
              </Link>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
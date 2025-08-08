import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin users should only access admin routes
  if (user.role === 'admin') {
    const isAdminRoute = location.pathname.startsWith('/admin');
    if (!isAdminRoute) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // Regular users should not access admin routes
  if (user.role !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
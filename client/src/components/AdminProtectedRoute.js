import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import LoadingSpinner from './LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, loading } = useAdmin();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;

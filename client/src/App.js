import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { AdminProvider } from './context/AdminContext';
import Login from './pages/Login';
import Home from './pages/Home';
import StudyContent from './pages/StudyContent';
import UserProfile from './pages/UserProfile';
import ContentUpload from './pages/ContentUpload';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminContentEdit from './pages/AdminContentEdit';
import AdminContentView from './pages/AdminContentView';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminProvider>
      <SearchProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Only show user navbar for non-admin routes and authenticated users */}
          {!isAdminRoute && isAuthenticated && <Navbar />}

          <Routes>
            {/* Regular User Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/study/:category"
              element={
                <ProtectedRoute>
                  <StudyContent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Upload route removed - now admin-only */}

            {/* Admin Routes */}
            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />

            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />

            <Route
              path="/admin/content/edit/:id"
              element={
                <AdminProtectedRoute>
                  <AdminContentEdit />
                </AdminProtectedRoute>
              }
            />

            <Route
              path="/admin/content/view/:id"
              element={
                <AdminProtectedRoute>
                  <AdminContentView />
                </AdminProtectedRoute>
              }
            />

            <Route
              path="/admin/upload"
              element={
                <AdminProtectedRoute>
                  <ContentUpload />
                </AdminProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </SearchProvider>
    </AdminProvider>
  );
}

export default App;

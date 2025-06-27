import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/admin/verify');
        setAdminUser(response.data.admin);
        setIsAdminAuthenticated(true);
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (credentials) => {
    try {
      const response = await axios.post('/api/admin/login', credentials);
      const { token, admin } = response.data;
      
      localStorage.setItem('adminToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setAdminUser(admin);
      setIsAdminAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        adminUser,
        loading,
        adminLogin,
        adminLogout,
        checkAdminAuth
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

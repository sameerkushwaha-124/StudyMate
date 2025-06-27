import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { FiShield, FiLogOut, FiHome, FiSettings, FiUser, FiChevronDown } from 'react-icons/fi';

const AdminNavbar = () => {
  const { adminUser, adminLogout } = useAdmin();
  const location = useLocation();
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    adminLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gradient-to-r from-red-600 to-pink-600 shadow-lg border-b border-red-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Admin Logo */}
          <Link to="/admin/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20">
                <FiShield className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">
              Admin Portal
            </span>
          </Link>

          {/* Admin Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/admin/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/admin/dashboard')
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <FiHome className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/upload"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/admin/upload')
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <FiSettings className="h-4 w-4" />
              <span>Upload Content</span>
            </Link>
          </div>

          {/* Admin User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <FiUser className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Admin</span>
              <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Admin Dropdown */}
            {isAdminDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <FiShield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold truncate">{adminUser?.name || 'Admin'}</p>
                      <p className="text-gray-500 text-sm truncate">Administrator</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsAdminDropdownOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

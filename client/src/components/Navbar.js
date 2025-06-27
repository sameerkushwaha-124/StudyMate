import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUpload, FiLogOut, FiBook, FiUser, FiChevronDown } from 'react-icons/fi';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <FiBook className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              StudyMate
            </span>
          </Link>

          {/* Navigation Links & Search */}
          <div className="flex items-center space-x-6">
            {/* Global Search */}
            <GlobalSearch />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`nav-item ${isActive('/') ? 'active' : ''}`}
              >
                <FiHome className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            >
              <FiUser className="h-5 w-5" />
              <span className="hidden md:inline font-medium">Account</span>
              <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium User Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 z-50">
                <div className="px-6 py-4 border-b border-gray-100/50">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-sm opacity-30"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold truncate text-lg">{user?.username}</p>
                      <p className="text-gray-500 text-sm truncate" title={user?.email}>{user?.email}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-2 py-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-1 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium">Account Settings</span>
                      <p className="text-xs text-gray-500">Manage your profile</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-1 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                      <FiLogOut className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <span className="font-medium">Sign Out</span>
                      <p className="text-xs text-gray-500">End your session</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="px-4 py-4 space-y-2">
          <Link
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            <FiHome className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            to="/upload"
            className={`nav-item ${isActive('/upload') ? 'active' : ''}`}
          >
            <FiUpload className="h-5 w-5" />
            <span>Upload Content</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

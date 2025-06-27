import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminNavbar from '../components/AdminNavbar';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiEye,
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiMoreVertical,
  FiRefreshCw,
  FiCalendar,
  FiGlobe,
  FiShield
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { adminUser } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stats, setStats] = useState({
    totalContent: 0,
    dsaContent: 0,
    oopContent: 0,
    totalTopics: 0
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0
  });

  useEffect(() => {
    fetchContent();
    fetchStats();
    fetchPendingUsers();
    fetchAllUsers();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get('/api/content');
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/content');
      const data = response.data;
      
      const dsaCount = data.filter(item => item.category === 'DSA').length;
      const oopCount = data.filter(item => item.category === 'OOP').length;
      const uniqueTopics = [...new Set(data.map(item => item.subTopic))].length;
      
      setStats({
        totalContent: data.length,
        dsaContent: dsaCount,
        oopContent: oopCount,
        totalTopics: uniqueTopics
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await axios.delete(`/api/content/${id}`);
        toast.success('Content deleted successfully');
        fetchContent();
        fetchStats();
      } catch (error) {
        console.error('Error deleting content:', error);
        toast.error('Failed to delete content');
      }
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subTopic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // User Management Functions
  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('/api/users/pending');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api/users/all');
      setAllUsers(response.data);

      // Calculate user stats
      const stats = {
        totalUsers: response.data.length,
        pendingUsers: response.data.filter(u => u.approvalStatus === 'pending').length,
        approvedUsers: response.data.filter(u => u.approvalStatus === 'approved').length,
        rejectedUsers: response.data.filter(u => u.approvalStatus === 'rejected').length
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchPendingUsers();
      fetchAllUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId, reason = '') => {
    if (window.confirm('⚠️ REJECT USER: This will mark the user as rejected. They cannot login but their data stays in the database. Are you sure?')) {
      try {
        await axios.put(`/api/users/${userId}/reject`, { reason });
        toast.success('User rejected successfully. User cannot login but data remains in database.');
        fetchPendingUsers();
        fetchAllUsers();
      } catch (error) {
        console.error('Error rejecting user:', error);
        toast.error('Failed to reject user');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ DELETE USER: This will permanently remove the user and all their data from the database. User can register again later if admin permits. Are you sure?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        toast.success('User deleted successfully. User data completely removed from database.');
        fetchAllUsers();
        fetchPendingUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };



  const StatCard = ({ title, value, icon: Icon, gradient, trend }) => (
    <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 rounded-2xl`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className="flex items-center space-x-1 text-green-600">
              <FiTrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+{trend}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-b-2xl opacity-60`}></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Admin Navbar */}
      <AdminNavbar />

      {/* Premium Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                      <FiShield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Admin Portal
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Content Management System</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <FiActivity className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">System Online</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <FiClock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Admin Profile */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {adminUser?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{adminUser?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Navigation Tabs */}
      <div className="relative bg-white/60 backdrop-blur-xl border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: FiBarChart2, color: 'from-blue-500 to-cyan-500' },
              { id: 'content', label: 'Content', icon: FiFileText, color: 'from-green-500 to-emerald-500' },
              { id: 'users', label: 'Users', icon: FiUsers, color: 'from-purple-500 to-pink-500' },
              { id: 'settings', label: 'Settings', icon: FiSettings, color: 'from-orange-500 to-red-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-3 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-${tab.color.split('-')[1]}-500/25`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 backdrop-blur-sm'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                )}
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : ''}`} />
                <span className="relative font-semibold">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Premium Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-indigo-50/30 pointer-events-none"></div>
        <div className="relative">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Content"
                value={stats.totalContent}
                icon={FiFileText}
                gradient="from-blue-500 to-cyan-500"
                trend="12"
              />
              <StatCard
                title="DSA Problems"
                value={stats.dsaContent}
                icon={FiBarChart2}
                gradient="from-green-500 to-emerald-500"
                trend="8"
              />
              <StatCard
                title="OOP Content"
                value={stats.oopContent}
                icon={FiGlobe}
                gradient="from-purple-500 to-pink-500"
                trend="15"
              />
              <StatCard
                title="Unique Topics"
                value={stats.totalTopics}
                icon={FiSettings}
                gradient="from-orange-500 to-red-500"
                trend="5"
              />
            </div>

            {/* Premium Quick Actions */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FiClock className="h-4 w-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => navigate('/admin/upload')}
                    className="group relative bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        <FiPlus className="h-6 w-6" />
                      </div>
                      <span className="font-semibold">Add Content</span>
                      <span className="text-xs opacity-80">Create new study material</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('content')}
                    className="group relative bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        <FiEdit3 className="h-6 w-6" />
                      </div>
                      <span className="font-semibold">Manage Content</span>
                      <span className="text-xs opacity-80">Edit existing materials</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className="group relative bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        <FiUsers className="h-6 w-6" />
                      </div>
                      <span className="font-semibold">User Management</span>
                      <span className="text-xs opacity-80">Approve & manage users</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Content Management Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
              <button
                onClick={() => navigate('/admin/upload')}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Add New Content
              </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-gray-400 h-5 w-5" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="DSA">DSA</option>
                    <option value="OOP">OOP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                            <span className="ml-2">Loading content...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredContent.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No content found
                        </td>
                      </tr>
                    ) : (
                      filteredContent.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.category === 'DSA' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.subTopic}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.difficulty && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.difficulty}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/admin/content/view/${item._id}`)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/content/edit/${item._id}`)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                title="Edit"
                              >
                                <FiEdit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Premium User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={userStats.totalUsers}
                icon={FiUsers}
                gradient="from-blue-500 to-cyan-500"
                trend="18"
              />
              <StatCard
                title="Pending Approval"
                value={userStats.pendingUsers}
                icon={FiClock}
                gradient="from-yellow-500 to-orange-500"
              />
              <StatCard
                title="Approved Users"
                value={userStats.approvedUsers}
                icon={FiCheckCircle}
                gradient="from-green-500 to-emerald-500"
                trend="25"
              />
              <StatCard
                title="Rejected Users"
                value={userStats.rejectedUsers}
                icon={FiXCircle}
                gradient="from-red-500 to-pink-500"
              />
            </div>

            {/* Pending Users Section */}
            {pendingUsers.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiUsers className="mr-3 text-yellow-500" />
                  Pending User Approvals ({pendingUsers.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('⚠️ REJECT USER: User will be marked as rejected and cannot login, but data stays in database.\nRejection reason (optional):');
                                if (reason !== null) { // User didn't cancel
                                  handleRejectUser(user._id, reason);
                                }
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                              title="Reject user - blocks login but keeps data in database"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                              title="⚠️ DELETE: Permanently removes user data from database"
                            >
                              Delete
                            </button>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Users Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FiUsers className="mr-3 text-blue-500" />
                All Users ({allUsers.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            user.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.approvalStatus.charAt(0).toUpperCase() + user.approvalStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {user.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('⚠️ REJECT USER: User will be marked as rejected and cannot login, but data stays in database.\nRejection reason (optional):');
                                  if (reason !== null) { // User didn't cancel
                                    handleRejectUser(user._id, reason);
                                  }
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                title="Reject user - blocks login but keeps data in database"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                title="⚠️ DELETE: Permanently removes user data from database"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {user.approvalStatus === 'approved' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                              title="⚠️ DELETE: Permanently removes user data from database"
                            >
                              Delete
                            </button>
                          )}
                          {user.approvalStatus === 'rejected' && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                title="Approve rejected user"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                title="⚠️ DELETE: Permanently removes user data from database"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

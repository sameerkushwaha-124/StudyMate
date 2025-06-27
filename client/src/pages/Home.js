import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCode,
  FiDatabase,
  FiArrowRight,
  FiTrendingUp,
  FiBookOpen,
  FiTarget,
  FiAward,
  FiClock,
  FiUser,
  FiActivity,
  FiStar,
  FiZap,
  FiHeart,
  FiGlobe,
  FiShield
} from 'react-icons/fi';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    oopCount: 0,
    dsaCount: 0,
    totalContent: 0
  });
  const [progressStats, setProgressStats] = useState({
    totalContent: 0,
    completedContent: 0,
    overallProgress: 0,
    dsaContent: 0,
    completedDSA: 0,
    dsaProgress: 0,
    oopContent: 0,
    completedOOP: 0,
    oopProgress: 0,
    completedSubtopicsCount: 0,
    learningStreak: 0,
    lastActivity: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchProgressStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/content/categories');
      const categories = response.data;
      
      let oopCount = 0;
      let dsaCount = 0;
      
      categories.forEach(category => {
        if (category._id === 'OOP') {
          oopCount = category.subTopics.reduce((sum, topic) => sum + topic.count, 0);
        } else if (category._id === 'DSA') {
          dsaCount = category.subTopics.reduce((sum, topic) => sum + topic.count, 0);
        }
      });

      setStats({
        oopCount,
        dsaCount,
        totalContent: oopCount + dsaCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressStats = async () => {
    try {
      const response = await axios.get('/api/progress/stats');
      setProgressStats(response.data);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    }
  };

  const categories = [
    {
      id: 'oop',
      title: 'Object-Oriented Programming',
      description: 'Master the fundamentals of OOP concepts, design patterns, and best practices',
      icon: FiCode,
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      count: stats.oopCount,
      topics: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Design Patterns']
    },
    {
      id: 'dsa',
      title: 'Data Structures & Algorithms',
      description: 'Explore efficient data structures and algorithmic problem-solving techniques',
      icon: FiDatabase,
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      count: stats.dsaCount,
      topics: ['Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Sorting & Searching', 'Dynamic Programming', 'Recursion']
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="text-white">Welcome back,</span>
                <br />
                <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent animate-pulse">
                  {user?.username}!
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Continue your learning journey with beautifully organized study materials
              </p>
            </div>

            {/* Enhanced Stats */}
            <div className="flex justify-center space-x-12 mt-12">
              <div className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
                    <div className="text-4xl font-bold text-white">{stats.totalContent}</div>
                    <div className="text-blue-200 font-medium">Total Topics</div>
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
                    <div className="text-4xl font-bold text-white">2</div>
                    <div className="text-blue-200 font-medium">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Study Path
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Dive into expertly organized study materials designed to accelerate your learning
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.id}
                to={`/study/${category.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  {/* Card Content */}
                  <div className="relative p-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                        <div className={`relative ${category.iconBg} p-5 rounded-2xl shadow-lg`}>
                          <IconComponent className={`h-10 w-10 ${category.iconColor}`} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{category.count}</div>
                        <div className="text-sm text-gray-500 font-medium">Topics</div>
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {category.title}
                    </h3>

                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-8">
                      {category.topics.slice(0, 4).map((topic, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm rounded-full font-medium hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-700 transition-all duration-200"
                        >
                          {topic}
                        </span>
                      ))}
                      {category.topics.length > 4 && (
                        <span className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 text-sm rounded-full font-medium">
                          +{category.topics.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-indigo-600 font-semibold text-lg group-hover:text-purple-600 transition-colors">
                        <span>Start Learning</span>
                        <FiArrowRight className="ml-3 h-5 w-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <FiArrowRight className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Premium Learning Dashboard */}
        <div className="space-y-12">
          {/* Learning Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <FiBookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <FiTrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+15%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Study Progress</p>
                  <p className="text-3xl font-bold text-gray-900">{progressStats.overallProgress}%</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-b-2xl opacity-60"></div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <FiTarget className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <FiTrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+8%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Topics Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{progressStats.completedSubtopicsCount}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-b-2xl opacity-60"></div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <FiAward className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <FiTrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Learning Streak</p>
                  <p className="text-3xl font-bold text-gray-900">{progressStats.learningStreak} days</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-b-2xl opacity-60"></div>
              </div>
            </div>
          </div>

          {/* Premium Learning Journey */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 mr-3">
                    <FiActivity className="h-6 w-6 text-white" />
                  </div>
                  Your Learning Journey
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FiClock className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-4 shadow-lg">
                      <FiCode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">OOP Mastery</h4>
                      <p className="text-sm text-gray-600">Object-Oriented Programming</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-blue-600">{progressStats.oopProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: `${progressStats.oopProgress}%`}}></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{progressStats.completedOOP} of {progressStats.oopContent} completed</p>
                </div>

                <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-4 shadow-lg">
                      <FiDatabase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">DSA Excellence</h4>
                      <p className="text-sm text-gray-600">Data Structures & Algorithms</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-green-600">{progressStats.dsaProgress}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: `${progressStats.dsaProgress}%`}}></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{progressStats.completedDSA} of {progressStats.dsaContent} completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Quick Actions */}
        <div className="mt-16 relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl"></div>
          <div className="relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Continue Learning?</h3>
              <p className="text-gray-600">Pick up where you left off or explore new topics</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={`/study/${category.id}`}
                    className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          Continue {category.title.split(' ')[0]}
                        </h4>
                        <p className="text-sm text-gray-600">{category.count} topics available</p>
                      </div>
                      <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-lg">
            <FiStar className="h-5 w-5" />
            <span className="font-semibold">Keep up the great work! You're on fire! 🔥</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;

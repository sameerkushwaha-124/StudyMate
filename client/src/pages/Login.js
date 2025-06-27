import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiClock } from 'react-icons/fi';

const Login = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [registrationPending, setRegistrationPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const { username, email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      login({ email, password });
    } else {
      const result = await register({ username, email, password });
      if (result && result.success) {
        setRegistrationPending(true);
        setPendingMessage(result.message);
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: ''
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <FiBook className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">StudyMate</h1>
          <p className="text-gray-300">
            {isLogin
              ? 'Sign in to access your study materials'
              : 'Create your account and start learning'
            }
          </p>
        </div>

        {/* Pending Approval Message */}
        {registrationPending && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Registration Successful!</h3>
              <p className="text-gray-300 mb-4">{pendingMessage}</p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-200">
                  <strong>What happens next?</strong><br />
                  • An admin will review your registration<br />
                  • You'll receive approval to access the platform<br />
                  • Once approved, you can login with your credentials
                </p>
              </div>
              <button
                onClick={() => {
                  setRegistrationPending(false);
                  setIsLogin(true);
                }}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!registrationPending && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <form className="space-y-6" onSubmit={onSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required={!isLogin}
                    value={username}
                    onChange={onChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={onChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={onChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                {isLogin ? 'Sign in to StudyMate' : 'Create your account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-300">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {isLogin ? 'Create new account' : 'Sign in instead'}
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Secure • Private • Personalized Learning Experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

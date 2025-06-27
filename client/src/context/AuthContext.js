import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  console.log('Auth reducer called with action:', action.type, action.payload);
  console.log('Current state:', state);

  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'REGISTER_SUCCESS':
      // For pending registrations, don't authenticate the user
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          ...action.payload,
          isAuthenticated: true,
          loading: false,
        };
      } else {
        // Registration successful but pending approval - don't authenticate
        return {
          ...state,
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null
        };
      }
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      // Clear token from localStorage and axios headers
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  };

  // Load user
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    console.log('Loading user, token in localStorage:', token);
    if (token) {
      setAuthToken(token);

      try {
        const res = await axios.get('/api/auth/me');
        console.log('User loaded successfully:', res.data);

        // Check if response contains user data
        if (!res.data) {
          console.log('No user data received, user may be deleted');
          dispatch({ type: 'AUTH_ERROR' });
          return;
        }

        dispatch({
          type: 'USER_LOADED',
          payload: res.data,
        });
      } catch (err) {
        console.error('Error loading user:', err);

        // Handle specific error cases
        if (err.response?.status === 401) {
          console.log('User not found or token invalid - forcing logout');
          toast.error('Your account was not found. Please login again.');
        } else if (err.response?.status === 403) {
          console.log('User access revoked');
          toast.error(err.response.data.message || 'Account access revoked.');
        }

        dispatch({ type: 'AUTH_ERROR' });
      }
    } else {
      console.log('No token found, dispatching AUTH_ERROR');
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);

      // No token is returned for pending users, just show success message
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data,
      });

      // Show the pending approval message
      toast.success(res.data.message || 'Registration successful! Your account is pending admin approval.');

      return { success: true, message: res.data.message };
    } catch (err) {
      const error = err.response?.data?.message || 'Registration failed';
      toast.error(error);
      dispatch({
        type: 'REGISTER_FAIL',
        payload: error,
      });
      return { success: false, error };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      console.log('Attempting login with:', formData);
      const res = await axios.post('/api/auth/login', formData);
      console.log('Login response:', res.data);

      // Set the token in axios headers immediately
      setAuthToken(res.data.token);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Login successful!');
      console.log('Login successful, state should be updated');
    } catch (err) {
      console.error('Login error:', err);
      const error = err.response?.data?.message || 'Login failed';
      toast.error(error);
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error,
      });
    }
  };

  // Logout
  const logout = () => {
    // Clear token from axios headers
    setAuthToken(null);

    // Clear all localStorage data
    localStorage.removeItem('token');

    // Dispatch logout action
    dispatch({ type: 'LOGOUT' });

    toast.info('Logged out successfully');
  };

  useEffect(() => {
    loadUser();

    // Set up axios interceptor to handle authentication errors globally
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Only auto-logout if the error is from a protected route (not login/register)
          const isAuthRoute = error.config?.url?.includes('/auth/login') ||
                             error.config?.url?.includes('/auth/register');

          if (!isAuthRoute && state.isAuthenticated) {
            console.log('Authentication error detected, logging out user');
            dispatch({ type: 'AUTH_ERROR' });
            toast.error('Session expired. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

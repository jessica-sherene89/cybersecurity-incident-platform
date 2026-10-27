import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('cyber_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cyber_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !!localStorage.getItem('cyber_token'));

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      const currentToken = localStorage.getItem('cyber_token');
      if (!currentToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const currentUser = res.data.user || res.data.data;
          if (isMounted) {
            setUser(currentUser);
            setToken(currentToken);
          }
          localStorage.setItem('cyber_user', JSON.stringify(currentUser));
        } else {
          if (isMounted) {
            logout();
          }
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        // Only invalidate credentials if server explicitly refused authorization (401 or 403)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          if (isMounted) {
            logout();
          }
        }
        // For network errors or backend restarts, retain local user/token so refresh doesn't destroy session
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const receivedToken = res.data.token || res.data.data?.token;
      const receivedUser = res.data.user || res.data.data?.user;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('cyber_token', receivedToken);
      localStorage.setItem('cyber_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const receivedToken = res.data.token || res.data.data?.token;
      const receivedUser = res.data.user || res.data.data?.user;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('cyber_token', receivedToken);
      localStorage.setItem('cyber_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cyber_token');
    localStorage.removeItem('cyber_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: (user?.role || '').toLowerCase() === 'admin',
    isAnalyst: ['analyst', 'admin'].includes((user?.role || '').toLowerCase()),
    isUser: (user?.role || '').toLowerCase() === 'user',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

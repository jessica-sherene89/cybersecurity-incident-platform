import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer token into every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cyber_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthLogin = url.includes('/auth/login');
    const isAuthRegister = url.includes('/auth/register');
    const isAuthMe = url.includes('/auth/me');

    // Only handle session expiration for normal API requests, not auth/login/register/me
    if (error.response && error.response.status === 401 && !isAuthLogin && !isAuthRegister && !isAuthMe) {
      localStorage.removeItem('cyber_token');
      localStorage.removeItem('cyber_user');
      if (window.location.pathname !== '/login') {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

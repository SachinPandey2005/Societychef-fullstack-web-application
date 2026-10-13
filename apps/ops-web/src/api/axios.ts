import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? 'http://localhost:8080/api/v1' : 'https://societychef-1.onrender.com/api/v1');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT and security headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers['X-Request-Timestamp'] = Date.now().toString();
      config.headers['X-Request-Nonce'] = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized access
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/admin-login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

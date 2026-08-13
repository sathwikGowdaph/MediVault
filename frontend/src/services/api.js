import axios from 'axios';

/**
 * Configured axios instance with auth interceptors.
 * - Automatically attaches Authorization header from localStorage
 * - On 401 response (for protected routes): attempts token refresh via /api/auth/refresh
 * - Auth endpoints (/login, /register, etc.) skip token refresh on 401 to preserve error toasts.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Required for cookie-based refresh token
  timeout: 30000
});

// ─── Request Interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Skip refresh interceptor for authentication endpoints
    const isAuthEndpoint = original?.url?.includes('/api/auth/login') ||
                           original?.url?.includes('/api/auth/register') ||
                           original?.url?.includes('/api/auth/forgot-password') ||
                           original?.url?.includes('/api/auth/reset-password') ||
                           original?.url?.includes('/api/auth/refresh');

    // Only attempt refresh for protected routes that return 401
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      if (isRefreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const localRefreshToken = localStorage.getItem('refreshToken');
        const refreshConfig = {
          withCredentials: true,
          headers: {}
        };
        if (localRefreshToken) {
          refreshConfig.headers['x-refresh-token'] = localRefreshToken;
        }

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          {},
          refreshConfig
        );

        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear tokens & redirect to login only if currently on protected dashboard
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

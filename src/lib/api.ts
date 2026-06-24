import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '';
if (!baseURL) {
  baseURL = '/api/v1';
} else if (!baseURL.endsWith('/api/v1')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-clear token on 401 (expired/invalid), let the app re-render to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      // Reload to show login screen (simplest redirect strategy)
      if (window.location.pathname !== '/') {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

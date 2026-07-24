// src/services/api.ts
import axios from 'axios';

// Base URL for all API calls
// Uses VITE_API_URL env var if set, otherwise falls back to production Render backend
const PRODUCTION_API = 'https://pulseguard-ai-v86p.onrender.com/api/v1';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || PRODUCTION_API,
});

// Request interceptor – attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulseguard_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // clear auth and redirect to login
      localStorage.removeItem('pulseguard_token');
      localStorage.removeItem('pulseguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

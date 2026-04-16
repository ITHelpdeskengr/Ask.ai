import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('ask_ai_user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    const googleToken = localStorage.getItem('ask_ai_google_token');
    if (googleToken) {
      config.headers['x-google-token'] = googleToken;
      config.headers['x-gmail-token'] = googleToken; // Backward compatibility
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  err => {
    console.error('[API]', err.response?.data?.error || err.message);
    return Promise.reject(err);
  }
);

export default api;

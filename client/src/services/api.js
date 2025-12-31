import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000
});

// Request interceptor: Add auth token
api.interceptors.request.use(async (config) => {
  console.log('🔶 API: Request to', config.url);
  const user = auth.currentUser;
  if (user) {
    console.log('🔶 API: Adding auth token to request');
    const token = await user.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('🔶 API: No user, sending request without token');
  }
  return config;
});

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('🔶 API: Response received from', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API: Request failed', error.config?.url, 'Status:', error.response?.status);
    if (error.response?.status === 401) {
      console.log('❌ API: 401 Unauthorized, signing out...');
      await auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

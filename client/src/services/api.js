import axios from 'axios';

const api = axios.create({
    // Fallback to Live Backend if env var fails
    baseURL: import.meta.env.VITE_API_URL || 'https://dharmic-marga.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

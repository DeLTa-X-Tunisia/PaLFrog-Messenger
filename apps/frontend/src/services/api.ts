import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            // Redirection vers login si nécessaire
            if (window.location.pathname !== '/login') {
                // window.location.href = '/login'; // Commented out to prevent loop during dev
            }
        }
        return Promise.reject(error);
    }
);

// API Auth spécifique
export const authAPI = {
    login: (credentials: { email: string; password: string }) =>
        api.post('/auth/login', credentials).then((res) => res.data),

    signup: (userData: { email: string; username: string; password: string; birthDate?: string; gender?: string }) =>
        api.post('/auth/signup', userData).then((res) => res.data),

    getProfile: () =>
        api.get('/auth/me').then((res) => res.data),

    getVisibleProfile: (userId: string) =>
        api.get(`/auth/profile/${userId}`).then((res) => res.data),

    updateProfile: (data: any) =>
        api.put('/auth/profile', data).then((res) => res.data),
};

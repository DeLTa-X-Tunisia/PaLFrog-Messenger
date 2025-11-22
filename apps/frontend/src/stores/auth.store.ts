import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

interface User {
    id: string;
    email: string;
    username: string;
    role: 'SERVER_MASTER' | 'SERVER_SUPER_ADMIN' | 'SERVER_ADMIN' | 'SERVER_MODERATOR' | 'SERVER_HELPER' | 'SERVER_EDITOR' | 'POWER_USER_A' | 'POWER_USER_B' | 'POWER_USER_C' | 'USER' | 'GUEST';
    birthDate?: string;
    gender?: string;
    createdAt: string;
    // Extended Profile Fields
    firstName?: string;
    lastName?: string;
    country?: string;
    profession?: string;
    maritalStatus?: string;
    avatarUrl?: string;
    bio?: string;
    age?: number; // Calculated
    status?: 'online' | 'busy' | 'away' | 'dnd' | 'offline';
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    ui: {
        sidebarOpen: boolean;
        currentView: 'chat' | 'contacts' | 'settings' | 'bridge' | 'social' | 'analytics' | 'security' | 'pricing' | 'friend-search';
        animationEnabled: boolean;
        showSignup: boolean;
    };

    // Actions
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, username: string, password: string, birthDate?: string, gender?: string) => Promise<void>;
    logout: () => void;
    getProfile: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    setStatus: (status: User['status']) => void;
    clearAuth: () => void;
    toggleSidebar: () => void;
    setCurrentView: (view: AuthState['ui']['currentView']) => void;
    setShowSignup: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isLoading: false,
            isAuthenticated: false,
            ui: {
                sidebarOpen: false,
                currentView: 'chat',
                animationEnabled: true,
                showSignup: false,
            },

            setStatus: (status) => {
                const { user } = get();
                if (user && status) {
                    console.log('AuthStore: Setting status to', status);
                    set({ user: { ...user, status } });
                    // Update status on server
                    import('../services/socket.service').then(({ socketService }) => {
                        console.log('AuthStore: Calling socketService.updateStatus');
                        socketService.updateStatus(status);
                    }).catch(err => console.error('AuthStore: Failed to import socketService', err));
                }
            },

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await authAPI.login({ email, password });
                    set({
                        user: response.user,
                        accessToken: response.accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            signup: async (email: string, username: string, password: string, birthDate?: string, gender?: string) => {
                set({ isLoading: true });
                try {
                    const response = await authAPI.signup({ email, username, password, birthDate, gender });
                    set({
                        user: response.user,
                        accessToken: response.accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set((state) => ({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    ui: {
                        ...state.ui,
                        showSignup: false,
                    }
                }));
            },

            getProfile: async () => {
                set({ isLoading: true });
                try {
                    const user = await authAPI.getProfile();
                    set({ user, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    // Si erreur (token invalide/expiré), on déconnecte
                    get().clearAuth();
                    throw error;
                }
            },

            updateUser: (userData: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null
                }));
            },

            clearAuth: () => {
                set((state) => ({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    ui: {
                        ...state.ui,
                        showSignup: false,
                    }
                }));
            },

            toggleSidebar: () => set((state) => ({
                ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
            })),

            setCurrentView: (view) => set((state) => ({
                ui: { ...state.ui, currentView: view }
            })),

            setShowSignup: (show) => set((state) => ({
                ui: { ...state.ui, showSignup: show }
            })),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                user: state.user
            }),
        }
    )
);

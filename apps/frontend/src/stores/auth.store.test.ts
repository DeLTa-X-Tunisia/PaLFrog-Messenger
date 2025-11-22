import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './auth.store';
import { authAPI } from '../services/api';

// Mock api service
vi.mock('../services/api', () => ({
    authAPI: {
        login: vi.fn(),
        signup: vi.fn(),
        getProfile: vi.fn()
    }
}));

describe('Auth Store', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            ui: {
                sidebarOpen: false,
                currentView: 'chat',
                animationEnabled: true,
                showSignup: false
            }
        });
        vi.clearAllMocks();
    });

    it('initializes with default state', () => {
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
    });

    it('handles successful login', async () => {
        const mockUser = { id: '1', email: 'test@test.com', username: 'test', role: 'user', createdAt: 'now' };
        const mockToken = 'fake-token';

        (authAPI.login as any).mockResolvedValue({ user: mockUser, accessToken: mockToken });

        await useAuthStore.getState().login('test@test.com', 'password');

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.accessToken).toBe(mockToken);
        expect(state.isLoading).toBe(false);
    });

    it('handles login failure', async () => {
        (authAPI.login as any).mockRejectedValue(new Error('Login failed'));

        try {
            await useAuthStore.getState().login('test@test.com', 'wrong-password');
        } catch (e) {
            // Expected error
        }

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.isLoading).toBe(false);
    });

    it('can change current view', () => {
        useAuthStore.getState().setCurrentView('pricing');
        expect(useAuthStore.getState().ui.currentView).toBe('pricing');
    });
});

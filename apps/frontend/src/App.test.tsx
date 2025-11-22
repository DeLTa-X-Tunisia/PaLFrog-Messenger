import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuthStore } from './stores/auth.store';

describe('App Component', () => {
    beforeEach(() => {
        // Reset store state
        useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            ui: {
                sidebarOpen: false,
                currentView: 'chat',
                animationEnabled: false,
                showSignup: false
            }
        });
    });

    it('renders login form when not authenticated', () => {
        render(<App />);
        // Look for the main heading
        const loginElements = screen.queryAllByText(/Connectez-vous/i);
        expect(loginElements.length).toBeGreaterThan(0);
    });
});

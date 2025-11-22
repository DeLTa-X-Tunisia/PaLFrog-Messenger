import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PricingPage from './PricingPage';
import { useSubscriptionStore } from '../../stores/subscription.store';

describe('PricingPage', () => {
    beforeEach(() => {
        useSubscriptionStore.setState({
            currentTier: 'free',
            isLoading: false,
            subscribe: async () => true
        } as any);
    });

    it('renders all three tiers', () => {
        render(<PricingPage />);

        expect(screen.getByText('Gratuit')).toBeInTheDocument();
        expect(screen.getByText('Pro')).toBeInTheDocument();
        expect(screen.getByText('Entreprise')).toBeInTheDocument();
    });

    it('shows current plan button for free tier', () => {
        render(<PricingPage />);

        // The free tier button should say "Plan Actuel" because initial state is free
        const buttons = screen.getAllByText('Plan Actuel');
        expect(buttons.length).toBe(1);
    });

    it('toggles between monthly and yearly billing', () => {
        render(<PricingPage />);

        const yearlyButton = screen.getByText(/Annuel/i);
        fireEvent.click(yearlyButton);

        // Check if prices updated (Pro yearly is 290)
        expect(screen.getByText('290€')).toBeInTheDocument();

        const monthlyButton = screen.getByText('Mensuel');
        fireEvent.click(monthlyButton);

        // Check if prices updated back (Pro monthly is 29)
        expect(screen.getByText('29€')).toBeInTheDocument();
    });
});

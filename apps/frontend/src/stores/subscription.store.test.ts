import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSubscriptionStore } from './subscription.store';
import { subscriptionService } from '../services/subscription.service';

describe('Subscription Store', () => {
    beforeEach(() => {
        useSubscriptionStore.setState({
            currentTier: 'free',
            isLoaded: false,
            features: {}
        });
        vi.clearAllMocks();
    });

    it('initializes with free tier', () => {
        const { currentTier } = useSubscriptionStore.getState();
        expect(currentTier).toBe('free');
    });

    it('can check feature usage', () => {
        // Mock service response
        vi.spyOn(subscriptionService, 'canUseFeature').mockReturnValue(true);

        const { canUseFeature } = useSubscriptionStore.getState();
        expect(canUseFeature('messages')).toBe(true);
    });

    it('updates state after subscription', async () => {
        // Mock service subscribe
        vi.spyOn(subscriptionService, 'subscribe').mockResolvedValue(true);
        vi.spyOn(subscriptionService, 'getCurrentSubscription').mockReturnValue({
            tier: 'pro',
            status: 'active',
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: false
        });
        vi.spyOn(subscriptionService, 'getTier').mockReturnValue({
            id: 'pro',
            name: 'Pro',
            price: { monthly: 10, yearly: 100 },
            features: { advancedAI: true }
        });

        const store = useSubscriptionStore.getState();
        const success = await store.subscribe('pro', 'monthly', {});

        expect(success).toBe(true);
        expect(useSubscriptionStore.getState().currentTier).toBe('pro');
    });
});

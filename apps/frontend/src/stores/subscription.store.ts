import { create } from 'zustand';
import { subscriptionService } from '../services/subscription.service';

interface SubscriptionState {
    currentTier: string;
    isLoaded: boolean;
    isLoading: boolean;
    features: { [key: string]: boolean | number | string };

    // Actions
    initialize: () => void;
    canUseFeature: (feature: string) => boolean;
    subscribe: (tier: string, billing: string, paymentMethod?: any) => Promise<boolean>;
    cancelSubscription: () => Promise<boolean>;
    getUpgradeBenefits: (targetTier: string) => string[];
    getTiers: () => any[];
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    currentTier: 'free',
    isLoaded: false,
    isLoading: false,
    features: {},

    initialize: () => {
        subscriptionService.loadSubscription();
        const subscription = subscriptionService.getCurrentSubscription();

        set({
            currentTier: subscription.tier,
            isLoaded: true,
            features: subscriptionService.getTier(subscription.tier)?.features || {}
        });
    },

    canUseFeature: (feature: string) => {
        return subscriptionService.canUseFeature(feature);
    },

    subscribe: async (tier, billing, paymentMethod) => {
        set({ isLoading: true });
        try {
            const success = await subscriptionService.subscribe(
                tier as 'pro' | 'enterprise',
                billing as 'monthly' | 'yearly',
                paymentMethod || {}
            );

            if (success) {
                get().initialize(); // Recharger l'état
            }

            return success;
        } finally {
            set({ isLoading: false });
        }
    },

    cancelSubscription: async () => {
        const success = await subscriptionService.cancelSubscription();

        if (success) {
            get().initialize(); // Recharger l'état
        }

        return success;
    },

    getUpgradeBenefits: (targetTier: string) => {
        const { currentTier } = get();
        return subscriptionService.getUpgradeBenefits(currentTier, targetTier);
    },

    getTiers: () => {
        return subscriptionService.getTiers();
    }
}));

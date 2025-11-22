import { useTranslation } from '../hooks/useTranslation';

export interface SubscriptionTier {
    id: string;
    name: string;
    price: {
        monthly: number;
        yearly: number; // 2 mois gratuits
    };
    features: {
        [key: string]: boolean | number | string;
    };
    popular?: boolean;
}

export interface UserSubscription {
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    priceId?: string;
}

class SubscriptionService {
    private tiers: SubscriptionTier[] = [
        {
            id: 'free',
            name: 'Gratuit',
            price: {
                monthly: 0,
                yearly: 0
            },
            features: {
                messages: true,
                audioCalls: true,
                videoCalls: true,
                fileSharing: true,
                maxFileSize: 100, // MB
                groupSize: 10,
                basicAI: true,
                securityScore: true,
                basicAnalytics: true,
                bridges: 1,
                storage: 5, // GB
                support: 'community'
            }
        },
        {
            id: 'pro',
            name: 'Pro',
            price: {
                monthly: 9.99,
                yearly: 99.99 // Équivaut à 8.33€/mois
            },
            popular: true,
            features: {
                messages: true,
                audioCalls: true,
                videoCalls: true,
                fileSharing: true,
                maxFileSize: 500, // MB
                groupSize: 50,
                advancedAI: true,
                securityScore: true,
                advancedAnalytics: true,
                bridges: 5,
                storage: 50, // GB
                customThemes: true,
                prioritySupport: true,
                voiceRooms: true,
                advancedGamification: true,
                exportAnalytics: true
            }
        },
        {
            id: 'enterprise',
            name: 'Entreprise',
            price: {
                monthly: 19.99,
                yearly: 199.99 // Équivaut à 16.66€/mois
            },
            features: {
                messages: true,
                audioCalls: true,
                videoCalls: true,
                fileSharing: true,
                maxFileSize: 1024, // 1GB
                groupSize: 500,
                premiumAI: true,
                securityScore: true,
                premiumAnalytics: true,
                bridges: 'unlimited',
                storage: 500, // GB
                customThemes: true,
                dedicatedSupport: true,
                voiceRooms: true,
                advancedGamification: true,
                exportAnalytics: true,
                SSO: true,
                adminPanel: true,
                customBranding: true,
                complianceReports: true,
                APIaccess: true,
                whiteLabel: true
            }
        }
    ];

    private currentSubscription: UserSubscription = {
        tier: 'free',
        status: 'active',
        currentPeriodEnd: new Date('2030-12-31'), // Far future for free tier
        cancelAtPeriodEnd: false
    };

    // 🎯 VÉRIFICATION DES FONCTIONNALITÉS
    canUseFeature(feature: string): boolean {
        const tier = this.tiers.find(t => t.id === this.currentSubscription.tier);
        if (!tier) return false;

        const featureValue = tier.features[feature];

        if (typeof featureValue === 'boolean') {
            return featureValue;
        }

        // Pour les features numériques, vérifier les limites
        if (typeof featureValue === 'number') {
            return this.checkFeatureLimits(feature, featureValue);
        }

        if (featureValue === 'unlimited') {
            return true;
        }

        return !!featureValue;
    }

    private checkFeatureLimits(feature: string, limit: number): boolean {
        switch (feature) {
            case 'maxFileSize':
                return this.checkFileSizeLimit(limit);
            case 'groupSize':
                return this.checkGroupSizeLimit(limit);
            case 'storage':
                return this.checkStorageLimit(limit);
            case 'bridges':
                return this.checkBridgesLimit(limit);
            default:
                return true;
        }
    }

    private checkFileSizeLimit(limit: number): boolean {
        // En réalité, vérifier la taille du fichier en cours d'upload
        return true; // Placeholder
    }

    private checkGroupSizeLimit(limit: number): boolean {
        const groupSize = 0; // Récupérer la taille du groupe actuel
        return groupSize < limit;
    }

    private checkStorageLimit(limit: number): boolean {
        const usedStorage = this.getUsedStorage();
        return usedStorage < limit * 1024 * 1024 * 1024; // Convertir GB en bytes
    }

    private checkBridgesLimit(limit: number | string): boolean {
        if (limit === 'unlimited') return true;
        if (typeof limit !== 'number') return false;

        const activeBridges = 0; // Récupérer le nombre de bridges actifs
        return activeBridges < limit;
    }

    // 🎯 GESTION DES ABONNEMENTS
    async subscribe(tier: 'pro' | 'enterprise', billing: 'monthly' | 'yearly', paymentMethod: any): Promise<boolean> {
        try {
            // Intégration avec Stripe ou autre processeur de paiement
            const paymentResult = await this.processPayment(tier, billing, paymentMethod);

            if (paymentResult.success) {
                this.currentSubscription = {
                    tier,
                    status: 'active',
                    currentPeriodEnd: this.calculatePeriodEnd(billing),
                    cancelAtPeriodEnd: false,
                    priceId: paymentResult.priceId
                };

                this.saveSubscription();
                this.triggerSubscriptionEvent('subscription_updated');

                return true;
            }

            return false;
        } catch (error) {
            console.error('Subscription failed:', error);
            return false;
        }
    }

    async cancelSubscription(): Promise<boolean> {
        if (this.currentSubscription.tier === 'free') {
            return true;
        }

        try {
            // Annuler chez le processeur de paiement
            await this.cancelWithProvider();

            this.currentSubscription.cancelAtPeriodEnd = true;
            this.saveSubscription();
            this.triggerSubscriptionEvent('subscription_canceled');

            return true;
        } catch (error) {
            console.error('Cancel failed:', error);
            return false;
        }
    }

    async resumeSubscription(): Promise<boolean> {
        try {
            // Reprendre l'abonnement
            await this.resumeWithProvider();

            this.currentSubscription.cancelAtPeriodEnd = false;
            this.saveSubscription();
            this.triggerSubscriptionEvent('subscription_resumed');

            return true;
        } catch (error) {
            console.error('Resume failed:', error);
            return false;
        }
    }

    // 🎯 UTILITAIRES
    private calculatePeriodEnd(billing: 'monthly' | 'yearly'): Date {
        const endDate = new Date();

        if (billing === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        return endDate;
    }

    private getUsedStorage(): number {
        // Calculer le stockage utilisé (IndexedDB, fichiers, etc.)
        return 0; // Placeholder
    }

    // 🎯 PERSISTANCE
    private saveSubscription() {
        localStorage.setItem('palfrog-subscription', JSON.stringify(this.currentSubscription));
    }

    loadSubscription() {
        try {
            const saved = localStorage.getItem('palfrog-subscription');
            if (saved) {
                this.currentSubscription = JSON.parse(saved);
                this.currentSubscription.currentPeriodEnd = new Date(this.currentSubscription.currentPeriodEnd);
            }
        } catch (error) {
            console.error('Failed to load subscription:', error);
        }
    }

    // 🎯 ÉVÉNEMENTS
    private triggerSubscriptionEvent(event: string) {
        window.dispatchEvent(new CustomEvent('palfrog-subscription', {
            detail: { event, subscription: this.currentSubscription }
        }));
    }

    // 🎯 MÉTHODES PUBLIQUES
    getCurrentSubscription(): UserSubscription {
        return { ...this.currentSubscription };
    }

    getTiers(): SubscriptionTier[] {
        return [...this.tiers];
    }

    getTier(tierId: string): SubscriptionTier | undefined {
        return this.tiers.find(t => t.id === tierId);
    }

    getUpgradeBenefits(currentTier: string, targetTier: string): string[] {
        const current = this.getTier(currentTier);
        const target = this.getTier(targetTier);

        if (!current || !target) return [];

        const benefits: string[] = [];

        Object.keys(target.features).forEach(feature => {
            const currentValue = current.features[feature];
            const targetValue = target.features[feature];

            if (currentValue !== targetValue) {
                if (typeof targetValue === 'boolean' && targetValue) {
                    benefits.push(this.getFeatureDescription(feature));
                } else if (typeof targetValue === 'number' && typeof currentValue === 'number') {
                    if (targetValue > currentValue) {
                        benefits.push(`${this.getFeatureDescription(feature)}: ${currentValue} → ${targetValue}`);
                    }
                }
            }
        });

        return benefits;
    }

    private getFeatureDescription(feature: string): string {
        const descriptions: { [key: string]: string } = {
            maxFileSize: 'Taille maximale des fichiers',
            groupSize: 'Taille des groupes',
            storage: 'Stockage cloud',
            bridges: 'Bridges d applications',
            advancedAI: 'IA avancée',
            premiumAI: 'IA premium',
            customThemes: 'Thèmes personnalisés',
            prioritySupport: 'Support prioritaire',
            dedicatedSupport: 'Support dédié',
            voiceRooms: 'Salons vocaux',
            advancedGamification: 'Gamification avancée',
            exportAnalytics: 'Export analytics',
            SSO: 'Authentification unique',
            adminPanel: 'Panel administrateur',
            customBranding: 'Branding personnalisé',
            complianceReports: 'Rapports de conformité',
            APIaccess: 'Accès API',
            whiteLabel: 'White-label'
        };

        return descriptions[feature] || feature;
    }

    // 🎯 SIMULATION PAIEMENT (à remplacer par vrai intégration)
    private async processPayment(tier: 'pro' | 'enterprise', billing: 'monthly' | 'yearly', paymentMethod: any): Promise<{ success: boolean; priceId?: string }> {
        // Simuler un traitement de paiement
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            priceId: `price_${tier}_${billing}`
        };
    }

    private async cancelWithProvider(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    private async resumeWithProvider(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export const subscriptionService = new SubscriptionService();

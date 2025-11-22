import React, { useState } from 'react';
import { useSubscriptionStore } from '../../stores/subscription.store';
import { subscriptionService, SubscriptionTier } from '../../services/subscription.service';
import toast from 'react-hot-toast';

const PricingPage: React.FC = () => {
    const { currentTier, isLoading, subscribe } = useSubscriptionStore();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const tiers = [
        {
            id: 'free',
            name: 'Gratuit',
            price: { monthly: 0, yearly: 0 },
            description: 'Pour les individus et les petits projets',
            features: [
                'Jusqu\'à 3 ponts',
                '1GB de stockage',
                'Support communautaire',
                'Fonctionnalités de base'
            ],
            buttonText: 'Commencer gratuitement',
            recommended: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price: { monthly: 29, yearly: 290 },
            description: 'Pour les professionnels et les créateurs',
            features: [
                'Ponts illimités',
                '50GB de stockage',
                'Support prioritaire',
                'IA Avancée',
                'Mode hors ligne',
                'Analytiques avancées'
            ],
            buttonText: 'Passer à Pro',
            recommended: true
        },
        {
            id: 'enterprise',
            name: 'Entreprise',
            price: { monthly: 99, yearly: 990 },
            description: 'Pour les grandes équipes et organisations',
            features: [
                'Tout du plan Pro',
                'Stockage illimité',
                'SSO & Sécurité avancée',
                'Gestionnaire de compte dédié',
                'SLA garanti',
                'API dédiée'
            ],
            buttonText: 'Contacter les ventes',
            recommended: false
        }
    ];

    const handleSubscribe = async (tierId: string) => {
        if (tierId === 'enterprise') {
            window.location.href = 'mailto:sales@palfrog.com';
            return;
        }

        try {
            await subscribe(tierId, billingCycle, {});
            toast.success(`Félicitations ! Vous êtes maintenant abonné au plan ${tierId.toUpperCase()}.`, {
                duration: 5000,
                icon: '🚀',
            });
        } catch (error) {
            toast.error('Une erreur est survenue lors de l\'abonnement.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Plans et Tarifs
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        Choisissez le plan qui correspond le mieux à vos besoins
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-6 flex justify-center">
                        <div className="relative bg-white rounded-lg p-0.5 flex sm:mt-8 border border-gray-200">
                            <button
                                type="button"
                                className={`${billingCycle === 'monthly'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:w-auto sm:px-8 transition-colors duration-200`}
                                onClick={() => setBillingCycle('monthly')}
                            >
                                Mensuel
                            </button>
                            <button
                                type="button"
                                className={`${billingCycle === 'yearly'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:w-auto sm:px-8 transition-colors duration-200`}
                                onClick={() => setBillingCycle('yearly')}
                            >
                                Annuel (-20%)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                    {tiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`border rounded-lg shadow-sm divide-y divide-gray-200 bg-white flex flex-col ${tier.recommended ? 'border-indigo-500 ring-2 ring-indigo-500 relative' : 'border-gray-200'
                                }`}
                        >
                            {tier.recommended && (
                                <div className="absolute top-0 right-0 -mt-4 mr-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white uppercase tracking-wide">
                                        Recommandé
                                    </span>
                                </div>
                            )}

                            <div className="p-6 flex-1">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">{tier.name}</h3>
                                <p className="mt-4 text-sm text-gray-500">{tier.description}</p>
                                <p className="mt-8">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        {billingCycle === 'monthly' ? `${tier.price.monthly}€` : `${tier.price.yearly}€`}
                                    </span>
                                    <span className="text-base font-medium text-gray-500">
                                        /{billingCycle === 'monthly' ? 'mois' : 'an'}
                                    </span>
                                </p>

                                <ul className="mt-6 space-y-4">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <p className="ml-3 text-sm text-gray-700">{feature}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 bg-gray-50 rounded-b-lg">
                                <button
                                    onClick={() => handleSubscribe(tier.id)}
                                    disabled={isLoading || currentTier === tier.id}
                                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${currentTier === tier.id
                                        ? 'bg-green-600 hover:bg-green-700 cursor-default'
                                        : tier.recommended
                                            ? 'bg-indigo-600 hover:bg-indigo-700'
                                            : 'bg-gray-800 hover:bg-gray-900'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
                                >
                                    {currentTier === tier.id ? 'Plan Actuel' : tier.buttonText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;

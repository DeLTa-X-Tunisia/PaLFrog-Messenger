import React from 'react';
import { useSubscriptionStore } from '../../stores/subscription.store';
import { Link } from 'react-router-dom';

interface FeatureRestrictionProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showLock?: boolean;
}

export const FeatureRestriction: React.FC<FeatureRestrictionProps> = ({
    feature,
    children,
    fallback,
    showLock = false
}) => {
    const { canUseFeature } = useSubscriptionStore();
    const isAllowed = canUseFeature(feature);

    if (isAllowed) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showLock) {
        return (
            <div className="relative group">
                <div className="opacity-50 pointer-events-none filter blur-sm select-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg text-center border border-gray-200">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-3">
                            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Fonctionnalité Premium</h3>
                        <p className="mt-1 text-sm text-gray-500 mb-4">
                            Passez à la version Pro pour débloquer cette fonctionnalité.
                        </p>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Voir les plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export const FeatureGate: React.FC<{ feature: string; children: React.ReactNode }> = ({ feature, children }) => {
    const { canUseFeature } = useSubscriptionStore();
    return canUseFeature(feature) ? <>{children}</> : null;
};

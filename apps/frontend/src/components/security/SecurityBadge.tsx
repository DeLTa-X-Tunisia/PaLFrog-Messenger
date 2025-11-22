import React, { useEffect, useState } from 'react';
import { useSecurityStore } from '../../stores/security.store';

interface SecurityBadgeProps {
    score?: number;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ score: propScore }) => {
    const { score: storeScore, level: storeLevel } = useSecurityStore();
    const [isVisible, setIsVisible] = useState(false);

    const score = propScore ?? storeScore;

    // Determine level based on score if provided via props
    const getLevel = (s: number) => {
        if (s >= 90) return 'excellent';
        if (s >= 70) return 'good';
        if (s >= 50) return 'fair';
        if (s >= 30) return 'poor';
        return 'critical';
    };

    const level = propScore !== undefined ? getLevel(propScore) : storeLevel;

    useEffect(() => {
        // Always show if it's a prop (profile view), otherwise follow store logic
        if (propScore !== undefined) {
            setIsVisible(true);
        } else {
            setIsVisible(level !== 'excellent');
        }
    }, [level, propScore]);

    const getBadgeColor = () => {
        switch (level) {
            case 'excellent': return 'bg-green-500';
            case 'good': return 'bg-blue-500';
            case 'fair': return 'bg-yellow-500';
            case 'poor': return 'bg-orange-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getBadgeIcon = () => {
        switch (level) {
            case 'excellent': return '🛡️';
            case 'good': return '✅';
            case 'fair': return '⚠️';
            case 'poor': return '🔶';
            case 'critical': return '🚨';
            default: return '🔍';
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`
            w-full px-4 py-2 rounded-xl text-white shadow-md mb-4
            ${getBadgeColor()} transition-all duration-300
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span>{getBadgeIcon()}</span>
                    <span className="text-sm font-medium">
                        Sécurité: {score}/100
                    </span>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSecurityStore } from '../../stores/security.store';

interface DashboardMetric {
    id: string;
    name: string;
    description: string;
    currentValue: number;
}

export const SecurityDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { score, level, breakdown, isCalculating, calculateScore, improvementTips } = useSecurityStore();
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        calculateScore();

        const interval = setInterval(() => {
            calculateScore();
        }, 30 * 60 * 1000);

        return () => clearInterval(interval);
        // Deliberately omit dependencies to mimic the original polling cadence
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLastUpdated(new Date().toLocaleTimeString());
    }, [score]);

    const getScoreColor = () => {
        switch (level) {
            case 'excellent': return 'text-green-500';
            case 'good': return 'text-blue-500';
            case 'fair': return 'text-yellow-500';
            case 'poor': return 'text-orange-500';
            case 'critical': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getLevelIcon = () => {
        switch (level) {
            case 'excellent': return '🛡️';
            case 'good': return '✅';
            case 'fair': return '⚠️';
            case 'poor': return '🔶';
            case 'critical': return '🚨';
            default: return '🔍';
        }
    };

    const getGradientClass = () => {
        switch (level) {
            case 'excellent': return 'from-green-500 to-green-600';
            case 'good': return 'from-blue-500 to-blue-600';
            case 'fair': return 'from-yellow-500 to-yellow-600';
            case 'poor': return 'from-orange-500 to-orange-600';
            case 'critical': return 'from-red-500 to-red-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('security.dashboardTitle')}
                    </h2>
                    <button
                        onClick={calculateScore}
                        disabled={isCalculating}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        {isCalculating ? t('common.loading') : '🔄'}
                    </button>
                </div>

                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${getGradientClass()} flex items-center justify-center shadow-lg`}>
                            <div className="text-white text-center">
                                <div className="text-4xl font-bold">{score}</div>
                                <div className="text-lg opacity-90">/ 100</div>
                            </div>
                        </div>

                        <svg className="absolute inset-0 w-48 h-48 transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="white"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${(score / 100) * 552.92} 552.92`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-2xl">{getLevelIcon()}</span>
                            <span className={`text-xl font-semibold ${getScoreColor()}`}>
                                {t(`security.levels.${level}`)}
                            </span>
                        </div>
                        <p className="text-gray-600 mt-2">
                            {t(`security.descriptions.${level}`)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(breakdown || {}).map(([category, categoryScore]) => (
                        <div key={category} className="text-center">
                            <div className="text-sm text-gray-600 mb-1 capitalize">
                                {t(`security.categories.${category}`)}
                            </div>
                            <div
                                className={`text-lg font-semibold ${categoryScore >= 80 ? 'text-green-500' :
                                        categoryScore >= 60 ? 'text-yellow-500' :
                                            'text-red-500'
                                    }`}
                            >
                                {categoryScore}%
                            </div>
                        </div>
                    ))}
                </div>

                {lastUpdated && (
                    <div className="text-center mt-4 text-sm text-gray-500">
                        {t('security.lastUpdated')} {lastUpdated}
                    </div>
                )}
            </div>

            {improvementTips.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                        <span className="mr-2">💡</span>
                        {t('security.improvementTips')}
                    </h3>

                    <div className="space-y-3">
                        {improvementTips.map((tip, index) => (
                            <ImprovementTip key={index} tip={tip} index={index} />
                        ))}
                    </div>
                </div>
            )}

            <SecurityMetrics />
        </div>
    );
};

const ImprovementTip: React.FC<{ tip: string; index: number }> = ({ tip, index }) => {
    const { dismissTip, markTipCompleted } = useSecurityStore();

    return (
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                </div>
                <span className="text-yellow-800">{tip}</span>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => markTipCompleted(tip)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                    ✓
                </button>
                <button
                    onClick={() => dismissTip(tip)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

const SecurityMetrics: React.FC = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<DashboardMetric[]>([]);

    useEffect(() => {
        let isMounted = true;

        import('../../services/security-score.service')
            .then(module => {
                if (!isMounted) {
                    return;
                }
                setMetrics(module.securityScoreService.getMetrics());
            })
            .catch(() => {
                if (isMounted) {
                    setMetrics([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('security.detailedMetrics')}
            </h3>

            <div className="space-y-4">
                {metrics.map(metric => (
                    <div key={metric.id} className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{metric.name}</span>
                                <span
                                    className={`text-sm font-semibold ${metric.currentValue >= 80 ? 'text-green-500' :
                                            metric.currentValue >= 60 ? 'text-yellow-500' :
                                                'text-red-500'
                                        }`}
                                >
                                    {metric.currentValue}%
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${metric.currentValue >= 80 ? 'bg-green-500' :
                                            metric.currentValue >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                        }`}
                                    style={{ width: `${metric.currentValue}%` }}
                                />
                            </div>

                            <p className="text-sm text-gray-600 mt-1">
                                {metric.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

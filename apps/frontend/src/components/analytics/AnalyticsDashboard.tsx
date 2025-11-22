import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../../stores/analytics.store';
import { useTranslation } from '../../hooks/useTranslation';
import { RelationshipMap } from './RelationshipMap';
import { ProductivityChart } from './ProductivityChart';
import { MoodTracker } from './MoodTracker';
import { GoalsProgress } from './GoalsProgress';
import { InsightsPanel } from './InsightsPanel';

export const AnalyticsDashboard: React.FC = () => {
    const { t } = useTranslation();
    const {
        generateComprehensiveReport,
        lastReport,
        isGeneratingReport,
        privacyLevel,
        setPrivacyLevel
    } = useAnalyticsStore();

    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!lastReport) {
            generateComprehensiveReport();
        }
    }, []);

    if (isGeneratingReport) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('analytics.generatingReport')}</p>
                </div>
            </div>
        );
    }

    if (!lastReport) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('analytics.noDataTitle')}
                </h2>
                <p className="text-gray-600 mb-6">
                    {t('analytics.noDataDescription')}
                </p>
                <button
                    onClick={() => generateComprehensiveReport()}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    {t('analytics.generateFirstReport')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête et contrôles */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            📊 {t('analytics.dashboardTitle')}
                        </h1>
                        <p className="text-gray-600">
                            {t('analytics.dashboardSubtitle')}
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Sélecteur de confidentialité */}
                        <select
                            value={privacyLevel}
                            onChange={(e) => setPrivacyLevel(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="minimal">{t('analytics.privacyMinimal')}</option>
                            <option value="balanced">{t('analytics.privacyBalanced')}</option>
                            <option value="detailed">{t('analytics.privacyDetailed')}</option>
                        </select>

                        <button
                            onClick={() => generateComprehensiveReport()}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            🔄 {t('analytics.refresh')}
                        </button>
                    </div>
                </div>

                {/* Score global */}
                <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl px-8 py-6">
                        <div className="text-sm opacity-90">{t('analytics.overallScore')}</div>
                        <div className="text-4xl font-bold">{lastReport.summary.overallScore}/100</div>
                        <div className="text-sm opacity-90 mt-2">
                            {t('analytics.generatedOn')} {new Date(lastReport.summary.generatedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation par onglets */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <nav className="flex space-x-8 border-b border-gray-200 px-6">
                    {[
                        { id: 'overview', name: t('analytics.overview'), icon: '📈' },
                        { id: 'relationships', name: t('analytics.relationships'), icon: '🤝' },
                        { id: 'productivity', name: t('analytics.productivity'), icon: '⚡' },
                        { id: 'mood', name: t('analytics.mood'), icon: '😊' },
                        { id: 'goals', name: t('analytics.goals'), icon: '🎯' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </nav>

                {/* Contenu des onglets */}
                <div className="p-6">
                    {activeTab === 'overview' && <OverviewTab report={lastReport} />}
                    {activeTab === 'relationships' && <RelationshipMap data={lastReport.relationshipMap} />}
                    {activeTab === 'productivity' && <ProductivityChart data={lastReport.productivityStats} />}
                    {activeTab === 'mood' && <MoodTracker data={lastReport.moodTracking} />}
                    {activeTab === 'goals' && <GoalsProgress data={lastReport.communicationGoals} />}
                </div>
            </div>

            {/* Insights et recommandations */}
            <InsightsPanel insights={lastReport.insights} />
        </div>
    );
};

const OverviewTab: React.FC<{ report: any }> = ({ report }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                icon="💬"
                label={t('analytics.totalMessages')}
                value={report.conversationStats.totalMessages}
            />
            <StatCard
                icon="🤝"
                label={t('analytics.contacts')}
                value={report.relationshipMap.contacts.length}
            />
            <StatCard
                icon="⏱️"
                label={t('analytics.timeSpent')}
                value={`${Math.round(report.productivityStats.timeSpent)}m`}
            />
            <StatCard
                icon="😊"
                label={t('analytics.wellbeingScore')}
                value={`${report.moodTracking.wellbeingScore}/100`}
            />
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: any }> = ({
    icon, label, value
}) => (
    <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
    </div>
);

import React, { useEffect } from 'react';
import { useGamificationStore } from '../../stores/gamification.store';
import { useTranslation } from '../../hooks/useTranslation';
import { LevelProgress } from './LevelProgress';
import { AchievementGallery } from './AchievementGallery';
import { DailyQuests } from './DailyQuests';
import { Leaderboard } from './Leaderboard';

export const GamificationDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { stats, achievements, initialize, getLeaderboardData } = useGamificationStore();

    useEffect(() => {
        initialize();
    }, []);

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const leaderboardData = getLeaderboardData();

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">🎮 {t('gamification.dashboardTitle')}</h1>
                        <p className="opacity-90">{t('gamification.dashboardSubtitle')}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">Niveau {stats.level}</div>
                        <div className="text-sm opacity-90 capitalize">{stats.rank}</div>
                    </div>
                </div>
            </div>

            {/* Progression du niveau */}
            <LevelProgress />

            {/* Grille de contenu */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quêtes quotidiennes */}
                <div className="lg:col-span-1">
                    <DailyQuests />
                </div>

                {/* Galerie des succès */}
                <div className="lg:col-span-2">
                    <AchievementGallery />
                </div>
            </div>

            {/* Classement */}
            <Leaderboard />

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon="🔥"
                    label={t('gamification.streak')}
                    value={stats.streak}
                    suffix="jours"
                />
                <StatCard
                    icon="🏆"
                    label={t('gamification.achievements')}
                    value={leaderboardData.achievements}
                    suffix={`/ ${leaderboardData.totalAchievements}`}
                />
                <StatCard
                    icon="⭐"
                    label={t('gamification.points')}
                    value={stats.points}
                />
                <StatCard
                    icon="📊"
                    label={t('gamification.rank')}
                    value={t(`gamification.ranks.${stats.rank}`)}
                />
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: any; suffix?: string }> = ({
    icon, label, value, suffix
}) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-lg font-bold text-gray-900">
            {value} {suffix}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
    </div>
);

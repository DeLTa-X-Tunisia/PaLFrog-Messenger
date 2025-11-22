import React from 'react';
import { useGamificationStore } from '../../stores/gamification.store';
import { useTranslation } from '../../hooks/useTranslation';

export const LevelProgress: React.FC = () => {
    const { t } = useTranslation();
    const { getNextLevelProgress, stats } = useGamificationStore();

    const progress = getNextLevelProgress();

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'bronze': return 'from-yellow-600 to-yellow-800';
            case 'silver': return 'from-gray-400 to-gray-600';
            case 'gold': return 'from-yellow-400 to-yellow-600';
            case 'platinum': return 'from-blue-400 to-blue-600';
            case 'diamond': return 'from-purple-400 to-purple-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getRankIcon = (rank: string) => {
        switch (rank) {
            case 'bronze': return '🥉';
            case 'silver': return '🥈';
            case 'gold': return '🥇';
            case 'platinum': return '💎';
            case 'diamond': return '🔷';
            default: return '🎯';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {t('gamification.levelProgress')}
                </h3>
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRankIcon(stats.rank)}</span>
                    <span className="font-semibold capitalize text-gray-700">
                        {t(`gamification.ranks.${stats.rank}`)}
                    </span>
                </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Niveau {stats.level}</span>
                    <span>Niveau {stats.level + 1}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                        className={`h-4 rounded-full bg-gradient-to-r ${getRankColor(stats.rank)} transition-all duration-1000 ease-out`}
                        style={{ width: `${progress.percentage}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                    <span>{progress.current} XP</span>
                    <span>{progress.next} XP</span>
                </div>
            </div>

            {/* Badges de niveau */}
            <div className="flex justify-between mt-6">
                {[1, 5, 10, 20, 30].map(level => (
                    <div
                        key={level}
                        className={`flex flex-col items-center ${stats.level >= level ? 'opacity-100' : 'opacity-40'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${stats.level >= level
                                ? level >= 20 ? 'bg-purple-500' :
                                    level >= 10 ? 'bg-yellow-500' :
                                        level >= 5 ? 'bg-gray-400' : 'bg-yellow-600'
                                : 'bg-gray-300'
                            }`}>
                            {level}
                        </div>
                        <div className="text-xs mt-1 text-gray-600">
                            {level === 1 ? 'Bronze' :
                                level === 5 ? 'Silver' :
                                    level === 10 ? 'Gold' :
                                        level === 20 ? 'Platinum' : 'Diamond'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

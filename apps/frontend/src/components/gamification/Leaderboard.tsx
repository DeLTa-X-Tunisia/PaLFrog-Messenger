import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useGamificationStore } from '../../stores/gamification.store';

export const Leaderboard: React.FC = () => {
    const { t } = useTranslation();
    const { stats } = useGamificationStore();

    // Mock leaderboard data
    const leaderboard = [
        { rank: 1, name: 'Alice', points: 12500, level: 15 },
        { rank: 2, name: 'Bob', points: 11200, level: 14 },
        { rank: 3, name: 'You', points: stats?.points || 0, level: stats?.level || 1, isUser: true },
        { rank: 4, name: 'Charlie', points: 8500, level: 10 },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🏆 {t('gamification.leaderboard')}
            </h3>
            <div className="space-y-3">
                {leaderboard.map((user) => (
                    <div
                        key={user.rank}
                        className={`flex items-center justify-between p-3 rounded-xl ${user.isUser ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                    user.rank === 2 ? 'bg-gray-200 text-gray-700' :
                                        user.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                            'bg-white text-gray-500'
                                }`}>
                                {user.rank}
                            </div>
                            <div>
                                <div className={`font-medium ${user.isUser ? 'text-primary-900' : 'text-gray-900'}`}>
                                    {user.name} {user.isUser && '(Moi)'}
                                </div>
                                <div className="text-xs text-gray-500">Niveau {user.level}</div>
                            </div>
                        </div>
                        <div className="font-bold text-gray-700">
                            {user.points.toLocaleString()} pts
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

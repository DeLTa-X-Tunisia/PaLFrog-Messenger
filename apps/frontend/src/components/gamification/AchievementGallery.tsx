import React from 'react';
import { useGamificationStore } from '../../stores/gamification.store';
import { useTranslation } from '../../hooks/useTranslation';

export const AchievementGallery: React.FC = () => {
    const { t } = useTranslation();
    const { achievements } = useGamificationStore();

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'from-purple-500 to-pink-500';
            case 'epic': return 'from-purple-400 to-blue-500';
            case 'rare': return 'from-blue-400 to-green-400';
            case 'common': return 'from-gray-400 to-gray-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    🏆 {t('gamification.achievements')}
                </h3>
                <div className="text-sm text-gray-600">
                    {unlockedAchievements.length} / {achievements.length} {t('gamification.unlocked')}
                </div>
            </div>

            {/* Succès débloqués */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {unlockedAchievements.slice(0, 4).map(achievement => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={true}
                    />
                ))}
            </div>

            {/* Prochains succès à débloquer */}
            <h4 className="font-semibold text-gray-900 mb-4">
                {t('gamification.nextAchievements')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lockedAchievements.slice(0, 3).map(achievement => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={false}
                    />
                ))}
            </div>
        </div>
    );
};

const AchievementCard: React.FC<{ achievement: any; unlocked: boolean }> = ({
    achievement,
    unlocked
}) => {
    const progress = (achievement.progress / achievement.maxProgress) * 100;

    return (
        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${unlocked
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="flex items-start space-x-3">
                <div className={`text-2xl ${unlocked ? 'opacity-100' : 'opacity-60'}`}>
                    {achievement.icon}
                </div>

                <div className="flex-1">
                    <h5 className={`font-semibold ${unlocked ? 'text-green-900' : 'text-gray-900'
                        }`}>
                        {achievement.name}
                    </h5>

                    <p className={`text-sm ${unlocked ? 'text-green-700' : 'text-gray-600'
                        }`}>
                        {achievement.description}
                    </p>

                    {!unlocked && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {achievement.progress} / {achievement.maxProgress}
                            </div>
                        </div>
                    )}

                    {unlocked && achievement.unlockedAt && (
                        <div className="text-xs text-green-600 mt-1">
                            Débloqué le {achievement.unlockedAt.toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${unlocked
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                    +{achievement.points}
                </div>
            </div>
        </div>
    );
};

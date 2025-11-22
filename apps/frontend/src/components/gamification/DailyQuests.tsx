import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export const DailyQuests: React.FC = () => {
    const { t } = useTranslation();
    // Mock data or store data if available
    const quests = [
        { id: 'msg', label: 'quests.sendMessages', progress: 3, total: 10 },
        { id: 'call', label: 'quests.makeCalls', progress: 1, total: 3 },
        { id: 'ai', label: 'quests.useAI', progress: 5, total: 5, completed: true },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📅 {t('gamification.dailyQuests')}
            </h3>
            <div className="space-y-4">
                {quests.map(quest => (
                    <div key={quest.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className={quest.completed ? 'text-green-600 line-through' : 'text-gray-700'}>
                                {t(`gamification.${quest.label}`)}
                            </span>
                            <span className="text-gray-500">{quest.progress}/{quest.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${quest.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React from 'react';

interface GoalsProgressProps {
    data: {
        goals: {
            id: string;
            title: string;
            target: number;
            current: number;
            unit: string;
            deadline?: Date;
            category: 'social' | 'productivity' | 'learning' | 'wellbeing';
        }[];
        progress: number;
    };
}

export const GoalsProgress: React.FC<GoalsProgressProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Objectifs de Communication</h3>
                <div className="text-sm text-gray-500">
                    Progression Globale: {Math.round(data.progress)}%
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.goals.map((goal) => {
                    const percentage = Math.min(100, (goal.current / goal.target) * 100);

                    return (
                        <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${goal.category === 'social' ? 'bg-blue-100 text-blue-800' :
                                            goal.category === 'productivity' ? 'bg-green-100 text-green-800' :
                                                goal.category === 'learning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-purple-100 text-purple-800'
                                        }`}>
                                        {goal.category}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{goal.current}</div>
                                    <div className="text-xs text-gray-500">/ {goal.target} {goal.unit}</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

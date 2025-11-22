import React from 'react';

interface MoodTrackerProps {
    data: {
        dailyMood: { date: string; mood: number; factors: string[] }[];
        sentimentTrend: { date: string; positive: number; negative: number; neutral: number }[];
        stressIndicators: string[];
        wellbeingScore: number;
    };
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Suivi d'Humeur</h3>
                <div className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                    Score Bien-être: {data.wellbeingScore}/100
                </div>
            </div>

            <div className="space-y-4">
                {data.dailyMood.map((day, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="font-medium text-gray-900">{day.date}</div>
                            <div className="text-sm text-gray-500">
                                Facteurs: {day.factors.join(', ')}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${day.mood > 60 ? 'bg-green-500' :
                                            day.mood < 40 ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}
                                    style={{ width: `${day.mood}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium w-8">{Math.round(day.mood)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {data.stressIndicators.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Indicateurs de Stress Détectés</h4>
                    <ul className="list-disc list-inside text-sm text-red-700">
                        {data.stressIndicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

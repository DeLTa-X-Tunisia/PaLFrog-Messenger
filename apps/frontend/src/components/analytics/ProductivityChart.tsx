import React from 'react';

interface ProductivityChartProps {
    data: {
        timeSpent: number;
        focusSessions: number;
        interruptions: number;
        peakProductivityHours: number[];
        weeklyTrend: { date: string; productivity: number }[];
    };
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Analyse de Productivité</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Sessions Focus</div>
                    <div className="text-2xl font-bold text-blue-900">{data.focusSessions}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 mb-1">Interruptions</div>
                    <div className="text-2xl font-bold text-orange-900">{data.interruptions}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Heures de Pointe</div>
                    <div className="text-2xl font-bold text-green-900">
                        {data.peakProductivityHours.map(h => `${h}h`).join(', ')}
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Tendance Hebdomadaire</h4>
                <div className="h-48 flex items-end space-x-2">
                    {data.weeklyTrend.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                            <div
                                className="w-full bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                                style={{ height: `${day.productivity}%` }}
                            />
                            <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

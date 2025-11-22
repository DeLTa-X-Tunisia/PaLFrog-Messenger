import React from 'react';

interface InsightsPanelProps {
    insights: string[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
    if (insights.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                <span className="mr-2">💡</span> Insights & Recommandations
            </h3>
            <div className="grid gap-3">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-indigo-50 text-indigo-800 flex items-start">
                        <span className="mr-2 mt-0.5">•</span>
                        <span>{insight}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

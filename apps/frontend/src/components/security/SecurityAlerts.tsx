import React, { useEffect, useState } from 'react';
import { securityAlertsService } from '../../services/security-alerts.service';

interface SecurityAlert {
    id: string;
    type: 'warning' | 'info' | 'critical' | 'success';
    title: string;
    message: string;
    action?: {
        label: string;
        callback: () => void;
    };
    timestamp: Date;
    dismissible: boolean;
}

export const SecurityAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

    useEffect(() => {
        const unsubscribe = securityAlertsService.subscribe((newAlerts) => {
            setAlerts(newAlerts);
        });
        return () => unsubscribe();
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`p-4 rounded-lg shadow-lg border-l-4 ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                            alert.type === 'critical' ? 'bg-red-50 border-red-500 text-red-800' :
                                alert.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                                    'bg-blue-50 border-blue-500 text-blue-800'
                        }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-sm">{alert.title}</h4>
                            <p className="text-sm mt-1">{alert.message}</p>
                        </div>
                        {alert.dismissible && (
                            <button
                                onClick={() => securityAlertsService.dismissAlert(alert.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {alert.action && (
                        <button
                            onClick={alert.action.callback}
                            className="mt-2 text-sm font-medium underline hover:no-underline"
                        >
                            {alert.action.label}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

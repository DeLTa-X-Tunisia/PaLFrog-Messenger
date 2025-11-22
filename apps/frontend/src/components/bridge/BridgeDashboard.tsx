import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../stores/bridge.store';
import { useTranslation } from '../../hooks/useTranslation';
import { WhatsAppBridge } from './bridges/WhatsAppBridge';
import { TelegramBridge } from './bridges/TelegramBridge';
import { SignalBridge } from './bridges/SignalBridge';
import { EmailBridge } from './bridges/EmailBridge';
import { SMSBridge } from './bridges/SMSBridge';

export const BridgeDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { connections } = useBridgeStore();
    const [activeTab, setActiveTab] = useState('whatsapp');

    const bridgeComponents = {
        whatsapp: WhatsAppBridge,
        telegram: TelegramBridge,
        signal: SignalBridge,
        email: EmailBridge,
        sms: SMSBridge
    };

    const ActiveBridgeComponent = bridgeComponents[activeTab as keyof typeof bridgeComponents];

    const getConnectionStatus = (service: string) => {
        const connection = connections.find(conn => conn.id === `${service}-bridge`);
        return connection?.status || 'disconnected';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-500';
            case 'syncing': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🌉 {t('bridge.dashboardTitle')}
                </h2>
                <p className="text-gray-600">
                    {t('bridge.dashboardDescription')}
                </p>
            </div>

            {/* Navigation par onglets */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {[
                            { id: 'whatsapp', name: 'WhatsApp', icon: '💚' },
                            { id: 'telegram', name: 'Telegram', icon: '💙' },
                            { id: 'signal', name: 'Signal', icon: '📨' },
                            { id: 'email', name: 'Email', icon: '📧' },
                            { id: 'sms', name: 'SMS', icon: '📱' }
                        ].map((tab) => {
                            const status = getConnectionStatus(tab.id);

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.name}</span>
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Contenu de l'onglet actif */}
                <div className="p-6">
                    <ActiveBridgeComponent />
                </div>
            </div>

            {/* Statistiques globales */}
            <BridgeStatistics />
        </div>
    );
};

const BridgeStatistics: React.FC = () => {
    const { connections } = useBridgeStore();
    const { t } = useTranslation();

    const totalStats = connections.reduce((acc, conn) => ({
        messagesImported: acc.messagesImported + conn.statistics.messagesImported,
        messagesExported: acc.messagesExported + conn.statistics.messagesExported,
        activeConnections: acc.activeConnections + (conn.status === 'connected' ? 1 : 0)
    }), { messagesImported: 0, messagesExported: 0, activeConnections: 0 });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                    {totalStats.messagesImported}
                </div>
                <div className="text-gray-600">{t('bridge.messagesImported')}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                    {totalStats.messagesExported}
                </div>
                <div className="text-gray-600">{t('bridge.messagesExported')}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                    {totalStats.activeConnections}
                </div>
                <div className="text-gray-600">{t('bridge.activeConnections')}</div>
            </div>
        </div>
    );
};

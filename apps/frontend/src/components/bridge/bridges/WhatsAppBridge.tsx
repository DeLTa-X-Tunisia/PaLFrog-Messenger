import React, { useState } from 'react';
import { useBridgeStore } from '../../../stores/bridge.store';
import { useTranslation } from '../../../hooks/useTranslation';
import toast from 'react-hot-toast';

export const WhatsAppBridge: React.FC = () => {
    const { t } = useTranslation();
    const {
        connectToService,
        disconnectFromService,
        importFromService,
        connections
    } = useBridgeStore();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [importOptions, setImportOptions] = useState({
        contactId: '',
        limit: 100
    });

    const connection = connections.find(conn => conn.id === 'whatsapp-bridge');
    const isConnected = connection?.status === 'connected';

    const handleConnect = async () => {
        if (!phoneNumber) return;

        setIsConnecting(true);
        try {
            await connectToService('whatsapp', { phoneNumber });
            toast.success(t('bridge.connected'));
        } catch (error) {
            toast.error(t('bridge.connectionFailed'));
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnectFromService('whatsapp');
        toast.success(t('bridge.disconnected'));
    };

    const handleImport = async () => {
        if (!importOptions.contactId) return;

        try {
            await importFromService('whatsapp', importOptions);
            toast.success(t('bridge.importSuccess'));
        } catch (error) {
            toast.error(t('bridge.importFailed'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Statut de connexion */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">WhatsApp Bridge</h3>
                    <p className="text-gray-600">
                        {isConnected
                            ? t('bridge.connectedDescription')
                            : t('bridge.disconnectedDescription')
                        }
                    </p>
                </div>

                <div className={`px-4 py-2 rounded-full text-white text-sm font-medium ${isConnected ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                    {isConnected ? t('bridge.connected') : t('bridge.disconnected')}
                </div>
            </div>

            {/* Formulaire de connexion */}
            {!isConnected && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-4">
                        {t('bridge.connectToService', { service: 'WhatsApp' })}
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-800 mb-2">
                                {t('bridge.phoneNumber')}
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+33 1 23 45 67 89"
                                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || !phoneNumber}
                            className="w-full px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                            {isConnecting ? t('common.loading') : t('bridge.connect')}
                        </button>
                    </div>
                </div>
            )}

            {/* Actions connectées */}
            {isConnected && (
                <div className="space-y-6">
                    {/* Import de messages */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">
                            {t('bridge.importMessages')}
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('bridge.contactId')}
                                </label>
                                <input
                                    type="text"
                                    value={importOptions.contactId}
                                    onChange={(e) => setImportOptions(prev => ({
                                        ...prev,
                                        contactId: e.target.value
                                    }))}
                                    placeholder="ID du contact WhatsApp"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('bridge.importLimit')}
                                </label>
                                <input
                                    type="number"
                                    value={importOptions.limit}
                                    onChange={(e) => setImportOptions(prev => ({
                                        ...prev,
                                        limit: parseInt(e.target.value)
                                    }))}
                                    min="1"
                                    max="1000"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!importOptions.contactId}
                                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {t('bridge.startImport')}
                            </button>
                        </div>
                    </div>

                    {/* Paramètres */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">
                            {t('bridge.settings')}
                        </h4>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">{t('bridge.autoImport')}</span>
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        defaultChecked={connection?.settings.autoImport}
                                        className="sr-only"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
                                    <div className="absolute top-1 w-4 h-4 bg-white rounded-full transform translate-x-1"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">{t('bridge.autoExport')}</span>
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        defaultChecked={connection?.settings.autoExport}
                                        className="sr-only"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
                                    <div className="absolute top-1 w-4 h-4 bg-white rounded-full transform translate-x-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Déconnexion */}
                    <button
                        onClick={handleDisconnect}
                        className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                        {t('bridge.disconnect')}
                    </button>
                </div>
            )}

            {/* Informations de sécurité */}
            <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                <div className="flex items-start space-x-3">
                    <span className="text-yellow-600 text-lg">🔒</span>
                    <div>
                        <h5 className="font-semibold text-yellow-800">
                            {t('bridge.securityNote')}
                        </h5>
                        <p className="text-yellow-700 text-sm mt-1">
                            {t('bridge.whatsappSecurity')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

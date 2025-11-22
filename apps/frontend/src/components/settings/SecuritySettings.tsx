import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { useAuthStore } from '../../stores/auth.store';
import { cryptoService } from '../../services/crypto.service';
import { useSecurityStore } from '../../stores/security.store';
import { ConfirmModal } from '../ui/ConfirmModal';
import { SecurityDashboard } from '../security/SecurityDashboard';
import { TwoFactorSetup } from '../auth/TwoFactorSetup';
import { AIControlPanel } from '../ai/AIControlPanel';

export const SecuritySettings: React.FC = () => {
    const { isEncryptionEnabled } = useWebRTCStore();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const handleEncryptionToggle = (enabled: boolean) => {
        useWebRTCStore.setState({ isEncryptionEnabled: enabled });
        localStorage.setItem('palfrog-encryption-enabled', JSON.stringify(enabled));
        useSecurityStore.getState().calculateScore();
    };

    const handleRegenerateKeys = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Régénérer les clés',
            message: 'Attention : La régénération des clés rendra illisibles vos anciens messages chiffrés. Continuer ?',
            onConfirm: async () => {
                setIsRegenerating(true);
                try {
                    const { user } = useAuthStore.getState();
                    if (!user) {
                        throw new Error('User not authenticated');
                    }

                    await cryptoService.clearKeys();
                    await cryptoService.initialize();
                    toast.success('Clés régénérées avec succès !');
                } catch (error) {
                    toast.error('Erreur lors de la régénération des clés');
                    console.error('Key regeneration failed:', error);
                } finally {
                    setIsRegenerating(false);
                    setConfirmModal(previous => ({ ...previous, isOpen: false }));
                }
            }
        });
    };

    const handleExportKeys = () => {
        try {
            toast('Fonctionnalité d\'export à implémenter', { icon: '🚧' });
        } catch (error) {
            toast.error('Erreur lors de l\'export des clés');
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(previous => ({ ...previous, isOpen: false }))}
                isDangerous
            />

            <SecurityDashboard />
            <TwoFactorSetup />
            <AIControlPanel />

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Sécurité et Chiffrement</h3>

                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="font-medium text-gray-900">Chiffrement de bout en bout</p>
                        <p className="text-sm text-gray-500">Protège vos messages avec un chiffrement AES-256-GCM</p>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                        <input
                            type="checkbox"
                            checked={isEncryptionEnabled}
                            onChange={event => handleEncryptionToggle(event.target.checked)}
                            className="sr-only"
                        />
                        <div
                            className={`w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${isEncryptionEnabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                            onClick={() => handleEncryptionToggle(!isEncryptionEnabled)}
                        />
                        <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 pointer-events-none ${isEncryptionEnabled ? 'transform translate-x-7' : 'transform translate-x-1'
                                }`}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Régénérer les clés</p>
                        <p className="text-sm text-gray-500">Crée de nouvelles clés de chiffrement</p>
                    </div>
                    <button
                        onClick={handleRegenerateKeys}
                        disabled={isRegenerating}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                    >
                        {isRegenerating ? 'Génération...' : 'Régénérer'}
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Sauvegarder les clés</p>
                        <p className="text-sm text-gray-500">Exportez vos clés pour les sauvegarder</p>
                    </div>
                    <button
                        onClick={handleExportKeys}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Exporter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Paramètres de Confidentialité</h3>
                <div className="space-y-4">
                    <PrivacyToggle
                        id="profile-visible"
                        label="Profil visible publiquement"
                        description="Autoriser les autres utilisateurs à voir votre profil"
                    />
                    <PrivacyToggle
                        id="contact-restrictions"
                        label="Restrictions de contact"
                        description="N'autoriser que vos contacts à vous envoyer des messages"
                    />
                    <PrivacyToggle
                        id="read-receipts"
                        label="Accusés de lecture"
                        description="Afficher quand vous avez lu les messages"
                    />
                </div>
            </div>
        </div>
    );
};

const PrivacyToggle: React.FC<{ id: string; label: string; description: string }> = ({ id, label, description }) => {
    const [isEnabled, setIsEnabled] = React.useState(localStorage.getItem(`palfrog-${id}`) === 'true');

    const handleToggle = (nextValue: boolean) => {
        setIsEnabled(nextValue);
        localStorage.setItem(`palfrog-${id}`, nextValue.toString());
        useSecurityStore.getState().calculateScore();
    };

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={() => handleToggle(!isEnabled)}
                className="relative inline-block w-12 h-6 focus:outline-none"
                type="button"
                aria-pressed={isEnabled}
                aria-label={label}
            >
                <input type="checkbox" checked={isEnabled} onChange={() => { }} className="sr-only" />
                <div
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${isEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                />
                <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${isEnabled ? 'transform translate-x-7' : 'transform translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
};

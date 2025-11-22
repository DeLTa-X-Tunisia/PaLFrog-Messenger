import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

export const TwoFactorSetup: React.FC = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'qr' | 'verify'>('qr');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEnable2FA = async () => {
        setIsLoading(true);
        try {
            // Générer le QR Code
            const response = await fetch('/api/auth/2fa/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            setQrCodeUrl(data.qrCodeUrl);
            setStep('verify');
        } catch (error) {
            console.error('2FA setup failed:', error);
            toast.error('Erreur lors de la configuration 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode })
            });

            if (response.ok) {
                // 2FA activé avec succès
                toast.success(t('security.twoFactorEnabled'));
            } else {
                toast.error(t('security.invalidCode'));
            }
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Erreur de vérification');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔒 {t('security.twoFactorAuth')}
            </h3>

            {step === 'qr' && (
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        {t('security.scanQRCode')}
                    </p>
                    <button
                        onClick={handleEnable2FA}
                        disabled={isLoading}
                        className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? t('common.loading') : t('security.enable2FA')}
                    </button>
                </div>
            )}

            {step === 'verify' && qrCodeUrl && (
                <div className="text-center">
                    <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="mx-auto mb-4 w-48 h-48"
                    />
                    <p className="text-sm text-gray-600 mb-4">
                        {t('security.scanWithAuthenticator')}
                    </p>

                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder={t('security.enterVerificationCode')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-center text-xl tracking-widest"
                        maxLength={6}
                    />

                    <button
                        onClick={handleVerifyCode}
                        disabled={isLoading || verificationCode.length !== 6}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? t('common.loading') : t('security.verifyAndEnable')}
                    </button>
                </div>
            )}
        </div>
    );
};

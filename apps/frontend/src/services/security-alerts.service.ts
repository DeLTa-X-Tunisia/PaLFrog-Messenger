import { useWebRTCStore } from '../stores/webrtc.store';

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

class SecurityAlertsService {
    private alerts: SecurityAlert[] = [];
    private subscribers: Array<(alerts: SecurityAlert[]) => void> = [];

    // Vérifications proactives
    checkForSecurityIssues() {
        this.checkEncryptionStatus();
        this.checkNetworkSecurity();
        this.checkFileSecurity();
        this.checkPrivacySettings();
    }

    private checkEncryptionStatus() {
        const { isEncryptionEnabled } = useWebRTCStore.getState();

        if (!isEncryptionEnabled) {
            this.addAlert({
                id: 'encryption-disabled',
                type: 'warning',
                title: 'Chiffrement désactivé',
                message: 'Vos messages ne sont pas chiffrés. Activez le chiffrement pour protéger vos conversations.',
                action: {
                    label: 'Activer',
                    callback: () => {
                        useWebRTCStore.getState().isEncryptionEnabled = true;
                        this.dismissAlert('encryption-disabled');
                    }
                },
                dismissible: true
            });
        }
    }

    private checkNetworkSecurity() {
        // Vérifier si on est sur un réseau potentiellement non sécurisé
        if (this.isSuspiciousNetwork()) {
            this.addAlert({
                id: 'suspicious-network',
                type: 'warning',
                title: 'Réseau non sécurisé détecté',
                message: 'Votre connexion réseau peut être vulnérable. Évitez les transactions sensibles.',
                dismissible: true
            });
        }
    }

    private checkFileSecurity() {
        const recentDownloads = parseInt(localStorage.getItem('palfrog-recent-downloads') || '0');

        if (recentDownloads > 5) {
            this.addAlert({
                id: 'high-download-activity',
                type: 'info',
                title: 'Activité de téléchargement élevée',
                message: 'Vous avez téléchargé plusieurs fichiers récemment. Vérifiez leur sécurité.',
                dismissible: true
            });
        }
    }

    private checkPrivacySettings() {
        const profilePublic = localStorage.getItem('palfrog-profile-visible') === 'public';

        if (profilePublic) {
            this.addAlert({
                id: 'profile-public',
                type: 'info',
                title: 'Profil public',
                message: 'Votre profil est visible publiquement. Pensez à vérifier vos paramètres de confidentialité.',
                dismissible: true
            });
        }
    }

    private isSuspiciousNetwork(): boolean {
        // Logique de détection de réseaux suspects
        return navigator.userAgent.includes('Mobile') &&
            !window.location.protocol.includes('https');
    }

    addAlert(alert: Omit<SecurityAlert, 'timestamp'>) {
        const newAlert: SecurityAlert = {
            ...alert,
            timestamp: new Date()
        };

        // Éviter les doublons
        if (!this.alerts.find(a => a.id === newAlert.id)) {
            this.alerts.push(newAlert);
            this.notifySubscribers();
        }
    }

    dismissAlert(alertId: string) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.notifySubscribers();
    }

    getAlerts(): SecurityAlert[] {
        return this.alerts;
    }

    subscribe(callback: (alerts: SecurityAlert[]) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback([...this.alerts]));
    }
}

export const securityAlertsService = new SecurityAlertsService();

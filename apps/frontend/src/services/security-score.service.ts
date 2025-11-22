import { useAuthStore } from '../stores/auth.store';
import { useWebRTCStore } from '../stores/webrtc.store';
import { useAIStore } from '../stores/ai.store';
import { cryptoService } from './crypto.service';

interface SecurityMetric {
    id: string;
    name: string;
    description: string;
    weight: number;
    currentValue: number;
    maxValue: number;
    improvementTips: string[];
}

interface SecurityScore {
    overall: number;
    breakdown: {
        authentication: number;
        encryption: number;
        privacy: number;
        behavior: number;
        network: number;
    };
    level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    trends: {
        daily: number[];
        weekly: number[];
        monthly: number[];
    };
}

class SecurityScoreService {
    private metrics: Map<string, SecurityMetric> = new Map();
    private updateCallbacks: Array<(score: SecurityScore) => void> = [];

    constructor() {
        this.initializeMetrics();
        this.startPeriodicScoring();
    }

    private initializeMetrics() {
        this.metrics.set('password_strength', {
            id: 'password_strength',
            name: 'Force du mot de passe',
            description: 'Complexité et longueur de votre mot de passe',
            weight: 15,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Utilisez un mot de passe de 12 caractères minimum',
                'Combine lettres, chiffres et caractères spéciaux',
                'Évitez les mots du dictionnaire'
            ]
        });

        this.metrics.set('two_factor', {
            id: 'two_factor',
            name: 'Double authentification',
            description: 'Protection supplémentaire avec 2FA',
            weight: 20,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Activez la double authentification',
                'Utilisez une application d\'authentification',
                'Sauvegardez vos codes de récupération'
            ]
        });

        this.metrics.set('encryption_usage', {
            id: 'encryption_usage',
            name: 'Chiffrement des messages',
            description: 'Pourcentage de messages chiffrés',
            weight: 25,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Activez le chiffrement de bout en bout',
                'Vérifiez le statut de chiffrement avant d\'envoyer',
                'Utilisez des clés fortes'
            ]
        });

        this.metrics.set('file_security', {
            id: 'file_security',
            name: 'Sécurité des fichiers',
            description: 'Analyse des fichiers partagés',
            weight: 10,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Scannez les fichiers avant ouverture',
                'Évitez les exécutables inconnus',
                'Vérifiez les extensions de fichiers'
            ]
        });

        this.metrics.set('privacy_settings', {
            id: 'privacy_settings',
            name: 'Paramètres de confidentialité',
            description: 'Configuration de vos préférences de vie privée',
            weight: 15,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Limitez les informations de profil publiques',
                'Contrôlez qui peut vous contacter',
                'Désactivez la collecte de données optionnelle'
            ]
        });

        this.metrics.set('update_habits', {
            id: 'update_habits',
            name: 'Mises à jour',
            description: 'Délai d\'application des mises à jour de sécurité',
            weight: 10,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Activez les mises à jour automatiques',
                'Installez les correctifs rapidement',
                'Vérifiez régulièrement les nouvelles versions'
            ]
        });

        this.metrics.set('network_security', {
            id: 'network_security',
            name: 'Sécurité réseau',
            description: 'Utilisation de réseaux sécurisés',
            weight: 5,
            currentValue: 0,
            maxValue: 100,
            improvementTips: [
                'Évitez les réseaux WiFi publics',
                'Utilisez un VPN sur réseaux non fiables',
                'Vérifiez la sécurité de votre connexion'
            ]
        });
    }

    async calculateSecurityScore(): Promise<SecurityScore> {
        await this.updateAllMetrics();

        const breakdown = {
            authentication: this.calculateCategoryScore(['password_strength', 'two_factor']),
            encryption: this.calculateCategoryScore(['encryption_usage']),
            privacy: this.calculateCategoryScore(['privacy_settings']),
            behavior: this.calculateCategoryScore(['file_security', 'update_habits']),
            network: this.calculateCategoryScore(['network_security'])
        };

        const overall = Math.round(
            (breakdown.authentication + breakdown.encryption + breakdown.privacy +
                breakdown.behavior + breakdown.network) / 5
        );

        const level = this.getSecurityLevel(overall);

        const score: SecurityScore = {
            overall,
            breakdown,
            level,
            trends: await this.getTrends()
        };

        // Notifier les observateurs
        this.notifyCallbacks(score);

        return score;
    }

    private calculateCategoryScore(metricIds: string[]): number {
        let totalScore = 0;
        let totalWeight = 0;

        metricIds.forEach(id => {
            const metric = this.metrics.get(id);
            if (metric) {
                totalScore += metric.currentValue * metric.weight;
                totalWeight += metric.weight;
            }
        });

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }

    private getSecurityLevel(score: number): SecurityScore['level'] {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        if (score >= 40) return 'poor';
        return 'critical';
    }

    private async updateAllMetrics() {
        // Force du mot de passe (simulé - en réel, vérifier côté serveur)
        this.metrics.get('password_strength')!.currentValue = 70;

        // 2FA
        const has2FA = await this.check2FAStatus();
        this.metrics.get('two_factor')!.currentValue = has2FA ? 100 : 0;

        // Chiffrement
        const encryptionUsage = await this.calculateEncryptionUsage();
        this.metrics.get('encryption_usage')!.currentValue = encryptionUsage;

        // Paramètres de confidentialité
        const privacyScore = this.calculatePrivacyScore();
        this.metrics.get('privacy_settings')!.currentValue = privacyScore;

        // Habitudes de mise à jour
        this.metrics.get('update_habits')!.currentValue = 80;

        // Sécurité réseau
        const networkScore = this.assessNetworkSecurity();
        this.metrics.get('network_security')!.currentValue = networkScore;

        // Sécurité des fichiers
        const fileSecurity = await this.assessFileSecurity();
        this.metrics.get('file_security')!.currentValue = fileSecurity;
    }

    private async check2FAStatus(): Promise<boolean> {
        // Implémentation réelle vérifierait avec le backend
        return localStorage.getItem('palfrog-2fa-enabled') === 'true';
    }

    private async calculateEncryptionUsage(): Promise<number> {
        const { messages, isEncryptionEnabled } = useWebRTCStore.getState();

        if (!isEncryptionEnabled) return 0;

        const encryptedMessages = messages.filter(msg =>
            msg.type === 'text' && (msg as any).encrypted !== false
        ).length;

        return messages.length > 0
            ? Math.round((encryptedMessages / messages.length) * 100)
            : 100;
    }

    private calculatePrivacyScore(): number {
        let score = 50; // Base score

        // Vérifier les paramètres de confidentialité
        const settings = {
            profileVisibility: localStorage.getItem('palfrog-profile-visible') !== 'public',
            contactRestrictions: localStorage.getItem('palfrog-contact-restrictions') === 'enabled',
            dataCollection: localStorage.getItem('palfrog-data-collection') === 'minimal'
        };

        if (settings.profileVisibility) score += 20;
        if (settings.contactRestrictions) score += 20;
        if (settings.dataCollection) score += 10;

        return Math.min(score, 100);
    }

    private assessNetworkSecurity(): number {
        // Vérifier le type de connexion
        const connection = (navigator as any).connection;
        let score = 70;

        if (connection) {
            if (connection.effectiveType === '4g') score += 10;
            if (connection.saveData) score += 10;
            if (!this.isPublicWiFi()) score += 10;
        }

        return Math.min(score, 100);
    }

    private isPublicWiFi(): boolean {
        // Détection basique des réseaux publics
        const publicKeywords = ['free', 'public', 'wifi', 'hotspot', 'guest'];
        return publicKeywords.some(keyword =>
            navigator.userAgent.toLowerCase().includes(keyword)
        );
    }

    private async assessFileSecurity(): Promise<number> {
        // Vérifier les habitudes de sécurité des fichiers
        const dangerousDownloads = parseInt(localStorage.getItem('palfrog-dangerous-downloads') || '0');
        const filesScanned = parseInt(localStorage.getItem('palfrog-files-scanned') || '0');

        let score = 80;

        if (dangerousDownloads > 0) score -= dangerousDownloads * 10;
        if (filesScanned > 10) score += 10;

        return Math.max(0, Math.min(score, 100));
    }

    private async getTrends() {
        const stored = localStorage.getItem('palfrog-security-trends');
        if (stored) {
            return JSON.parse(stored);
        }

        return {
            daily: Array(7).fill(0).map(() => Math.floor(Math.random() * 30) + 70),
            weekly: Array(4).fill(0).map(() => Math.floor(Math.random() * 20) + 75),
            monthly: Array(6).fill(0).map(() => Math.floor(Math.random() * 15) + 80)
        };
    }

    private startPeriodicScoring() {
        // Recalculer le score toutes les heures
        setInterval(() => {
            this.calculateSecurityScore();
        }, 60 * 60 * 1000);

        // Recalculer aussi quand l'utilisateur revient en ligne
        window.addEventListener('online', () => {
            this.calculateSecurityScore();
        });
    }

    onScoreUpdate(callback: (score: SecurityScore) => void) {
        this.updateCallbacks.push(callback);
    }

    private notifyCallbacks(score: SecurityScore) {
        this.updateCallbacks.forEach(cb => cb(score));
    }

    getImprovementTips(): string[] {
        const tips: string[] = [];

        this.metrics.forEach(metric => {
            if (metric.currentValue < 80) {
                tips.push(...metric.improvementTips.slice(0, 1));
            }
        });

        // Éviter les doublons et limiter à 3 conseils
        return [...new Set(tips)].slice(0, 3);
    }

    getMetrics(): SecurityMetric[] {
        return Array.from(this.metrics.values());
    }
}

export const securityScoreService = new SecurityScoreService();

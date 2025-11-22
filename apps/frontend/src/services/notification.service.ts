import { useWebRTCStore } from '../stores/webrtc.store';
import { showInAppNotification } from './toast-helper';

class NotificationService {
    private permission: NotificationPermission = 'default';
    private audioContext: AudioContext | null = null;
    private notificationSound: HTMLAudioElement | null = null;
    private isWindowFocused = true;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Vérifier la permission
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }

        // Initialiser l'audio
        this.initializeAudio();

        // Surveiller la visibilité de la fenêtre
        this.setupWindowListeners();
    }

    private initializeAudio() {
        try {
            // Créer un son de notification simple avec Web Audio API
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }

            // Alternative: fichier audio externe
            this.notificationSound = new Audio();
            // Son simple encodé en base64 (bip court)
            this.notificationSound.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
            this.notificationSound.volume = 0.3;
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }

    private setupWindowListeners() {
        // Vérifier si la fenêtre est focus
        window.addEventListener('focus', () => {
            this.isWindowFocused = true;
        });

        window.addEventListener('blur', () => {
            this.isWindowFocused = false;
        });

        // Écouter les changements de visibilité de l'onglet
        document.addEventListener('visibilitychange', () => {
            this.isWindowFocused = !document.hidden;
        });
    }

    private getPreference(key: string, defaultValue: boolean): boolean {
        const stored = localStorage.getItem(`palfrog-${key}`);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (this.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }

        return this.permission === 'granted';
    }

    async shouldNotify(): Promise<boolean> {
        const desktopEnabled = this.getPreference('desktop-notifications', true);
        const permissionGranted = await this.requestPermission();

        return desktopEnabled && permissionGranted;
    }

    async shouldPlaySound(): Promise<boolean> {
        return this.getPreference('sounds-enabled', true);
    }

    async showNotification(title: string, options: NotificationOptions = {}) {
        const shouldNotify = !this.isWindowFocused || options.requireInteraction;

        if (!shouldNotify && !options.data?.force) {
            return; // Pas de notification si la fenêtre est focus, sauf si forcé
        }

        // Vérifier la permission
        if (!await this.requestPermission()) {
            return;
        }

        const notificationOptions: NotificationOptions = {
            icon: '/vite.svg', // Utiliser l'icône par défaut de Vite pour l'instant
            badge: '/vite.svg',
            tag: 'palfrog-message', // Grouper les notifications
            requireInteraction: false,
            silent: false,
            ...options
        };

        try {
            const notification = new Notification(title, notificationOptions);

            // Fermer automatiquement après 5 secondes
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Gérer le clic sur la notification
            notification.onclick = async () => {
                window.focus();
                notification.close();

                // Naviguer vers le chat spécifique
                if (options.data?.chatId) {
                    // Import dynamique pour éviter les cycles si nécessaire, 
                    // mais ici on utilise l'import statique car on est dans une callback
                    const { useWebRTCStore } = await import('../stores/webrtc.store');
                    useWebRTCStore.getState().setActiveChat(options.data.chatId);
                }
            };

            return notification;
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async playNotificationSound(type: 'message' | 'call' | 'system' = 'message') {
        if (!this.audioContext) return;

        // Vérifier les préférences
        if (!await this.shouldPlaySound()) return;

        try {
            // Recréer le contexte audio si suspendu (politique autoplay)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Sons différents selon le type
            switch (type) {
                case 'message':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
                    break;
                case 'call':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.4);
                    break;
                case 'system':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    break;
            }

            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);

        } catch (error) {
            console.warn('Failed to play notification sound:', error);

            // Fallback: utiliser l'élément audio
            try {
                if (this.notificationSound) {
                    this.notificationSound.currentTime = 0;
                    await this.notificationSound.play();
                }
            } catch (audioError) {
                console.warn('Audio fallback also failed:', audioError);
            }
        }
    }

    async notifyNewMessage(message: {
        id: string;
        content: string;
        sender: string;
        chatId: string;
    }) {
        // Note: La vérification activeChat est faite par l'appelant (Store)
        // pour éviter les dépendances circulaires ici.

        // Son de notification
        await this.playNotificationSound('message');

        // Notification In-App uniquement (Toast stylé intégré dans PalFroG)
        // Plus de notification système externe - design cohérent avec l'interface
        showInAppNotification(
            `Message de ${message.sender}`,
            message.content || '📎 Fichier joint',
            {
                type: 'message',
                onClick: async () => {
                    const { useWebRTCStore } = await import('../stores/webrtc.store');
                    useWebRTCStore.getState().setActiveChat(message.chatId);
                    window.focus();
                }
            }
        );

        // Optionnel: notification dans l'onglet
        this.updateTabTitle(`(1) Palfrog`);
    }

    async notifyUserOnline(username: string) {
        // Utiliser la notification in-app via le store
        const { useWebRTCStore } = await import('../stores/webrtc.store');
        useWebRTCStore.getState().showOnlineNotification(username);
    }

    async notifyUserStatusChange(username: string, status: string, userId?: string) {
        // Notification In-App uniquement via le store (UserOnlineNotification)
        // Plus de notification système externe - tout est intégré dans l'interface PalFroG
        const { useWebRTCStore } = await import('../stores/webrtc.store');
        useWebRTCStore.getState().showOnlineNotification(username, status, userId);
    }

    async notifyIncomingCall(callerName: string) {
        await this.playNotificationSound('call');

        // Notification In-App uniquement - intégrée dans l'interface PalFroG
        // Plus de notification système externe pour un design cohérent
        // Affiche le nom d'utilisateur lisible au lieu de l'UUID technique
        showInAppNotification(
            `📞 Appel entrant`,
            `${callerName} essaie de vous joindre...`,
            {
                type: 'call',
                duration: 30000, // Durée plus longue pour un appel
                onClick: () => {
                    window.focus();
                }
            }
        );
    }

    private updateTabTitle(notificationTitle: string) {
        const originalTitle = document.title;

        // Alterner le titre pour un effet clignotant
        let isOriginal = true;
        const blinkInterval = setInterval(() => {
            document.title = isOriginal ? notificationTitle : originalTitle;
            isOriginal = !isOriginal;
        }, 1000);

        // Arrêter après 5 secondes ou quand la fenêtre redevient active
        const stopBlinking = () => {
            clearInterval(blinkInterval);
            document.title = originalTitle;
            window.removeEventListener('focus', stopBlinking);
        };

        setTimeout(stopBlinking, 5000);
        window.addEventListener('focus', stopBlinking);
    }

    // Nettoyage
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

export const notificationService = new NotificationService();

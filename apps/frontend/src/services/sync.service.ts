import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PalFrogDB extends DBSchema {
    messages: {
        key: string;
        value: {
            id: string;
            content: string;
            senderId: string;
            receiverId: string;
            timestamp: Date;
            status: 'pending' | 'sent' | 'delivered' | 'read';
        };
        indexes: { 'by-status': string };
    };
    contacts: {
        key: string;
        value: {
            id: string;
            username: string;
            publicKey: string;
            lastSeen: Date;
        };
    };
}

class SyncService {
    private db: IDBPDatabase<PalFrogDB> | null = null;
    private isOnline: boolean = navigator.onLine;
    private syncQueue: any[] = [];

    constructor() {
        this.initDB();
        this.setupListeners();
    }

    private async initDB() {
        this.db = await openDB<PalFrogDB>('palfrog-db', 1, {
            upgrade(db) {
                const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                messageStore.createIndex('by-status', 'status');

                db.createObjectStore('contacts', { keyPath: 'id' });
            },
        });
    }

    private setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async saveMessage(message: any) {
        if (!this.db) return;

        await this.db.put('messages', {
            ...message,
            status: this.isOnline ? 'sent' : 'pending'
        });

        if (this.isOnline) {
            // Envoyer immédiatement
            await this.sendMessageToServer(message);
        } else {
            // Ajouter à la file d'attente
            this.syncQueue.push({ type: 'message', data: message });
        }
    }

    private async processSyncQueue() {
        if (!this.db || this.syncQueue.length === 0) return;

        console.log('Processing sync queue...');

        // Récupérer les messages en attente
        const pendingMessages = await this.db.getAllFromIndex('messages', 'by-status', 'pending');

        for (const msg of pendingMessages) {
            try {
                await this.sendMessageToServer(msg);

                // Mettre à jour le statut local
                await this.db.put('messages', {
                    ...msg,
                    status: 'sent'
                });
            } catch (error) {
                console.error('Failed to sync message:', error);
            }
        }

        this.syncQueue = [];
    }

    private async sendMessageToServer(message: any) {
        // Simulation d'envoi au serveur
        return new Promise((resolve) => setTimeout(resolve, 500));
    }

    async getOfflineMessages() {
        if (!this.db) return [];
        return this.db.getAll('messages');
    }
}

export const syncService = new SyncService();

import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface ChatDBSchema extends DBSchema {
    messages: {
        key: string;
        value: {
            id: string;
            chatId: string;
            content: string;
            sender: string;
            timestamp: Date;
            type: 'text' | 'file' | 'system';
            encrypted: boolean;
        };
        indexes: {
            'by-chatId': string;
            'by-timestamp': Date;
        };
    };
    chats: {
        key: string;
        value: {
            id: string;
            participantId: string;
            participantName: string;
            lastMessage: string;
            lastActivity: Date;
            unreadCount: number;
        };
    };
}

class DatabaseService {
    private db: IDBPDatabase<ChatDBSchema> | null = null;
    private dbName = 'PalfrogChat';
    private version = 1;

    async initialize() {
        try {
            this.db = await openDB<ChatDBSchema>(this.dbName, this.version, {
                upgrade(db) {
                    // Store pour les messages
                    const messageStore = db.createObjectStore('messages', {
                        keyPath: 'id',
                    });
                    messageStore.createIndex('by-chatId', 'chatId');
                    messageStore.createIndex('by-timestamp', 'timestamp');

                    // Store pour les chats
                    db.createObjectStore('chats', {
                        keyPath: 'id',
                    });
                },
            });
            console.log('IndexedDB initialized successfully');
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }
    }

    async saveMessage(message: {
        id: string;
        chatId: string;
        content: string;
        sender: string;
        timestamp: Date;
        type: 'text' | 'file' | 'system';
        senderName?: string;
    }) {
        if (!this.db) await this.initialize();

        try {
            await this.db?.put('messages', {
                ...message,
                encrypted: false, // À implémenter avec WebCrypto API
            });

            // Mettre à jour le chat
            await this.updateChat(message.chatId, message, message.senderName);
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    }

    async getChatMessages(chatId: string, limit = 100): Promise<any[]> {
        if (!this.db) await this.initialize();

        try {
            const transaction = this.db!.transaction('messages', 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('by-chatId');

            const messages = await index.getAll(chatId);
            return messages
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .slice(-limit); // Derniers messages
        } catch (error) {
            console.error('Failed to get messages:', error);
            return [];
        }
    }

    async getChat(chatId: string) {
        if (!this.db) await this.initialize();
        try {
            return await this.db?.get('chats', chatId);
        } catch (error) {
            console.error('Failed to get chat:', error);
            return undefined;
        }
    }

    async updateChat(chatId: string, lastMessage: any, senderName?: string) {
        if (!this.db) await this.initialize();

        try {
            const existingChat = await this.db?.get('chats', chatId);

            const chat = {
                id: chatId,
                participantId: chatId, // Pour les chats 1-to-1
                participantName: lastMessage.sender === 'me' ? 'Moi' : (senderName || existingChat?.participantName || lastMessage.sender),
                lastMessage: lastMessage.content,
                lastActivity: lastMessage.timestamp,
                unreadCount: lastMessage.sender === 'me' ? 0 : (existingChat?.unreadCount || 0) + 1,
                avatarUrl: (existingChat as any)?.avatarUrl // Preserve avatarUrl
            };

            await this.db?.put('chats', chat);
        } catch (error) {
            console.error('Failed to update chat:', error);
        }
    }

    async updateChatAvatar(chatId: string, avatarUrl: string) {
        if (!this.db) await this.initialize();

        try {
            const chat = await this.db?.get('chats', chatId);
            if (chat) {
                (chat as any).avatarUrl = avatarUrl;
                await this.db?.put('chats', chat);
            }
        } catch (error) {
            console.error('Failed to update chat avatar:', error);
        }
    }

    async getAllChats(): Promise<any[]> {
        if (!this.db) await this.initialize();

        try {
            return await this.db?.getAll('chats') || [];
        } catch (error) {
            console.error('Failed to get chats:', error);
            return [];
        }
    }

    async clearChat(chatId: string) {
        if (!this.db) await this.initialize();

        try {
            const transaction = this.db!.transaction(['messages', 'chats'], 'readwrite');

            // Supprimer tous les messages du chat
            const messageStore = transaction.objectStore('messages');
            const index = messageStore.index('by-chatId');
            let cursor = await index.openCursor(IDBKeyRange.only(chatId));

            while (cursor) {
                await cursor.delete();
                cursor = await cursor.continue();
            }

            // Supprimer le chat
            await transaction.objectStore('chats').delete(chatId);

            await transaction.done;
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    }
}

export const databaseService = new DatabaseService();

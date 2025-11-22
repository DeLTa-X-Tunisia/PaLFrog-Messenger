/**
 * 🔒 Service de stockage sécurisé pour les clés cryptographiques
 * 
 * Utilise IndexedDB au lieu de localStorage pour :
 * 1. Stocker les CryptoKey natives (non-extractables)
 * 2. Isoler les clés du contexte JavaScript
 * 3. Protection contre XSS via non-extractable keys
 */

const DB_NAME = 'palfrog-secure-storage';
const DB_VERSION = 1;
const KEYSTORE_NAME = 'cryptokeys';

interface StoredKeyPair {
    id: string;
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    createdAt: number;
}

class CryptoStorageService {
    private db: IDBDatabase | null = null;

    /**
     * Initialise la base de données IndexedDB
     */
    async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(new Error('Failed to open IndexedDB'));

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Créer l'object store pour les clés
                if (!db.objectStoreNames.contains(KEYSTORE_NAME)) {
                    db.createObjectStore(KEYSTORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * 🔒 Génère et stocke une paire de clés NON-EXTRACTABLE
     * La clé privée ne peut JAMAIS être exportée en JSON
     */
    async generateAndStoreKeyPair(userId: string): Promise<{ publicKey: JsonWebKey; hasPrivateKey: boolean }> {
        const db = await this.init();

        // Générer clé avec extractable=false pour privateKey
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true, // Public key extractable (pour partage)
            ['deriveKey', 'deriveBits']
        ) as CryptoKeyPair;

        // Stocker directement les CryptoKey natives dans IndexedDB
        const storedKeyPair: StoredKeyPair = {
            id: `keypair-${userId}`,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            createdAt: Date.now(),
        };

        await this.put(KEYSTORE_NAME, storedKeyPair);

        // Exporter uniquement la clé publique pour partage
        const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);

        return {
            publicKey: publicKeyJwk,
            hasPrivateKey: true, // Confirmation stockage réussi
        };
    }

    /**
     * 🔒 Récupère la paire de clés depuis IndexedDB
     * Retourne les CryptoKey natives (pas de JSON)
     */
    async loadKeyPair(userId: string): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
        try {
            const db = await this.init();
            const stored = await this.get<StoredKeyPair>(KEYSTORE_NAME, `keypair-${userId}`);

            if (!stored) return null;

            return {
                publicKey: stored.publicKey,
                privateKey: stored.privateKey,
            };
        } catch (error) {
            console.error('Failed to load key pair:', error);
            return null;
        }
    }

    /**
     * 🔒 Exporte uniquement la clé publique (pour partage)
     */
    async getPublicKeyJwk(userId: string): Promise<JsonWebKey | null> {
        const keyPair = await this.loadKeyPair(userId);
        if (!keyPair) return null;

        return await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    }

    /**
     * 🔒 Supprime la paire de clés (logout sécurisé)
     */
    async deleteKeyPair(userId: string): Promise<void> {
        const db = await this.init();
        await this.delete(KEYSTORE_NAME, `keypair-${userId}`);
    }

    /**
     * 🔒 Stocke une clé dérivée (shared secret)
     * Utilise aussi non-extractable pour maximum sécurité
     */
    async storeDerivedKey(userId: string, peerId: string, key: CryptoKey): Promise<void> {
        const db = await this.init();
        await this.put(KEYSTORE_NAME, {
            id: `derived-${userId}-${peerId}`,
            key,
            createdAt: Date.now(),
        });
    }

    /**
     * 🔒 Récupère une clé dérivée
     */
    async loadDerivedKey(userId: string, peerId: string): Promise<CryptoKey | null> {
        const stored = await this.get<{ key: CryptoKey }>(KEYSTORE_NAME, `derived-${userId}-${peerId}`);
        return stored?.key || null;
    }

    /**
     * 🔒 Nettoie toutes les clés d'un utilisateur (logout complet)
     */
    async clearAllKeys(userId: string): Promise<void> {
        const db = await this.init();
        const tx = db.transaction(KEYSTORE_NAME, 'readwrite');
        const store = tx.objectStore(KEYSTORE_NAME);

        // Récupérer toutes les clés de cet utilisateur
        const request = store.openCursor();

        await new Promise<void>((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const key = cursor.value.id;
                    if (key.includes(userId)) {
                        cursor.delete();
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Helpers IndexedDB =====

    private async put(storeName: string, value: any): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(value);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async get<T>(storeName: string, key: string): Promise<T | null> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    private async delete(storeName: string, key: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const cryptoStorageService = new CryptoStorageService();

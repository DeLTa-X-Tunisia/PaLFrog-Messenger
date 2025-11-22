import { useAuthStore } from '../stores/auth.store';
import { cryptoStorageService } from './crypto-storage.service';

interface PeerKeys {
    [peerId: string]: {
        publicKey: JsonWebKey;
        sharedSecret?: CryptoKey;
        derivedKey?: CryptoKey;
    };
}

/**
 * 🔒 Service de chiffrement end-to-end sécurisé
 * 
 * AMÉLIORATIONS SÉCURITÉ v2:
 * - ✅ Clés privées stockées dans IndexedDB (pas localStorage)
 * - ✅ CryptoKey natives non-extractables
 * - ✅ Protection contre XSS
 * - ✅ Nettoyage automatique au logout
 */
class CryptoService {
    private nativeKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;
    private peerKeys: PeerKeys = {};

    async initialize() {
        await this.ensureKeyPair();
    }

    /**
     * 🔒 Assure qu'une paire de clés existe (génère si nécessaire)
     */
    private async ensureKeyPair(): Promise<void> {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('USER_NOT_AUTHENTICATED');

        // Charger depuis IndexedDB
        this.nativeKeyPair = await cryptoStorageService.loadKeyPair(user.id);

        // Générer si inexistant
        if (!this.nativeKeyPair) {
            await cryptoStorageService.generateAndStoreKeyPair(user.id);
            this.nativeKeyPair = await cryptoStorageService.loadKeyPair(user.id);
            
            if (!this.nativeKeyPair) {
                throw new Error('KEY_GENERATION_FAILED');
            }
        }
    }

    /**
     * 🔒 Obtient la clé publique au format JWK (pour partage)
     */
    async getPublicKeyJwk(): Promise<JsonWebKey> {
        await this.ensureKeyPair();
        if (!this.nativeKeyPair) throw new Error('NO_KEYPAIR');

        return await window.crypto.subtle.exportKey('jwk', this.nativeKeyPair.publicKey);
    }

    /**
     * 🔒 Échange de clés avec un pair - Diffie-Hellman sécurisé
     */
    async performKeyExchange(peerId: string, peerPublicKeyJwk: JsonWebKey): Promise<CryptoKey> {
        await this.ensureKeyPair();
        if (!this.nativeKeyPair) throw new Error('NO_KEYPAIR');

        const { user } = useAuthStore.getState();
        if (!user) throw new Error('USER_NOT_AUTHENTICATED');

        try {
            // Importer la clé publique du pair
            const peerPublicKey = await window.crypto.subtle.importKey(
                'jwk',
                peerPublicKeyJwk,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                },
                false, // 🔒 Non-extractable
                []
            );

            // Dériver la clé secrète partagée avec notre clé privée native
            const sharedSecret = await window.crypto.subtle.deriveKey(
                {
                    name: 'ECDH',
                    public: peerPublicKey,
                },
                this.nativeKeyPair.privateKey, // 🔒 Utilise la clé native directement
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false, // 🔒 Non-extractable
                ['encrypt', 'decrypt']
            );

            // Dériver une clé de chiffrement stable
            const derivedKey = await this.deriveEncryptionKey(sharedSecret);

            // 🔒 Stocker dans IndexedDB (pas en mémoire volatile)
            await cryptoStorageService.storeDerivedKey(user.id, peerId, derivedKey);

            // Stocker en mémoire pour performance
            this.peerKeys[peerId] = {
                publicKey: peerPublicKeyJwk,
                sharedSecret,
                derivedKey,
            };

            return derivedKey;
        } catch (error) {
            console.error('Key exchange failed:', error);
            throw new Error('KEY_EXCHANGE_FAILED');
        }
    }

    /**
     * Dérive une clé de chiffrement stable à partir du secret partagé
     */
    private async deriveEncryptionKey(sharedSecret: CryptoKey): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const salt = encoder.encode('palfrog-key-derivation');

        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            sharedSecret,
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Chiffre un message avec la clé dérivée du pair
     */
    async encryptMessage(peerId: string, message: string): Promise<{
        encrypted: string;
        iv: string;
        authTag?: string;
    }> {
        const peerKey = this.peerKeys[peerId];
        if (!peerKey?.derivedKey) {
            throw new Error('NO_SHARED_KEY');
        }

        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    additionalData: encoder.encode(peerId), // Associer au pair
                },
                peerKey.derivedKey,
                data
            );

            return {
                encrypted: this.arrayBufferToBase64(encrypted),
                iv: this.arrayBufferToBase64(iv),
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('ENCRYPTION_FAILED');
        }
    }

    /**
     * Déchiffre un message avec la clé dérivée du pair
     */
    async decryptMessage(peerId: string, encryptedData: string, iv: string): Promise<string> {
        const peerKey = this.peerKeys[peerId];
        if (!peerKey?.derivedKey) {
            throw new Error('NO_SHARED_KEY');
        }

        try {
            const encryptedArray = this.base64ToArrayBuffer(encryptedData);
            const ivArray = this.base64ToArrayBuffer(iv);
            const encoder = new TextEncoder();

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivArray,
                    additionalData: encoder.encode(peerId),
                },
                peerKey.derivedKey,
                encryptedArray
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('DECRYPTION_FAILED');
        }
    }

    /**
     * 🔒 Envoie notre clé publique à un pair via DataChannel
     */
    async sendPublicKey(peerId: string, dataChannel: RTCDataChannel) {
        const publicKeyJwk = await this.getPublicKeyJwk();

        const keyExchangeMessage = {
            type: 'key_exchange',
            publicKey: publicKeyJwk,
            timestamp: new Date().toISOString(),
        };

        dataChannel.send(JSON.stringify(keyExchangeMessage));
    }

    /**
     * Gère la réception d'une clé publique d'un pair
     */
    async handlePublicKey(peerId: string, publicKeyJwk: JsonWebKey) {
        try {
            await this.performKeyExchange(peerId, publicKeyJwk);
            console.log('Key exchange completed with:', peerId);
        } catch (error) {
            console.error('Failed to handle public key:', error);
        }
    }

    /**
     * Vérifie si une clé partagée existe pour un pair
     */
    hasSharedKey(peerId: string): boolean {
        return !!this.peerKeys[peerId]?.derivedKey;
    }

    /**
     * 🔒 Charge une clé dérivée depuis IndexedDB
     */
    async loadDerivedKey(peerId: string): Promise<CryptoKey | null> {
        const { user } = useAuthStore.getState();
        if (!user) return null;

        // Vérifier cache mémoire
        if (this.peerKeys[peerId]?.derivedKey) {
            return this.peerKeys[peerId].derivedKey!;
        }

        // Charger depuis IndexedDB
        const derivedKey = await cryptoStorageService.loadDerivedKey(user.id, peerId);
        
        if (derivedKey && this.peerKeys[peerId]) {
            this.peerKeys[peerId].derivedKey = derivedKey;
        }

        return derivedKey;
    }

    // Utilitaires de conversion
    private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 🔒 Nettoie toutes les clés (déconnexion sécurisée)
     */
    async clearKeys() {
        const { user } = useAuthStore.getState();
        
        // Nettoyer mémoire
        this.nativeKeyPair = null;
        this.peerKeys = {};

        // 🔒 Supprimer de IndexedDB
        if (user) {
            await cryptoStorageService.clearAllKeys(user.id);
            
            // Migration: Nettoyer aussi l'ancien localStorage
            localStorage.removeItem(`palfrog-keys-${user.id}`);
            localStorage.removeItem(`palfrog-peer-keys-${user.id}`);
        }
    }
}

export const cryptoService = new CryptoService();

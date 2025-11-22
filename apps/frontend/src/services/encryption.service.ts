class EncryptionService {
    private key: CryptoKey | null = null;

    async initialize() {
        try {
            // Générer une clé de chiffrement (à stocker de manière sécurisée)
            this.key = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Failed to initialize encryption:', error);
        }
    }

    async encrypt(text: string): Promise<{ encrypted: string; iv: string }> {
        if (!this.key) await this.initialize();

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            this.key!,
            encoded
        );

        return {
            encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv)),
        };
    }

    async decrypt(encrypted: string, iv: string): Promise<string> {
        if (!this.key) await this.initialize();

        try {
            const encryptedData = new Uint8Array(
                atob(encrypted).split('').map(char => char.charCodeAt(0))
            );

            const ivData = new Uint8Array(
                atob(iv).split('').map(char => char.charCodeAt(0))
            );

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivData,
                },
                this.key!,
                encryptedData
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Failed to decrypt message:', error);
            throw new Error('Decryption failed');
        }
    }

    // Pour une sécurité renforcée, stocker la clé de manière sécurisée
    async exportKey(): Promise<string> {
        if (!this.key) await this.initialize();

        const exported = await crypto.subtle.exportKey('jwk', this.key!);
        return JSON.stringify(exported);
    }

    async importKey(keyData: string) {
        const jwk = JSON.parse(keyData);
        this.key = await crypto.subtle.importKey(
            'jwk',
            jwk,
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
    }
}

export const encryptionService = new EncryptionService();

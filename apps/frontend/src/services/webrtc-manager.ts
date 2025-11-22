import { useWebRTCStore } from '../stores/webrtc.store';
import { cryptoService } from './crypto.service';
import { fileTransferManager } from './file-transfer-manager';

class WebRTCManager {
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private maxRetries = 3;
    private retryCount = 0;

    async initializePeerConnection(peerId: string): Promise<boolean> {
        try {
            const { createPeerConnection } = useWebRTCStore.getState();
            const peerConnection = await createPeerConnection(peerId);

            // Gestion robuste des erreurs ICE
            peerConnection.onconnectionstatechange = () => {
                const state = peerConnection.connectionState;
                console.log(`Connection state: ${state}`);

                switch (state) {
                    case 'connected':
                        this.retryCount = 0;
                        break;
                    case 'disconnected':
                    case 'failed':
                        this.handleConnectionFailure(peerId);
                        break;
                }
            };

            // Gestion du DataChannel
            peerConnection.ondatachannel = (event) => {
                const dataChannel = event.channel;
                this.setupDataChannel(dataChannel, peerId);
            };

            return true;
        } catch (error) {
            console.error('Failed to initialize peer connection:', error);
            this.handleConnectionFailure(peerId);
            return false;
        }
    }

    private handleConnectionFailure(peerId: string) {
        this.retryCount++;

        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying connection to ${peerId} (attempt ${this.retryCount})`);

            this.reconnectTimeout = setTimeout(() => {
                this.initializePeerConnection(peerId);
            }, 2000 * this.retryCount); // Backoff exponentiel
        } else {
            console.error(`Max retries reached for ${peerId}`);
            // Fallback: utiliser le serveur de relay
            this.fallbackToRelay(peerId);
        }
    }

    private fallbackToRelay(peerId: string) {
        console.log('Using server relay fallback for:', peerId);
        // Implémenter l'envoi via Socket.IO en cas d'échec P2P
    }

    private setupDataChannel(dataChannel: RTCDataChannel, peerId: string) {
        dataChannel.onopen = () => {
            console.log('DataChannel opened with:', peerId);
            const { dataChannels } = useWebRTCStore.getState();
            const updated = new Map(dataChannels);
            updated.set(peerId, dataChannel);
            useWebRTCStore.setState({ dataChannels: updated });

            // Initialiser le chiffrement
            useWebRTCStore.getState().initializeEncryption(peerId);
        };

        dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Gestion des fichiers
                if (data.type && data.type.startsWith('file_') || data.type === 'chunk_ack') {
                    fileTransferManager.handleFileMessage(peerId, data, dataChannel);
                    return;
                }

                if (data.type === 'key_exchange') {
                    // Gérer l'échange de clés
                    cryptoService.handlePublicKey(peerId, data.publicKey).then(() => {
                        // Répondre avec notre clé publique
                        cryptoService.sendPublicKey(peerId, dataChannel);

                        // Mettre à jour le statut
                        useWebRTCStore.getState().encryptionStatus.set(peerId, 'established');
                    });
                } else if (data.type === 'encrypted_message') {
                    // Gérer les messages chiffrés
                    useWebRTCStore.getState().handleEncryptedMessage(peerId, data);
                } else if (data.type === 'typing_start') {
                    useWebRTCStore.getState().setTypingIndicator(peerId, true);
                } else if (data.type === 'typing_stop') {
                    useWebRTCStore.getState().setTypingIndicator(peerId, false);
                } else if (data.type === 'text' || !data.type) {
                    // Gestion normale des messages (compatibilité avec les anciens messages sans type)
                    useWebRTCStore.getState().addMessage({
                        id: `${peerId}-${Date.now()}`,
                        content: data.content || data, // Fallback si data est juste le contenu
                        sender: peerId,
                        timestamp: new Date(),
                        type: 'text'
                    });
                }
            } catch (error) {
                console.error('Failed to parse incoming message:', error);
            }
        };

        dataChannel.onerror = (error) => {
            console.error('DataChannel error:', error);
        };

        dataChannel.onclose = () => {
            console.log('DataChannel closed with:', peerId);
            const { dataChannels } = useWebRTCStore.getState();
            const updated = new Map(dataChannels);
            updated.delete(peerId);
            useWebRTCStore.setState({ dataChannels: updated });
        };
    }

    cleanup() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        this.retryCount = 0;
    }
}

export const webRTCManager = new WebRTCManager();

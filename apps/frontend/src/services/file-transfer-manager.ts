import { useFileTransferStore } from '../stores/file-transfer.store';
import { useWebRTCStore } from '../stores/webrtc.store';
import { notificationService } from './notification.service';

interface Chunk {
    transferId: string;
    chunkIndex: number;
    totalChunks: number;
    data: string; // Base64 DataURL
    isFinal: boolean;
}

class FileTransferManager {
    private chunkSize = 16 * 1024; // 16KB chunks pour une bonne performance
    private activeTransfers: Map<string, { file: File; reader: FileReader }> = new Map();
    private receivedChunks: Map<string, Blob[]> = new Map();
    private pendingSends: Map<string, { file: File; peerId: string }> = new Map();

    async sendFile(peerId: string, file: File, transferId: string, thumbnail?: string) {
        const { dataChannels } = useWebRTCStore.getState();
        const dataChannel = dataChannels.get(peerId);

        if (!dataChannel || dataChannel.readyState !== 'open') {
            throw new Error('DataChannel non disponible');
        }

        // Stocker le fichier en attente d'acceptation
        this.pendingSends.set(transferId, { file, peerId });

        // Envoyer l'offre de fichier
        const fileOffer = {
            type: 'file_offer',
            transferId,
            name: file.name,
            size: file.size,
            fileType: file.type,
            thumbnail, // Ajouter la miniature si disponible
            timestamp: new Date().toISOString()
        };

        dataChannel.send(JSON.stringify(fileOffer));

        // Ajouter le message dans le chat (côté expéditeur)
        useWebRTCStore.getState().addMessage({
            id: Date.now().toString(),
            content: JSON.stringify(fileOffer),
            sender: 'me',
            timestamp: new Date(),
            type: 'file'
        });
    }

    async startTransfer(peerId: string, file: File, transferId: string) {
        const { dataChannels } = useWebRTCStore.getState();
        const dataChannel = dataChannels.get(peerId);

        if (!dataChannel || dataChannel.readyState !== 'open') return;

        // Envoyer les métadonnées du fichier
        const fileInfo = {
            type: 'file_metadata',
            transferId,
            name: file.name,
            size: file.size,
            fileType: file.type,
            totalChunks: Math.ceil(file.size / this.chunkSize),
            timestamp: new Date().toISOString()
        };

        dataChannel.send(JSON.stringify(fileInfo));

        // Lire et envoyer le fichier par chunks
        const totalChunks = Math.ceil(file.size / this.chunkSize);
        let chunkIndex = 0;

        const readAndSendChunk = async (): Promise<void> => {
            if (chunkIndex >= totalChunks) return;

            const start = chunkIndex * this.chunkSize;
            const end = Math.min(start + this.chunkSize, file.size);
            const chunk = file.slice(start, end);

            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    const chunkData: Chunk = {
                        transferId,
                        chunkIndex,
                        totalChunks,
                        data: reader.result as string,
                        isFinal: chunkIndex === totalChunks - 1
                    };

                    // Envoyer le chunk
                    dataChannel.send(JSON.stringify({
                        type: 'file_chunk',
                        ...chunkData
                    }));

                    // Mettre à jour la progression
                    const progress = ((chunkIndex + 1) / totalChunks) * 100;
                    const transferredBytes = Math.min((chunkIndex + 1) * this.chunkSize, file.size);

                    useFileTransferStore.getState().updateProgress(
                        transferId,
                        progress,
                        transferredBytes
                    );

                    chunkIndex++;

                    // Continuer avec le chunk suivant
                    setTimeout(() => readAndSendChunk().then(resolve).catch(reject), 0);
                };

                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
                reader.readAsDataURL(chunk);
            });
        };

        try {
            // Démarrer le transfert
            useFileTransferStore.getState().updateProgress(transferId, 0, 0);
            await readAndSendChunk();

            // Marquer comme complété
            useFileTransferStore.getState().completeTransfer(transferId);

        } catch (error) {
            useFileTransferStore.getState().failTransfer(
                transferId,
                error instanceof Error ? error.message : 'Erreur de transfert'
            );
            throw error;
        }
    }

    acceptFile(transferId: string, peerId: string) {
        const { dataChannels } = useWebRTCStore.getState();
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.send(JSON.stringify({
                type: 'file_accept',
                transferId
            }));
        }
    }

    rejectFile(transferId: string, peerId: string) {
        const { dataChannels } = useWebRTCStore.getState();
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.send(JSON.stringify({
                type: 'file_reject',
                transferId
            }));
        }
    }

    cancelSend(transferId: string, peerId: string) {
        // Retirer de la liste d'attente
        this.pendingSends.delete(transferId);

        // Informer le destinataire
        const { dataChannels } = useWebRTCStore.getState();
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.send(JSON.stringify({
                type: 'file_cancel',
                transferId
            }));
        }
    }

    private updateMessageTransferStatus(transferId: string, status: 'completed' | 'rejected' | 'cancelled') {
        const { messages, updateMessageContent } = useWebRTCStore.getState();

        // Trouver le message associé au transfert
        const message = messages.find(m => {
            try {
                const content = JSON.parse(m.content);
                return content.transferId === transferId;
            } catch { return false; }
        });

        if (message) {
            try {
                const content = JSON.parse(message.content);
                content.transferStatus = status;
                updateMessageContent(message.id, JSON.stringify(content));
            } catch (e) {
                console.error('Failed to update message transfer status', e);
            }
        }
    }

    async receiveFile(transferId: string, fileInfo: any, dataChannel: RTCDataChannel) {
        // Initialiser la réception
        this.receivedChunks.set(transferId, []);
        useFileTransferStore.getState().receiveFile(transferId, fileInfo);

        // Envoyer un accusé de réception
        dataChannel.send(JSON.stringify({
            type: 'file_transfer_ack',
            transferId,
            status: 'ready'
        }));
    }

    async receiveChunk(transferId: string, chunkData: Chunk, dataChannel: RTCDataChannel) {
        const receivedChunks = this.receivedChunks.get(transferId) || [];

        // Convertir DataURL en Blob
        const res = await fetch(chunkData.data);
        const blob = await res.blob();

        receivedChunks[chunkData.chunkIndex] = blob;
        this.receivedChunks.set(transferId, receivedChunks);

        // Mettre à jour la progression
        const progress = ((chunkData.chunkIndex + 1) / chunkData.totalChunks) * 100;
        const transferredBytes = receivedChunks.reduce((total, chunk) =>
            total + (chunk ? chunk.size : 0), 0
        );

        useFileTransferStore.getState().updateProgress(
            transferId,
            progress,
            transferredBytes
        );

        // Si c'est le dernier chunk, reconstruire le fichier
        if (chunkData.isFinal) {
            await this.completeFileReception(transferId, chunkData.totalChunks);
        }

        // Envoyer un accusé de réception du chunk
        dataChannel.send(JSON.stringify({
            type: 'chunk_ack',
            transferId,
            chunkIndex: chunkData.chunkIndex,
            status: 'received'
        }));
    }

    private async completeFileReception(transferId: string, totalChunks: number) {
        const receivedChunks = this.receivedChunks.get(transferId);
        if (!receivedChunks || receivedChunks.length !== totalChunks) {
            throw new Error('Chunks manquants pour la reconstruction du fichier');
        }

        // Reconstruire le fichier
        const fileBlob = new Blob(receivedChunks);
        const transfers = useFileTransferStore.getState().transfers;
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        // Créer le fichier final
        const file = new File([fileBlob], transfer.file.name, {
            type: transfer.file.type,
            lastModified: Date.now()
        });

        // Mettre à jour le transfert avec le vrai fichier
        const updatedTransfer = { ...transfer, file };
        const updatedTransfers = new Map(useFileTransferStore.getState().transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        useFileTransferStore.setState({ transfers: updatedTransfers });

        // Marquer comme complété
        useFileTransferStore.getState().completeTransfer(transferId);
        this.updateMessageTransferStatus(transferId, 'completed');

        // Notification in-app intégrée au lieu de notification système
        const { showInAppNotification } = await import('./toast-helper');
        showInAppNotification(
            'Fichier reçu',
            `"${file.name}" a été reçu avec succès`,
            { type: 'system' }
        );

        // Nettoyer
        this.receivedChunks.delete(transferId);
    }

    cancelTransfer(transferId: string) {
        // Arrêter les transferts actifs
        this.activeTransfers.delete(transferId);
        this.receivedChunks.delete(transferId);
    }

    // Gestion des messages de fichier dans le DataChannel
    handleFileMessage(peerId: string, data: any, dataChannel: RTCDataChannel) {
        switch (data.type) {
            case 'file_offer':
                // Ajouter le message dans le chat (côté destinataire)
                useWebRTCStore.getState().addMessage({
                    id: Date.now().toString(),
                    content: JSON.stringify(data),
                    sender: peerId,
                    timestamp: new Date(),
                    type: 'file'
                });
                break;

            case 'file_accept':
                const pending = this.pendingSends.get(data.transferId);
                if (pending) {
                    this.startTransfer(pending.peerId, pending.file, data.transferId);
                    this.pendingSends.delete(data.transferId);
                }
                break;

            case 'file_reject':
                this.pendingSends.delete(data.transferId);
                useFileTransferStore.getState().rejectTransfer(data.transferId);
                this.updateMessageTransferStatus(data.transferId, 'rejected');
                break;

            case 'file_cancel':
                // Trouver et supprimer le message correspondant dans le store
                const { messages, removeMessage } = useWebRTCStore.getState();
                const msgToRemove = messages.find(m => {
                    try {
                        const content = JSON.parse(m.content);
                        return content.transferId === data.transferId;
                    } catch { return false; }
                });

                if (msgToRemove) {
                    removeMessage(msgToRemove.id);
                }
                break;

            case 'file_metadata':
                this.receiveFile(data.transferId, data, dataChannel);
                break;

            case 'file_chunk':
                this.receiveChunk(data.transferId, data, dataChannel);
                break;

            case 'file_transfer_ack':
                console.log('Transfer acknowledged:', data.transferId);
                break;

            case 'chunk_ack':
                // console.log('Chunk acknowledged:', data.chunkIndex);
                break;
        }
    }
}

// 🔒 Singleton sécurisé - Plus de pollution window.*
const fileTransferManager = new FileTransferManager();

export { fileTransferManager };

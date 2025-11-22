import { create } from 'zustand';
import { managers } from '../services/managers';

interface FileTransfer {
    id: string;
    file: File;
    peerId: string;
    progress: number;
    status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled' | 'rejected';
    direction: 'sending' | 'receiving';
    speed: number; // bytes per second
    transferredBytes: number;
    totalBytes: number;
    startTime?: Date;
    endTime?: Date;
    error?: string;
}

interface FileTransferState {
    transfers: Map<string, FileTransfer>;
    maxFileSize: number; // 100MB par défaut

    // Actions
    sendFile: (peerId: string, file: File, thumbnail?: string) => Promise<void>;
    receiveFile: (transferId: string, fileInfo: any) => void;
    updateProgress: (transferId: string, progress: number, transferredBytes: number) => void;
    cancelTransfer: (transferId: string) => void;
    rejectTransfer: (transferId: string) => void;
    completeTransfer: (transferId: string) => void;
    failTransfer: (transferId: string, error: string) => void;
    clearCompleted: () => void;
}

export const useFileTransferStore = create<FileTransferState>((set, get) => ({
    transfers: new Map(),
    maxFileSize: 100 * 1024 * 1024, // 100MB

    sendFile: async (peerId: string, file: File, thumbnail?: string) => {
        const { transfers, maxFileSize } = get();

        // Vérifier la taille du fichier
        if (file.size > maxFileSize) {
            throw new Error(`Fichier trop volumineux. Maximum: ${maxFileSize / 1024 / 1024}MB`);
        }

        const transferId = `send-${peerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const transfer: FileTransfer = {
            id: transferId,
            file,
            peerId,
            progress: 0,
            status: 'pending',
            direction: 'sending',
            speed: 0,
            transferredBytes: 0,
            totalBytes: file.size,
            startTime: new Date()
        };

        // Ajouter au store
        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, transfer);
        set({ transfers: updatedTransfers });

        try {
            // Démarrer le transfert via le FileTransferManager
            await managers.fileTransfer.sendFile(peerId, file, transferId, thumbnail);
        } catch (error) {
            get().failTransfer(transferId, error instanceof Error ? error.message : 'Transfer failed');
            throw error;
        }
    },

    receiveFile: (transferId: string, fileInfo: any) => {
        const { transfers } = get();

        const transfer: FileTransfer = {
            id: transferId,
            file: new File([], fileInfo.name, { type: fileInfo.fileType }),
            peerId: fileInfo.senderId,
            progress: 0,
            status: 'pending',
            direction: 'receiving',
            speed: 0,
            transferredBytes: 0,
            totalBytes: fileInfo.size,
            startTime: new Date()
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, transfer);
        set({ transfers: updatedTransfers });
    },

    updateProgress: (transferId: string, progress: number, transferredBytes: number) => {
        const { transfers } = get();
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        // Calculer la vitesse de transfert
        const now = new Date();
        const timeElapsed = (now.getTime() - (transfer.startTime?.getTime() || now.getTime())) / 1000;
        const speed = timeElapsed > 0 ? transferredBytes / timeElapsed : 0;

        const updatedTransfer: FileTransfer = {
            ...transfer,
            progress,
            transferredBytes,
            speed,
            status: progress < 100 ? 'transferring' : transfer.status
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        set({ transfers: updatedTransfers });
    },

    cancelTransfer: (transferId: string) => {
        const { transfers } = get();
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        const updatedTransfer: FileTransfer = {
            ...transfer,
            status: 'cancelled',
            endTime: new Date()
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        set({ transfers: updatedTransfers });

        // Notifier le manager
        managers.fileTransfer.cancelTransfer(transferId);
    },

    rejectTransfer: (transferId: string) => {
        const { transfers } = get();
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        const updatedTransfer: FileTransfer = {
            ...transfer,
            status: 'rejected',
            endTime: new Date()
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        set({ transfers: updatedTransfers });
    },

    completeTransfer: (transferId: string) => {
        const { transfers } = get();
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        const updatedTransfer: FileTransfer = {
            ...transfer,
            progress: 100,
            status: 'completed',
            endTime: new Date()
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        set({ transfers: updatedTransfers });
    },

    failTransfer: (transferId: string, error: string) => {
        const { transfers } = get();
        const transfer = transfers.get(transferId);

        if (!transfer) return;

        const updatedTransfer: FileTransfer = {
            ...transfer,
            status: 'failed',
            error,
            endTime: new Date()
        };

        const updatedTransfers = new Map(transfers);
        updatedTransfers.set(transferId, updatedTransfer);
        set({ transfers: updatedTransfers });
    },

    clearCompleted: () => {
        const { transfers } = get();
        const updatedTransfers = new Map();

        transfers.forEach((transfer, id) => {
            if (transfer.status !== 'completed' && transfer.status !== 'failed') {
                updatedTransfers.set(id, transfer);
            }
        });

        set({ transfers: updatedTransfers });
    }
}));

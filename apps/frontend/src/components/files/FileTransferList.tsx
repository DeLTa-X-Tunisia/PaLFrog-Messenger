import React from 'react';
import { useFileTransferStore } from '../../stores/file-transfer.store';

export const FileTransferList: React.FC = () => {
    const { transfers, clearCompleted, cancelTransfer } = useFileTransferStore();

    const transferArray = Array.from(transfers.values());
    const activeTransfers = transferArray.filter(t =>
        t.status === 'pending' || t.status === 'transferring'
    );
    const completedTransfers = transferArray.filter(t =>
        t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
    );

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatSpeed = (bytesPerSecond: number): string => {
        return formatFileSize(bytesPerSecond) + '/s';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500';
            case 'failed': return 'text-red-500';
            case 'cancelled': return 'text-yellow-500';
            case 'transferring': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'cancelled': return '⏹️';
            case 'transferring': return '🔄';
            default: return '⏳';
        }
    };

    const handleDownload = (transfer: any) => {
        if (transfer.status !== 'completed') return;

        const url = URL.createObjectURL(transfer.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = transfer.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (transferArray.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-hidden z-50">
            {/* En-tête */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Transferts de fichiers</h3>
                {completedTransfers.length > 0 && (
                    <button
                        onClick={clearCompleted}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Effacer terminés
                    </button>
                )}
            </div>

            {/* Liste des transferts */}
            <div className="overflow-y-auto max-h-80">
                {/* Transferts actifs */}
                {activeTransfers.map((transfer) => (
                    <div key={transfer.id} className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="text-sm">{getStatusIcon(transfer.status)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {transfer.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {transfer.direction === 'sending' ? '→ Envoi à ' : '← Réception de '}
                                        {transfer.peerId}
                                    </p>
                                </div>
                            </div>

                            {transfer.status === 'transferring' && (
                                <button
                                    onClick={() => cancelTransfer(transfer.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Annuler le transfert"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${transfer.progress}%` }}
                            ></div>
                        </div>

                        {/* Informations de progression */}
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>
                                {formatFileSize(transfer.transferredBytes)} / {formatFileSize(transfer.totalBytes)}
                            </span>
                            <span>
                                {transfer.speed > 0 && formatSpeed(transfer.speed)}
                                {transfer.progress.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                ))}

                {/* Transferts terminés */}
                {completedTransfers.map((transfer) => (
                    <div key={transfer.id} className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="text-sm">{getStatusIcon(transfer.status)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {transfer.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {transfer.direction === 'sending' ? '→ Envoyé à ' : '← Reçu de '}
                                        {transfer.peerId}
                                    </p>
                                </div>
                            </div>

                            {transfer.status === 'completed' && (
                                <button
                                    onClick={() => handleDownload(transfer)}
                                    className="text-primary-500 hover:text-primary-700 transition-colors"
                                    title="Télécharger"
                                >
                                    ⬇️
                                </button>
                            )}
                        </div>

                        {/* Message de statut */}
                        <div className={`text-xs ${getStatusColor(transfer.status)}`}>
                            {transfer.status === 'failed' && `Échec: ${transfer.error}`}
                            {transfer.status === 'cancelled' && 'Transfert annulé'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

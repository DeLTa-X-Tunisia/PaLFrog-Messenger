import React, { useState, useEffect } from 'react';
import { useFileTransferStore } from '../../stores/file-transfer.store';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { fileTransferManager } from '../../services/file-transfer-manager';

interface FileMessageProps {
    message: any;
    isMe: boolean;
}

export const FileMessage: React.FC<FileMessageProps> = ({ message, isMe }) => {
    const [fileInfo, setFileInfo] = useState<any>(null);
    const [isRefused, setIsRefused] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const { transfers } = useFileTransferStore();

    useEffect(() => {
        try {
            const parsed = JSON.parse(message.content);
            setFileInfo(parsed);
        } catch (e) {
            console.error('Failed to parse file message', e);
        }
    }, [message.content]);

    if (!fileInfo || isRefused) return null;

    const transfer = transfers.get(fileInfo.transferId);
    const isImage = fileInfo.fileType.startsWith('image/');
    const isVideo = fileInfo.fileType.startsWith('video/');

    // Utiliser le statut persisté si le transfert n'est pas en mémoire
    const status = transfer?.status || fileInfo.transferStatus;

    const handleAccept = () => {
        fileTransferManager.acceptFile(fileInfo.transferId, message.sender);
    };

    const handleReject = () => {
        setIsRefused(true);
        fileTransferManager.rejectFile(fileInfo.transferId, message.sender);
    };

    const handleCancel = () => {
        // Annuler l'envoi
        fileTransferManager.cancelSend(fileInfo.transferId, fileInfo.peerId || message.sender); // peerId n'est pas toujours dans fileInfo pour l'expéditeur

        // Supprimer le message localement
        const { removeMessage } = useWebRTCStore.getState();
        removeMessage(message.id);
    };

    const handleDownload = () => {
        if (transfer && transfer.file) {
            const url = URL.createObjectURL(transfer.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = transfer.file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handlePlayVideo = () => {
        if (transfer?.file) {
            setShowVideo(true);
        }
    };

    // Modal Vidéo
    const VideoModal = () => {
        if (!showVideo || !transfer?.file) return null;
        const videoUrl = URL.createObjectURL(transfer.file);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowVideo(false)}>
                <div className="relative max-w-4xl w-full bg-black rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowVideo(false)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 bg-black/50 rounded-full p-2"
                    >
                        ✕
                    </button>
                    <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="w-full h-auto max-h-[80vh]"
                    />
                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                        <span className="font-medium truncate">{fileInfo.name}</span>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Télécharger
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // État: Transfert refusé
    if (status === 'rejected') {
        return (
            <div className="w-64 bg-red-50 border border-red-100 p-3 rounded-xl">
                <div className="flex items-center space-x-2 text-red-600">
                    <span>❌</span>
                    <span className="text-sm font-medium">Transfert refusé par le destinataire</span>
                </div>
            </div>
        );
    }

    // État: Transfert terminé
    if (status === 'completed') {
        const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);

        if (isVideo) {
            return (
                <>
                    <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="relative group cursor-pointer bg-black" onClick={handlePlayVideo}>
                            {fileInfo.thumbnail ? (
                                <img src={fileInfo.thumbnail} alt="Video thumbnail" className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-40 flex items-center justify-center bg-gray-900">
                                    <span className="text-4xl">🎬</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-2xl ml-1">▶️</span>
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                                {sizeInMB} MB
                            </div>
                        </div>
                        <div className="p-3 flex items-center justify-between bg-gray-50">
                            <span className="text-sm font-medium truncate text-gray-700 flex-1 mr-2">{fileInfo.name}</span>
                            <button
                                onClick={handleDownload}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                                title="Télécharger"
                            >
                                ⬇️
                            </button>
                        </div>
                    </div>
                    <VideoModal />
                </>
            );
        }

        return (
            <div className="w-64 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-xl">✅</span>
                        <span className="text-sm font-medium truncate text-gray-900">{fileInfo.name}</span>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Télécharger"
                    >
                        ⬇️
                    </button>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: '100%' }}
                    ></div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{sizeInMB} MB</span>
                    <span className="font-medium text-green-600">
                        Terminé
                    </span>
                </div>

                {isImage && transfer?.file && (
                    <div className="mt-2 relative group cursor-pointer" onClick={handleDownload}>
                        <img
                            src={URL.createObjectURL(transfer.file)}
                            alt={fileInfo.name}
                            className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
                    </div>
                )}
            </div>
        );
    }

    // État: En cours de transfert
    if (transfer?.status === 'transferring') {
        const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
        return (
            <div className="w-64 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                {isVideo && fileInfo.thumbnail && (
                    <div className="mb-2 relative rounded-lg overflow-hidden bg-black">
                        <img src={fileInfo.thumbnail} alt="Preview" className="w-full h-32 object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-xl">📄</span>
                        <span className="text-sm font-medium truncate text-gray-900">{fileInfo.name}</span>
                    </div>
                    {isMe && (
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Annuler"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                        className="bg-gray-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${transfer.progress}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{sizeInMB} MB</span>
                    <span className="font-medium text-gray-700">
                        {Math.round(transfer.progress)}%
                    </span>
                </div>
            </div>
        );
    }

    // État: En attente d'acceptation (Expéditeur)
    if (isMe && (!status || status === 'pending')) {
        return (
            <div className="w-64 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                {isVideo && fileInfo.thumbnail && (
                    <div className="mb-2 rounded-lg overflow-hidden bg-black">
                        <img src={fileInfo.thumbnail} alt="Preview" className="w-full h-32 object-cover opacity-80" />
                    </div>
                )}
                <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">📤</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">{fileInfo.name}</p>
                        <p className="text-xs text-blue-600">En attente d'acceptation...</p>
                    </div>
                </div>
                <button
                    onClick={handleCancel}
                    className="w-full py-1 bg-white text-gray-500 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 hover:text-red-500 transition-colors"
                >
                    Annuler l'envoi
                </button>
            </div>
        );
    }

    // État: En attente d'acceptation (Destinataire)
    if (!isMe && (!status || status === 'pending')) {
        return (
            <div className="w-64 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                {isVideo && fileInfo.thumbnail && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black">
                        <img src={fileInfo.thumbnail} alt="Preview" className="w-full h-32 object-cover opacity-80" />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                            {(fileInfo.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                    </div>
                )}
                <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">📥</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{fileInfo.name}</p>
                        <p className="text-xs text-gray-500">{(fileInfo.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleAccept}
                        className="flex-1 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors"
                    >
                        Accepter
                    </button>
                    <button
                        onClick={handleReject}
                        className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded border border-red-100 hover:bg-red-100 transition-colors"
                    >
                        Refuser
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

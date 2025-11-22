import React, { useRef } from 'react';
import { useFileTransferStore } from '../../stores/file-transfer.store';
import { useWebRTCStore } from '../../stores/webrtc.store';

interface FileShareButtonProps {
    peerId: string;
}

export const FileShareButton: React.FC<FileShareButtonProps> = ({ peerId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { sendFile } = useFileTransferStore();
    const { isEncryptionEnabled } = useWebRTCStore();

    const generateVideoThumbnail = (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.playsInline = true;
            video.currentTime = 1; // Capture à 1 seconde

            video.onloadeddata = () => {
                // Attendre un peu pour être sûr que la frame est prête
                if (video.readyState >= 2) {
                    capture();
                } else {
                    video.oncanplay = capture;
                }
            };

            function capture() {
                try {
                    const canvas = document.createElement('canvas');
                    // Taille max de la miniature
                    const maxWidth = 320;
                    const scale = Math.min(1, maxWidth / video.videoWidth);

                    canvas.width = video.videoWidth * scale;
                    canvas.height = video.videoHeight * scale;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                    URL.revokeObjectURL(video.src);
                    resolve(thumbnail);
                } catch (e) {
                    console.error('Error generating thumbnail:', e);
                    URL.revokeObjectURL(video.src);
                    resolve(null);
                }
            }

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve(null);
            };
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        let thumbnail: string | undefined;

        try {
            // Générer une miniature pour les vidéos
            if (file.type.startsWith('video/')) {
                const thumb = await generateVideoThumbnail(file);
                if (thumb) thumbnail = thumb;
            }

            await sendFile(peerId, file, thumbnail);
        } catch (error) {
            console.error('File send failed:', error);

            // Message d'erreur
            useWebRTCStore.getState().addMessage({
                id: `file-error-${Date.now()}`,
                content: `❌ Erreur lors de l'envoi de "${file.name}"`,
                sender: 'system',
                timestamp: new Date(),
                type: 'system'
            });
        }

        // Réinitialiser l'input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple={false}
            />

            <button
                type="button"
                onClick={handleClick}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Envoyer un fichier"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>
        </>
    );
};

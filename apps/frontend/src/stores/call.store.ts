import { create } from 'zustand';
import { managers } from '../services/managers';

interface CallState {
    // État de l'appel
    currentCall: {
        peerId: string;
        type: 'audio' | 'video';
        status: 'connecting' | 'active' | 'ended' | 'failed';
        direction: 'outgoing' | 'incoming';
        startTime?: Date;
        endTime?: Date;
    } | null;

    // Streams média
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    // Contrôles
    isAudioMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;

    // Actions
    startCall: (peerId: string, type: 'audio' | 'video') => Promise<void>;
    acceptCall: (peerId: string) => Promise<void>;
    endCall: () => void;
    rejectCall: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => Promise<void>;
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
    currentCall: null,
    localStream: null,
    remoteStream: null,
    isAudioMuted: false,
    isVideoOff: false,
    isScreenSharing: false,

    startCall: async (peerId: string, type: 'audio' | 'video') => {
        try {
            // Obtenir les streams média
            const constraints = {
                audio: true,
                video: type === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };

            const localStream = await navigator.mediaDevices.getUserMedia(constraints);

            set({
                currentCall: {
                    peerId,
                    type,
                    status: 'connecting',
                    direction: 'outgoing',
                    startTime: new Date()
                },
                localStream,
                isAudioMuted: false,
                isVideoOff: type === 'audio'
            });

            // Initier l'appel via WebRTC
            await managers.call.initiateCall(peerId, type, localStream);

        } catch (error: any) {
            console.error('Failed to start call:', error);
            set({
                currentCall: null,
                localStream: null
            });

            // Afficher une notification explicite à l'utilisateur
            const { showInAppNotification } = await import('../services/toast-helper');
            if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
                showInAppNotification(
                    '🚫 Accès refusé',
                    'Veuillez autoriser l\'accès à votre caméra et microphone pour passer des appels.',
                    { type: 'system', duration: 5000 }
                );
            } else if (error.name === 'NotFoundError' || error.message?.includes('not found')) {
                showInAppNotification(
                    '📷 Périphérique introuvable',
                    'Aucune caméra ou microphone détecté. Vérifiez que vos périphériques sont connectés.',
                    { type: 'system', duration: 5000 }
                );
            } else {
                showInAppNotification(
                    '❌ Erreur d\'appel',
                    `Impossible de démarrer l'appel: ${error.message || 'Erreur inconnue'}`,
                    { type: 'system', duration: 5000 }
                );
            }
            throw error;
        }
    },

    acceptCall: async (peerId: string) => {
        try {
            const { currentCall } = get();
            if (!currentCall || currentCall.peerId !== peerId) return;

            // Obtenir les streams média
            const constraints = {
                audio: true,
                video: currentCall.type === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            const localStream = await navigator.mediaDevices.getUserMedia(constraints);

            set({
                localStream,
                isAudioMuted: false,
                isVideoOff: currentCall.type === 'audio'
            });

            // Accepter l'appel via WebRTC
            await managers.call.acceptCall(peerId, localStream);

            // Mettre à jour le statut
            set((state) => ({
                currentCall: state.currentCall ? {
                    ...state.currentCall,
                    status: 'active'
                } : null
            }));

        } catch (error: any) {
            console.error('Failed to accept call:', error);
            get().endCall();

            // Afficher une notification explicite à l'utilisateur
            const { showInAppNotification } = await import('../services/toast-helper');
            if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
                showInAppNotification(
                    '🚫 Accès refusé',
                    'Veuillez autoriser l\'accès à votre caméra et microphone pour répondre à l\'appel.',
                    { type: 'system', duration: 5000 }
                );
            } else if (error.name === 'NotFoundError' || error.message?.includes('not found')) {
                showInAppNotification(
                    '📷 Périphérique introuvable',
                    'Aucune caméra ou microphone détecté. Vérifiez que vos périphériques sont connectés.',
                    { type: 'system', duration: 5000 }
                );
            } else {
                showInAppNotification(
                    '❌ Erreur d\'appel',
                    `Impossible d'accepter l'appel: ${error.message || 'Erreur inconnue'}`,
                    { type: 'system', duration: 5000 }
                );
            }
            throw error;
        }
    },

    endCall: () => {
        const { currentCall, localStream } = get();

        // Arrêter tous les streams
        localStream?.getTracks().forEach(track => track.stop());

        // Notifier le pair
        if (currentCall) {
            managers.call.endCall(currentCall.peerId);
        }

        set({
            currentCall: null,
            localStream: null,
            remoteStream: null,
            isScreenSharing: false
        });
    },

    rejectCall: () => {
        const { currentCall } = get();

        if (currentCall) {
            managers.call.rejectCall(currentCall.peerId);
        }

        set({
            currentCall: null,
            localStream: null,
            remoteStream: null
        });
    },

    toggleAudio: () => {
        const { localStream, isAudioMuted } = get();

        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isAudioMuted;
            });
        }

        set({ isAudioMuted: !isAudioMuted });
    },

    toggleVideo: () => {
        const { localStream, isVideoOff } = get();

        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = isVideoOff;
            });
        }

        set({ isVideoOff: !isVideoOff });
    },

    toggleScreenShare: async (sourceId?: string) => {
        const { isScreenSharing, localStream } = get();
        const anyWindow = typeof window !== 'undefined' ? (window as Window & { process?: { versions?: Record<string, string> } }) : undefined;
        const isElectron = Boolean(anyWindow?.process?.versions?.electron);

        try {
            if (isScreenSharing) {
                // Revenir à la caméra
                const videoTrack = localStream?.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.stop();
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: true
                });

                set({
                    localStream: newStream,
                    isScreenSharing: false
                });

                // Mettre à jour le track dans la connexion WebRTC
                await managers.call.replaceVideoTrack(newStream.getVideoTracks()[0]);

            } else {
                // Démarrer le partage d'écran avec sélection personnalisée en mode Electron
                let screenStream: MediaStream;

                if (isElectron && sourceId) {
                    const desktopConstraints: MediaStreamConstraints = {
                        audio: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sourceId,
                            },
                        } as unknown as MediaTrackConstraints,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sourceId,
                            },
                        } as unknown as MediaTrackConstraints,
                    };

                    screenStream = await navigator.mediaDevices.getUserMedia(desktopConstraints);
                } else {
                    // Fallback sur la sélection native (navigateur ou Electron sans source)
                    screenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: true
                    });
                }

                // Combiner l'audio du micro avec la vidéo de l'écran
                const audioTrack = localStream?.getAudioTracks()[0];
                if (audioTrack) {
                    screenStream.addTrack(audioTrack);
                }

                set({
                    localStream: screenStream,
                    isScreenSharing: true
                });

                // Mettre à jour le track dans la connexion WebRTC
                await managers.call.replaceVideoTrack(screenStream.getVideoTracks()[0]);

                // Gérer la fin du partage d'écran
                screenStream.getVideoTracks()[0].onended = () => {
                    get().toggleScreenShare();
                };
            }
        } catch (error) {
            console.error('Screen share failed:', error);
        }
    },

    setLocalStream: (stream: MediaStream | null) => {
        set({ localStream: stream });
    },

    setRemoteStream: (stream: MediaStream | null) => {
        set({ remoteStream: stream });
    }
}));

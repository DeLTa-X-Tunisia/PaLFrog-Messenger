import { useCallStore } from '../stores/call.store';
import { socketService } from './socket.service';
import { notificationService } from './notification.service';

class CallManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private pendingOffers: Map<string, RTCSessionDescriptionInit> = new Map();
    private currentPeerId: string | null = null;

    async initiateCall(peerId: string, type: 'audio' | 'video', localStream: MediaStream) {
        try {
            this.currentPeerId = peerId;

            // Créer la connexion WebRTC
            const peerConnection = await this.createPeerConnection(peerId, localStream);
            this.peerConnections.set(peerId, peerConnection);

            // Créer l'offre
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Envoyer l'offre via Socket.IO
            socketService.sendCallOffer(peerId, offer, type);

            // Timeout pour l'absence de réponse
            setTimeout(async () => {
                const { currentCall } = useCallStore.getState();
                if (currentCall?.status === 'connecting') {
                    useCallStore.getState().endCall();
                    // Notification in-app intégrée au lieu de notification système
                    const { showInAppNotification } = await import('./toast-helper');
                    showInAppNotification(
                        'Appel sans réponse',
                        'Aucune réponse de l\'utilisateur',
                        { type: 'call' }
                    );
                }
            }, 30000); // 30 secondes

        } catch (error) {
            console.error('Failed to initiate call:', error);
            throw error;
        }
    }

    async acceptCall(peerId: string, localStream: MediaStream) {
        // Vérifier si l'offre existe ou si l'appel est déjà accepté
        const offer = this.pendingOffers.get(peerId);
        if (!offer) {
            if (this.peerConnections.has(peerId)) {
                console.warn('Call already accepted for peer:', peerId);
                return;
            }
            throw new Error('No pending offer found for this call');
        }

        try {
            this.currentPeerId = peerId;

            const peerConnection = await this.createPeerConnection(peerId, localStream);
            this.peerConnections.set(peerId, peerConnection);

            // Définir la description distante (l'offre) AVANT de créer la réponse
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Créer la réponse
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Envoyer la réponse via Socket.IO
            socketService.sendCallAnswer(peerId, answer);

            // Nettoyer l'offre en attente
            this.pendingOffers.delete(peerId);

        } catch (error) {
            console.error('Failed to accept call:', error);
            throw error;
        }
    }

    async handleCallOffer(peerId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') {
        // Vérifier si on peut accepter l'appel
        const { currentCall } = useCallStore.getState();
        if (currentCall) {
            socketService.sendCallReject(peerId, 'BUSY');
            return;
        }

        // Stocker l'offre pour plus tard
        this.pendingOffers.set(peerId, offer);

        // Mettre à jour le store
        useCallStore.setState({
            currentCall: {
                peerId,
                type,
                status: 'connecting',
                direction: 'incoming',
                startTime: new Date()
            }
        });

        // Notification avec le nom d'utilisateur lisible
        const { useWebRTCStore } = await import('../stores/webrtc.store');
        const caller = useWebRTCStore.getState().onlineUsers.find((u: any) => u.userId === peerId);
        const callerName = caller?.username || 'Un utilisateur';
        await notificationService.notifyIncomingCall(callerName);
    }

    async handleCallAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
        const peerConnection = this.peerConnections.get(peerId);
        if (!peerConnection) return;

        await peerConnection.setRemoteDescription(answer);

        useCallStore.setState((state) => ({
            currentCall: state.currentCall ? {
                ...state.currentCall,
                status: 'active'
            } : null
        }));
    }

    async handleICECandidate(peerId: string, candidate: RTCIceCandidateInit) {
        const peerConnection = this.peerConnections.get(peerId);
        if (!peerConnection) return;

        await peerConnection.addIceCandidate(candidate);
    }

    endCall(peerId: string) {
        const peerConnection = this.peerConnections.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }

        socketService.sendCallEnd(peerId);

        if (this.currentPeerId === peerId) {
            this.currentPeerId = null;
        }
    }

    rejectCall(peerId: string) {
        socketService.sendCallReject(peerId, 'REJECTED');
        this.cleanupCall(peerId);
    }

    private async createPeerConnection(peerId: string, localStream: MediaStream): Promise<RTCPeerConnection> {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);

        // Ajouter les tracks locaux
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Gérer les tracks distants
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            useCallStore.getState().setRemoteStream(remoteStream);
        };

        // Gérer les candidats ICE
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.sendCallICECandidate(peerId, event.candidate);
            }
        };

        // Gérer les changements d'état
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;

            if (state === 'connected') {
                console.log('Call connected with:', peerId);
            } else if (state === 'disconnected' || state === 'failed') {
                console.log('Call disconnected with:', peerId);
                useCallStore.getState().endCall();
            }
        };

        return peerConnection;
    }

    async replaceVideoTrack(newTrack: MediaStreamTrack) {
        const { currentCall } = useCallStore.getState();
        if (!currentCall) return;

        const peerConnection = this.peerConnections.get(currentCall.peerId);
        if (!peerConnection) return;

        const sender = peerConnection.getSenders().find(s =>
            s.track?.kind === 'video'
        );

        if (sender) {
            await sender.replaceTrack(newTrack);
        }
    }

    private cleanupCall(peerId: string) {
        const peerConnection = this.peerConnections.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }

        if (this.currentPeerId === peerId) {
            this.currentPeerId = null;
        }
    }
}

// 🔒 Singleton sécurisé - Plus de pollution window.*
const callManager = new CallManager();

export { callManager };

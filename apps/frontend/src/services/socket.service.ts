import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useWebRTCStore } from '../stores/webrtc.store';
import { notificationService } from './notification.service';
import { useCallStore } from '../stores/call.store';
import { callManager } from './call-manager';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        const { accessToken, user } = useAuthStore.getState();

        if (!accessToken || !user) {
            console.error('Cannot connect: No authentication token');
            return;
        }

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        // Connexion au namespace /webrtc
        this.socket = io(`${baseUrl}/webrtc`, {
            auth: {
                token: accessToken,
            },
            transports: ['websocket', 'polling'],
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
            this.reconnectAttempts = 0;
            // Demander la liste des utilisateurs connectés à chaque connexion/reconnexion
            this.socket?.emit('get-online-users');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from signaling server:', reason);

            if (reason === 'io server disconnect') {
                // Reconnexion nécessaire
                this.socket?.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.handleReconnection();
        });

        // Événements de signalisation WebRTC
        this.socket.on('webrtc-offer', this.handleWebRTCOffer);
        this.socket.on('webrtc-answer', this.handleWebRTCAnswer);
        this.socket.on('webrtc-ice-candidate', this.handleICECandidate);
        this.socket.on('user-online', this.handleUserOnline);
        this.socket.on('user-offline', this.handleUserOffline);
        this.socket.on('online-users', this.handleOnlineUsers);
        this.socket.on('typing-start', this.handleTypingStart);
        this.socket.on('typing-stop', this.handleTypingStop);
        this.socket.on('profile-updated', this.handleProfileUpdated);
        this.socket.on('status-updated', this.handleStatusUpdated);

        // Événements d'appel
        this.socket.on('call-offer', this.handleCallOffer);
        this.socket.on('call-answer', this.handleCallAnswer);
        this.socket.on('call-end', this.handleCallEnd);
        this.socket.on('call-reject', this.handleCallReject);
        this.socket.on('call-ice-candidate', this.handleCallICECandidate);
    }

    // Méthodes de signalisation WebRTC
    sendOffer(to: string, offer: RTCSessionDescriptionInit) {
        this.socket?.emit('webrtc-offer', { to, offer });
    }

    sendAnswer(to: string, answer: RTCSessionDescriptionInit) {
        this.socket?.emit('webrtc-answer', { to, answer });
    }

    sendICECandidate(to: string, candidate: RTCIceCandidateInit) {
        this.socket?.emit('webrtc-ice-candidate', { to, candidate });
    }

    sendTypingStart(peerId: string) {
        this.socket?.emit('typing-start', { to: peerId });
    }

    sendTypingStop(peerId: string) {
        this.socket?.emit('typing-stop', { to: peerId });
    }

    updateStatus(status: string) {
        console.log('✅ SocketService: Emitting update-status with status:', status);
        if (!this.socket) {
            console.error('❌ SocketService: Socket is not connected');
            return;
        }
        this.socket.emit('update-status', { status });
        console.log('✅ SocketService: update-status emitted');
    }

    // Méthodes d'appel
    sendCallOffer(to: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') {
        this.socket?.emit('call-offer', { to, offer, type });
    }

    sendCallAnswer(to: string, answer: RTCSessionDescriptionInit) {
        this.socket?.emit('call-answer', { to, answer });
    }

    sendCallEnd(to: string) {
        this.socket?.emit('call-end', { to });
    }

    sendCallReject(to: string, reason: string) {
        this.socket?.emit('call-reject', { to, reason });
    }

    sendCallICECandidate(to: string, candidate: RTCIceCandidateInit) {
        this.socket?.emit('call-ice-candidate', { to, candidate });
    }

    // Gestionnaires d'événements
    private handleWebRTCOffer = (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        console.log('Offer received from:', data.from);
        useWebRTCStore.getState().handleOffer(data.from, data.offer);
    };

    private handleWebRTCAnswer = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        console.log('Answer received from:', data.from);
        useWebRTCStore.getState().handleAnswer(data.from, data.answer);
    };

    private handleICECandidate = (data: { from: string; candidate: RTCIceCandidateInit }) => {
        console.log('ICE candidate received from:', data.from);
        useWebRTCStore.getState().handleCandidate(data.from, data.candidate);
    };

    private handleTypingStart = (data: { from: string }) => {
        useWebRTCStore.getState().setTypingIndicator(data.from, true);
    };

    private handleTypingStop = (data: { from: string }) => {
        useWebRTCStore.getState().setTypingIndicator(data.from, false);
    };

    private handleCallOffer = (data: { from: string; offer: RTCSessionDescriptionInit; type: 'audio' | 'video' }) => {
        callManager.handleCallOffer(data.from, data.offer, data.type);
    };

    private handleCallAnswer = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        callManager.handleCallAnswer(data.from, data.answer);
    };

    private handleCallEnd = (data: { from: string }) => {
        useCallStore.getState().endCall();
    };

    private handleCallReject = async (data: { from: string; reason: string }) => {
        useCallStore.getState().endCall();
        // Notification in-app intégrée au lieu de notification système
        const { showInAppNotification } = await import('./toast-helper');
        showInAppNotification(
            'Appel rejeté',
            `Raison: ${data.reason}`,
            { type: 'call' }
        );
    };

    private handleCallICECandidate = (data: { from: string; candidate: RTCIceCandidateInit }) => {
        callManager.handleICECandidate(data.from, data.candidate);
    };

    private handleUserOnline = (data: { userId: string; userInfo: any }) => {
        console.log('User online:', data.userId);
        const status = data.userInfo.status || 'online';

        useWebRTCStore.getState().addUser({
            userId: data.userId,
            username: data.userInfo.username,
            email: data.userInfo.email,
            avatarUrl: data.userInfo.avatarUrl,
            isOnline: true,
            status: status
        });

        // Only notify if not offline/invisible
        if (status !== 'offline') {
            notificationService.notifyUserStatusChange(data.userInfo.username, status, data.userId);
        }
    };

    private handleUserOffline = (data: { userId: string }) => {
        console.log('User offline:', data.userId);
        const user = useWebRTCStore.getState().onlineUsers.find(u => u.userId === data.userId);
        if (user) {
            notificationService.notifyUserStatusChange(user.username, 'offline', data.userId);
        }
        useWebRTCStore.getState().removeUser(data.userId);
    };

    private handleOnlineUsers = (users: Array<{ userId: string; username: string; email: string; isOnline: boolean; status?: string }>) => {
        console.log('Online users:', users);
        // Map users to ensure status is present
        const mappedUsers = users.map(u => ({
            ...u,
            status: (u.status || 'online') as 'online' | 'busy' | 'away' | 'dnd' | 'offline'
        }));
        useWebRTCStore.getState().setOnlineUsers(mappedUsers);
    };

    private handleProfileUpdated = (data: { userId: string; avatarUrl?: string; username?: string }) => {
        console.log('Socket: profile-updated received', data);
        const { user, updateUser } = useAuthStore.getState();
        const { onlineUsers, setOnlineUsers } = useWebRTCStore.getState();

        // Update current user if it matches
        if (user && user.id === data.userId) {
            console.log('Socket: Updating current user profile');
            updateUser({ avatarUrl: data.avatarUrl, username: data.username });
        }

        // Update online users list
        const updatedOnlineUsers = onlineUsers.map(u => {
            if (u.userId === data.userId) {
                return { ...u, ...data };
            }
            return u;
        });
        setOnlineUsers(updatedOnlineUsers);

        // Update chat avatar in database
        if (data.avatarUrl) {
            // Assuming chatId is the userId for 1-to-1 chats
            import('./database.service').then(({ databaseService }) => {
                databaseService.updateChatAvatar(data.userId, data.avatarUrl!);
            });
        }
    };

    private handleStatusUpdated = (data: { userId: string; status: string; username: string }) => {
        console.log('🔔 Socket: status-updated received', data);
        try {
            const store = useWebRTCStore.getState();
            const { updateUserStatus } = store;
            const currentUsers = store.onlineUsers;
            const user = currentUsers.find(u => u.userId === data.userId);
            console.log('🔔 Socket: Current user in store before update:', user);

            // Update store
            console.log('🔔 Socket: Calling updateUserStatus...');
            updateUserStatus(data.userId, data.status);

            // Verify update
            setTimeout(() => {
                const updatedStore = useWebRTCStore.getState();
                const updatedUser = updatedStore.onlineUsers.find(u => u.userId === data.userId);
                console.log('🔔 Socket: After update, user is:', updatedUser);
            }, 0);

            // Show notification
            console.log('🔔 Socket: Showing notification for', data.username);
            notificationService.notifyUserStatusChange(data.username, data.status, data.userId);
        } catch (error) {
            console.error('❌ Socket: Error handling status update', error);
        }
    };

    private handleReconnection() {
        this.reconnectAttempts++;

        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Reconnection attempt ${this.reconnectAttempts}`);
                this.socket?.connect();
            }, 1000 * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();

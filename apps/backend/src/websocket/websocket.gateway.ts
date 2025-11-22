import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
    user: {
        userId: string;
        email: string;
        username: string;
    };
}

@WebSocketGateway({
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5173'
        ],
        credentials: true,
    },
    namespace: '/webrtc',
    cookie: {
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    },
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, { socketId: string; userInfo: any; status: string }>();

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Mode test: UNIQUEMENT en développement ET avec flag explicite
            const isTestModeAllowed = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_AUTH === 'true';

            if (isTestModeAllowed && client.handshake.auth.userId && client.handshake.auth.username && !client.handshake.auth.token) {
                console.log('🧪 TEST MODE: Direct auth without JWT (dev only)');
                client.user = {
                    userId: client.handshake.auth.userId,
                    email: `${client.handshake.auth.userId}@test.local`,
                    username: client.handshake.auth.username,
                };
            } else {
                // Authentifier via JWT (requis en production)
                const token = client.handshake.auth.token;

                if (!token) {
                    throw new Error('Authentication token is required');
                }

                console.log('🔐 Authenticating with JWT');
                const payload = this.jwtService.verify(token);

                client.user = {
                    userId: payload.sub,
                    email: payload.email,
                    username: payload.username,
                };
            }

            // Récupérer l'avatar depuis la base de données (skip en mode test)
            let avatarUrl: string | undefined;
            if (!client.handshake.auth.userId) {
                const user = await this.prisma.user.findUnique({
                    where: { id: client.user.userId },
                    include: { profile: true }
                });
                avatarUrl = user?.profile?.avatarUrl;
            }

            // Stocker la connexion
            this.connectedUsers.set(client.user.userId, {
                socketId: client.id,
                userInfo: {
                    username: client.user.username,
                    email: client.user.email,
                    avatarUrl: avatarUrl
                },
                status: 'online'
            });

            // Notifier les autres utilisateurs
            client.broadcast.emit('user-online', {
                userId: client.user.userId,
                userInfo: {
                    username: client.user.username,
                    email: client.user.email,
                    avatarUrl: avatarUrl,
                    status: 'online'
                },
            });

            console.log(`User ${client.user.username} connected`);

        } catch (error) {
            console.error('WebSocket authentication failed:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.user) {
            this.connectedUsers.delete(client.user.userId);

            // Notifier les autres utilisateurs
            client.broadcast.emit('user-offline', {
                userId: client.user.userId,
            });

            console.log(`User ${client.user.username} disconnected`);
        }
    }

    @SubscribeMessage('webrtc-offer')
    handleOffer(client: AuthenticatedSocket, data: { to: string; offer: RTCSessionDescriptionInit }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-offer', {
                from: client.user.userId,
                offer: data.offer,
            });
        }
    }

    @SubscribeMessage('webrtc-answer')
    handleAnswer(client: AuthenticatedSocket, data: { to: string; answer: RTCSessionDescriptionInit }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-answer', {
                from: client.user.userId,
                answer: data.answer,
            });
        }
    }

    @SubscribeMessage('typing-start')
    handleTypingStart(client: AuthenticatedSocket, data: { to: string }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('typing-start', {
                from: client.user.userId,
            });
        }
    }

    @SubscribeMessage('typing-stop')
    handleTypingStop(client: AuthenticatedSocket, data: { to: string }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('typing-stop', {
                from: client.user.userId,
            });
        }
    }

    @SubscribeMessage('call-offer')
    handleCallOffer(client: AuthenticatedSocket, data: { to: string; offer: RTCSessionDescriptionInit; type: 'audio' | 'video' }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-offer', {
                from: client.user.userId,
                offer: data.offer,
                type: data.type,
            });
        }
    }

    @SubscribeMessage('call-answer')
    handleCallAnswer(client: AuthenticatedSocket, data: { to: string; answer: RTCSessionDescriptionInit }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-answer', {
                from: client.user.userId,
                answer: data.answer,
            });
        }
    }

    @SubscribeMessage('call-end')
    handleCallEnd(client: AuthenticatedSocket, data: { to: string }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-end', {
                from: client.user.userId,
            });
        }
    }

    @SubscribeMessage('call-reject')
    handleCallReject(client: AuthenticatedSocket, data: { to: string; reason: string }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-reject', {
                from: client.user.userId,
                reason: data.reason,
            });
        }
    }

    @SubscribeMessage('call-ice-candidate')
    handleCallICECandidate(client: AuthenticatedSocket, data: { to: string; candidate: RTCIceCandidateInit }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-ice-candidate', {
                from: client.user.userId,
                candidate: data.candidate,
            });
        }
    }

    @SubscribeMessage('webrtc-ice-candidate')
    handleICECandidate(client: AuthenticatedSocket, data: { to: string; candidate: RTCIceCandidateInit }) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-ice-candidate', {
                from: client.user.userId,
                candidate: data.candidate,
            });
        }
    }

    @SubscribeMessage('get-online-users')
    handleGetOnlineUsers(client: AuthenticatedSocket) {
        const onlineUsers = Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
            userId,
            username: data.userInfo.username,
            email: data.userInfo.email,
            avatarUrl: data.userInfo.avatarUrl,
            isOnline: true,
            status: data.status
        }));

        client.emit('online-users', onlineUsers);
    }

    @SubscribeMessage('update-status')
    handleUpdateStatus(client: AuthenticatedSocket, payload: { status: string }) {
        try {
            console.log('\n🎯🎯🎯 [GATEWAY TEST] update-status received from', client.user.username, 'new status:', payload.status);
            console.log('🎯 Current connectedUsers count:', this.connectedUsers.size);
            const user = this.connectedUsers.get(client.user.userId);
            if (!user) {
                console.warn('⚠️ Gateway: User not found! Keys in Map:', Array.from(this.connectedUsers.keys()));
                return;
            }
            console.log('🎯 Gateway: Updating user status...');
            user.status = payload.status;
            this.connectedUsers.set(client.user.userId, user);

            const statusUpdateData = {
                userId: client.user.userId,
                status: payload.status,
                username: client.user.username
            };

            console.log('🎯 Gateway: Broadcasting to all clients');
            client.broadcast.emit('status-updated', statusUpdateData);
            client.emit('status-updated', statusUpdateData);
            console.log('🎯 Gateway: Broadcast complete');
        } catch (error) {
            console.error('❌ ERROR in handleUpdateStatus:', error);
        }
    }
}

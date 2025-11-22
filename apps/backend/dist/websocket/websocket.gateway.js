"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let WebRTCGateway = class WebRTCGateway {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.connectedUsers = new Map();
    }
    async handleConnection(client) {
        var _a;
        try {
            const isTestModeAllowed = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_AUTH === 'true';
            if (isTestModeAllowed && client.handshake.auth.userId && client.handshake.auth.username && !client.handshake.auth.token) {
                console.log('🧪 TEST MODE: Direct auth without JWT (dev only)');
                client.user = {
                    userId: client.handshake.auth.userId,
                    email: `${client.handshake.auth.userId}@test.local`,
                    username: client.handshake.auth.username,
                };
            }
            else {
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
            let avatarUrl;
            if (!client.handshake.auth.userId) {
                const user = await this.prisma.user.findUnique({
                    where: { id: client.user.userId },
                    include: { profile: true }
                });
                avatarUrl = (_a = user === null || user === void 0 ? void 0 : user.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl;
            }
            this.connectedUsers.set(client.user.userId, {
                socketId: client.id,
                userInfo: {
                    username: client.user.username,
                    email: client.user.email,
                    avatarUrl: avatarUrl
                },
                status: 'online'
            });
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
        }
        catch (error) {
            console.error('WebSocket authentication failed:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.user) {
            this.connectedUsers.delete(client.user.userId);
            client.broadcast.emit('user-offline', {
                userId: client.user.userId,
            });
            console.log(`User ${client.user.username} disconnected`);
        }
    }
    handleOffer(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-offer', {
                from: client.user.userId,
                offer: data.offer,
            });
        }
    }
    handleAnswer(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-answer', {
                from: client.user.userId,
                answer: data.answer,
            });
        }
    }
    handleTypingStart(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('typing-start', {
                from: client.user.userId,
            });
        }
    }
    handleTypingStop(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('typing-stop', {
                from: client.user.userId,
            });
        }
    }
    handleCallOffer(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-offer', {
                from: client.user.userId,
                offer: data.offer,
                type: data.type,
            });
        }
    }
    handleCallAnswer(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-answer', {
                from: client.user.userId,
                answer: data.answer,
            });
        }
    }
    handleCallEnd(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-end', {
                from: client.user.userId,
            });
        }
    }
    handleCallReject(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-reject', {
                from: client.user.userId,
                reason: data.reason,
            });
        }
    }
    handleCallICECandidate(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('call-ice-candidate', {
                from: client.user.userId,
                candidate: data.candidate,
            });
        }
    }
    handleICECandidate(client, data) {
        const target = this.connectedUsers.get(data.to);
        if (target) {
            this.server.to(target.socketId).emit('webrtc-ice-candidate', {
                from: client.user.userId,
                candidate: data.candidate,
            });
        }
    }
    handleGetOnlineUsers(client) {
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
    handleUpdateStatus(client, payload) {
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
        }
        catch (error) {
            console.error('❌ ERROR in handleUpdateStatus:', error);
        }
    }
};
exports.WebRTCGateway = WebRTCGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebRTCGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-offer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-answer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing-start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing-stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-offer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleCallOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-answer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleCallAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-end'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleCallEnd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-reject'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleCallReject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-ice-candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleCallICECandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-ice-candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleICECandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get-online-users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleGetOnlineUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleUpdateStatus", null);
exports.WebRTCGateway = WebRTCGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
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
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], WebRTCGateway);
//# sourceMappingURL=websocket.gateway.js.map
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export declare class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    server: Server;
    private connectedUsers;
    constructor(jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleOffer(client: AuthenticatedSocket, data: {
        to: string;
        offer: RTCSessionDescriptionInit;
    }): void;
    handleAnswer(client: AuthenticatedSocket, data: {
        to: string;
        answer: RTCSessionDescriptionInit;
    }): void;
    handleTypingStart(client: AuthenticatedSocket, data: {
        to: string;
    }): void;
    handleTypingStop(client: AuthenticatedSocket, data: {
        to: string;
    }): void;
    handleCallOffer(client: AuthenticatedSocket, data: {
        to: string;
        offer: RTCSessionDescriptionInit;
        type: 'audio' | 'video';
    }): void;
    handleCallAnswer(client: AuthenticatedSocket, data: {
        to: string;
        answer: RTCSessionDescriptionInit;
    }): void;
    handleCallEnd(client: AuthenticatedSocket, data: {
        to: string;
    }): void;
    handleCallReject(client: AuthenticatedSocket, data: {
        to: string;
        reason: string;
    }): void;
    handleCallICECandidate(client: AuthenticatedSocket, data: {
        to: string;
        candidate: RTCIceCandidateInit;
    }): void;
    handleICECandidate(client: AuthenticatedSocket, data: {
        to: string;
        candidate: RTCIceCandidateInit;
    }): void;
    handleGetOnlineUsers(client: AuthenticatedSocket): void;
    handleUpdateStatus(client: AuthenticatedSocket, payload: {
        status: string;
    }): void;
}
export {};

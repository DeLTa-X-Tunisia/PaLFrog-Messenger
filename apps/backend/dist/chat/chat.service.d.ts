import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    createConversation(userIds: string[]): Promise<{
        participants: ({
            user: {
                username: string;
                id: string;
                email: string;
                passwordHash: string;
                role: import(".prisma/client").$Enums.UserRole;
                birthDate: Date | null;
                gender: string | null;
                isTwoFactorEnabled: boolean;
                twoFactorSecret: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            userId: string;
            id: string;
            role: import(".prisma/client").$Enums.RoomRole;
            joinedAt: Date;
            canPost: boolean;
            isMuted: boolean;
            conversationId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getConversations(userId: string): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            content: string;
            conversationId: string;
            senderId: string;
            isRead: boolean;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                email: string;
            };
        } & {
            userId: string;
            id: string;
            role: import(".prisma/client").$Enums.RoomRole;
            joinedAt: Date;
            canPost: boolean;
            isMuted: boolean;
            conversationId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    saveMessage(userId: string, conversationId: string, content: string, type?: 'TEXT' | 'FILE' | 'SYSTEM'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        content: string;
        conversationId: string;
        senderId: string;
        isRead: boolean;
    }>;
    getMessages(conversationId: string, userId: string, limit?: number): Promise<({
        sender: {
            username: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        content: string;
        conversationId: string;
        senderId: string;
        isRead: boolean;
    })[]>;
}

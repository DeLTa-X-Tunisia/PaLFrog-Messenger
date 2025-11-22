import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createConversation(req: any, body: {
        userIds: string[];
    }): Promise<{
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
    getConversations(req: any): Promise<({
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
    sendMessage(req: any, conversationId: string, body: {
        content: string;
        type?: 'TEXT' | 'FILE' | 'SYSTEM';
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        content: string;
        conversationId: string;
        senderId: string;
        isRead: boolean;
    }>;
    getMessages(req: any, conversationId: string): Promise<({
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

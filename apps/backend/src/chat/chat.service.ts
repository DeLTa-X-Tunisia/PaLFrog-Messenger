import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async createConversation(userIds: string[]) {
        // Check if conversation exists between these exact users
        // This is complex in SQL/Prisma, simplified approach:
        // For 1-on-1, we can check if there is a conversation with exactly these 2 participants.

        if (userIds.length === 2) {
            // Try to find existing 1v1
            // This query is tricky, skipping optimization for now.
            // We'll just create a new one if we don't find it easily, or rely on frontend to send ID.
        }

        const conversation = await this.prisma.conversation.create({
            data: {
                participants: {
                    create: userIds.map(id => ({ userId: id }))
                }
            },
            include: {
                participants: {
                    include: { user: true }
                }
            }
        });
        return conversation;
    }

    async getConversations(userId: string) {
        return this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true }
                        }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    async saveMessage(userId: string, conversationId: string, content: string, type: 'TEXT' | 'FILE' | 'SYSTEM' = 'TEXT') {
        // Verify membership
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        });

        if (!participant || !participant.canPost) {
            throw new Error('User not authorized to post in this conversation');
        }

        return this.prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content,
                type
            }
        });
    }

    async getMessages(conversationId: string, userId: string, limit = 50) {
        // Verify membership
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        });

        if (!participant) {
            throw new Error('Access denied');
        }

        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: limit,
            include: {
                sender: {
                    select: { id: true, username: true }
                }
            }
        });
    }
}

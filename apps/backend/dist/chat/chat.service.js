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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConversation(userIds) {
        if (userIds.length === 2) {
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
    async getConversations(userId) {
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
    async saveMessage(userId, conversationId, content, type = 'TEXT') {
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
    async getMessages(conversationId, userId, limit = 50) {
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map
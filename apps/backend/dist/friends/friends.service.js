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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FriendsService = class FriendsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchUsers(query, currentUserId) {
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                    { id: { not: currentUserId } },
                ],
            },
            select: {
                id: true,
                username: true,
                email: true,
                birthDate: true,
                gender: true,
                profile: {
                    select: {
                        avatarUrl: true
                    }
                }
            },
        });
        const friends = await this.prisma.friend.findMany({
            where: {
                userId: currentUserId,
                friendId: { in: users.map(u => u.id) },
            },
        });
        return users.map(user => {
            var _a;
            const friendRelation = friends.find(f => f.friendId === user.id);
            return Object.assign(Object.assign({}, user), { avatarUrl: (_a = user.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl, friendStatus: friendRelation ? friendRelation.status : null });
        });
    }
    async getAllUsers(currentUserId) {
        const users = await this.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
            },
            select: {
                id: true,
                username: true,
                email: true,
                birthDate: true,
                gender: true,
                profile: {
                    select: {
                        avatarUrl: true
                    }
                }
            },
        });
        const friends = await this.prisma.friend.findMany({
            where: {
                userId: currentUserId,
            },
        });
        return users.map(user => {
            var _a;
            const friendRelation = friends.find(f => f.friendId === user.id);
            return Object.assign(Object.assign({}, user), { avatarUrl: (_a = user.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl, friendStatus: friendRelation ? friendRelation.status : null });
        });
    }
    async addFriend(userId, friendId) {
        if (userId === friendId) {
            throw new common_1.BadRequestException('Cannot add yourself');
        }
        const existing = await this.prisma.friend.findUnique({
            where: {
                userId_friendId: {
                    userId,
                    friendId,
                },
            },
        });
        if (existing) {
            if (existing.status === client_1.FriendStatus.BLOCKED) {
                throw new common_1.BadRequestException('User is blocked');
            }
            if (existing.status === client_1.FriendStatus.ACCEPTED) {
                throw new common_1.BadRequestException('Already friends');
            }
            return existing;
        }
        const friend = await this.prisma.friend.create({
            data: {
                userId,
                friendId,
                status: client_1.FriendStatus.ACCEPTED,
            },
        });
        await this.prisma.friend.create({
            data: {
                userId: friendId,
                friendId: userId,
                status: client_1.FriendStatus.ACCEPTED
            }
        }).catch(() => { });
        return friend;
    }
    async getFriends(userId) {
        const friends = await this.prisma.friend.findMany({
            where: {
                userId,
                status: {
                    in: [client_1.FriendStatus.ACCEPTED, client_1.FriendStatus.BLOCKED],
                },
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        birthDate: true,
                        gender: true,
                        profile: {
                            select: {
                                avatarUrl: true
                            }
                        }
                    },
                },
            },
        });
        return friends.map(f => {
            var _a;
            return (Object.assign(Object.assign({}, f), { friend: Object.assign(Object.assign({}, f.friend), { avatarUrl: (_a = f.friend.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl }) }));
        });
    }
    async blockUser(userId, friendId) {
        return this.prisma.friend.upsert({
            where: {
                userId_friendId: {
                    userId,
                    friendId,
                },
            },
            update: {
                status: client_1.FriendStatus.BLOCKED,
            },
            create: {
                userId,
                friendId,
                status: client_1.FriendStatus.BLOCKED,
            },
        });
    }
    async removeFriend(userId, friendId) {
        await this.prisma.friend.deleteMany({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });
        return { success: true };
    }
    async unblockUser(userId, friendId) {
        return this.prisma.friend.deleteMany({
            where: {
                userId,
                friendId,
                status: client_1.FriendStatus.BLOCKED,
            },
        });
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FriendsService);
//# sourceMappingURL=friends.service.js.map
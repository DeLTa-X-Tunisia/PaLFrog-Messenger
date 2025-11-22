import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendStatus } from '@prisma/client';

@Injectable()
export class FriendsService {
    constructor(private prisma: PrismaService) { }

    async searchUsers(query: string, currentUserId: string) {
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
            const friendRelation = friends.find(f => f.friendId === user.id);
            return {
                ...user,
                avatarUrl: user.profile?.avatarUrl, // Flatten avatarUrl
                friendStatus: friendRelation ? friendRelation.status : null,
            };
        });
    }

    async getAllUsers(currentUserId: string) {
        // Get all users except self
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

        // Get friend status for each user
        const friends = await this.prisma.friend.findMany({
            where: {
                userId: currentUserId,
            },
        });

        return users.map(user => {
            const friendRelation = friends.find(f => f.friendId === user.id);
            return {
                ...user,
                avatarUrl: user.profile?.avatarUrl, // Flatten avatarUrl
                friendStatus: friendRelation ? friendRelation.status : null,
            };
        });
    }

    async addFriend(userId: string, friendId: string) {
        if (userId === friendId) {
            throw new BadRequestException('Cannot add yourself');
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
            if (existing.status === FriendStatus.BLOCKED) {
                throw new BadRequestException('User is blocked');
            }
            if (existing.status === FriendStatus.ACCEPTED) {
                throw new BadRequestException('Already friends');
            }
            return existing;
        }

        // Create friend entry for requester
        const friend = await this.prisma.friend.create({
            data: {
                userId,
                friendId,
                status: FriendStatus.ACCEPTED, // Auto-accept for now as per prompt simplicity, or PENDING if requested
            },
        });

        // Create reciprocal entry (since friendship is usually bidirectional in simple apps)
        // If we want strict request/accept flow, we would only create one and wait for update.
        // The prompt says "When user clicks Add -> Friend is added to contact list". 
        // It implies immediate addition or at least local visibility.
        // Let's make it bidirectional ACCEPTED for simplicity unless "pending" is strictly required.
        // The prompt mentions "Status (pending, accepted, blocked)" but also "Contacts displayed are only those with Status = accepted".
        // Let's stick to ACCEPTED for now to satisfy "Conversations possible only with friends".

        await this.prisma.friend.create({
            data: {
                userId: friendId,
                friendId: userId,
                status: FriendStatus.ACCEPTED
            }
        }).catch(() => { }); // Ignore if already exists

        return friend;
    }

    async getFriends(userId: string) {
        const friends = await this.prisma.friend.findMany({
            where: {
                userId,
                status: {
                    in: [FriendStatus.ACCEPTED, FriendStatus.BLOCKED],
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

        return friends.map(f => ({
            ...f,
            friend: {
                ...f.friend,
                avatarUrl: f.friend.profile?.avatarUrl // Flatten avatarUrl
            }
        }));
    }

    async blockUser(userId: string, friendId: string) {
        // Upsert to handle both existing friend and new block
        return this.prisma.friend.upsert({
            where: {
                userId_friendId: {
                    userId,
                    friendId,
                },
            },
            update: {
                status: FriendStatus.BLOCKED,
            },
            create: {
                userId,
                friendId,
                status: FriendStatus.BLOCKED,
            },
        });
    }

    async removeFriend(userId: string, friendId: string) {
        // Remove both sides of the relationship
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

    async unblockUser(userId: string, friendId: string) {
        // Unblocking removes the block entry, effectively making them strangers
        return this.prisma.friend.deleteMany({
            where: {
                userId,
                friendId,
                status: FriendStatus.BLOCKED,
            },
        });
    }
}

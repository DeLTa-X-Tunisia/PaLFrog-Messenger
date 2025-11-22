import { PrismaService } from '../prisma/prisma.service';
export declare class FriendsService {
    private prisma;
    constructor(prisma: PrismaService);
    searchUsers(query: string, currentUserId: string): Promise<{
        avatarUrl: string;
        friendStatus: import(".prisma/client").$Enums.FriendStatus;
        username: string;
        id: string;
        email: string;
        birthDate: Date;
        gender: string;
        profile: {
            avatarUrl: string;
        };
    }[]>;
    getAllUsers(currentUserId: string): Promise<{
        avatarUrl: string;
        friendStatus: import(".prisma/client").$Enums.FriendStatus;
        username: string;
        id: string;
        email: string;
        birthDate: Date;
        gender: string;
        profile: {
            avatarUrl: string;
        };
    }[]>;
    addFriend(userId: string, friendId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendStatus;
        friendId: string;
    }>;
    getFriends(userId: string): Promise<{
        friend: {
            avatarUrl: string;
            username: string;
            id: string;
            email: string;
            birthDate: Date;
            gender: string;
            profile: {
                avatarUrl: string;
            };
        };
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendStatus;
        friendId: string;
    }[]>;
    blockUser(userId: string, friendId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendStatus;
        friendId: string;
    }>;
    removeFriend(userId: string, friendId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(userId: string, friendId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}

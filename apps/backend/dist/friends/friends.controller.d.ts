import { FriendsService } from './friends.service';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    search(req: any, query: string): Promise<{
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
    getFriends(req: any): Promise<{
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
    addFriend(req: any, body: {
        friendId: string;
    }): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendStatus;
        friendId: string;
    }>;
    blockUser(req: any, body: {
        friendId: string;
    }): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendStatus;
        friendId: string;
    }>;
    removeFriend(req: any, body: {
        friendId: string;
    }): Promise<{
        success: boolean;
    }>;
    unblockUser(req: any, body: {
        friendId: string;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
}

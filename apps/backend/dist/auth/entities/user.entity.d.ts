export declare enum UserRole {
    SERVER_MASTER = "SERVER_MASTER",
    SERVER_SUPER_ADMIN = "SERVER_SUPER_ADMIN",
    SERVER_ADMIN = "SERVER_ADMIN",
    SERVER_MODERATOR = "SERVER_MODERATOR",
    SERVER_HELPER = "SERVER_HELPER",
    SERVER_EDITOR = "SERVER_EDITOR",
    POWER_USER_A = "POWER_USER_A",
    POWER_USER_B = "POWER_USER_B",
    POWER_USER_C = "POWER_USER_C",
    USER = "USER",
    GUEST = "GUEST"
}
export declare class UserEntity {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    birthDate?: Date;
    gender?: string;
    createdAt: Date;
    updatedAt: Date;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    constructor(partial: Partial<UserEntity> & {
        profile?: any;
    });
}

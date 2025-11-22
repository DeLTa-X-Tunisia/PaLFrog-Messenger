export interface User {
    id: string;
    username: string;
    email: string;
    role: 'SERVER_MASTER' | 'SERVER_SUPER_ADMIN' | 'SERVER_ADMIN' | 'SERVER_MODERATOR' | 'SERVER_HELPER' | 'SERVER_EDITOR' | 'POWER_USER_A' | 'POWER_USER_B' | 'POWER_USER_C' | 'USER' | 'GUEST';
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
}

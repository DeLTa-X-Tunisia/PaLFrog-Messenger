import { api } from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    birthDate?: string;
    gender?: string;
    avatarUrl?: string;
    friendStatus?: 'PENDING' | 'ACCEPTED' | 'BLOCKED' | null;
    status?: 'online' | 'busy' | 'away' | 'dnd' | 'offline';
}

export const friendsService = {
    searchUsers: async (query: string): Promise<User[]> => {
        const response = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get('/friends/search?q=');
        return response.data;
    },

    getFriends: async (): Promise<any[]> => {
        const response = await api.get('/friends');
        return response.data;
    },

    addFriend: async (friendId: string) => {
        const response = await api.post('/friends/add', { friendId });
        return response.data;
    },

    blockUser: async (friendId: string) => {
        const response = await api.post('/friends/block', { friendId });
        return response.data;
    },

    removeFriend: async (friendId: string) => {
        const response = await api.post('/friends/remove', { friendId });
        return response.data;
    },

    unblockUser: async (friendId: string) => {
        const response = await api.post('/friends/unblock', { friendId });
        return response.data;
    },
};

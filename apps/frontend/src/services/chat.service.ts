import { api } from './api';

export interface Conversation {
    id: string;
    participants: {
        userId: string;
        user: {
            username: string;
            email: string;
        }
    }[];
    messages: any[];
    updatedAt: string;
}

export const chatService = {
    createConversation: async (userIds: string[]): Promise<Conversation> => {
        const response = await api.post('/chat/conversations', { userIds });
        return response.data;
    },

    getConversations: async (): Promise<Conversation[]> => {
        const response = await api.get('/chat/conversations');
        return response.data;
    },

    getMessages: async (conversationId: string): Promise<any[]> => {
        const response = await api.get(`/chat/conversations/${conversationId}/messages`);
        return response.data;
    },

    sendMessage: async (conversationId: string, content: string, type: 'TEXT' | 'FILE' | 'SYSTEM' = 'TEXT') => {
        const response = await api.post(`/chat/conversations/${conversationId}/messages`, { content, type });
        return response.data;
    }
};

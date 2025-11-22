import { create } from 'zustand';
import { aiAssistantService } from '../services/ai-assistant.service';

interface AIState {
    isEnabled: boolean;
    isProcessing: boolean;
    capabilities: any;
    preferences: {
        autoSummarize: boolean;
        smartReplies: boolean;
        sentimentAnalysis: boolean;
        autoTranslation: boolean;
    };

    // Actions
    enableAI: () => Promise<void>;
    disableAI: () => void;
    toggleFeature: (feature: keyof AIState['preferences']) => void;
    generateSmartReply: (message: string, context: string[]) => Promise<string[]>;
    summarizeConversation: (messages: any[], participantName?: string) => Promise<string>;
}

export const useAIStore = create<AIState>((set, get) => ({
    isEnabled: false,
    isProcessing: false,
    capabilities: {},
    preferences: {
        autoSummarize: true,
        smartReplies: true,
        sentimentAnalysis: true,
        autoTranslation: false
    },

    enableAI: async () => {
        set({ isProcessing: true });

        try {
            await aiAssistantService.initialize();
            const capabilities = aiAssistantService.getCapabilities();

            set({
                isEnabled: true,
                isProcessing: false,
                capabilities
            });
        } catch (error) {
            console.error('Failed to enable AI:', error);
            set({ isProcessing: false });
        }
    },

    disableAI: () => {
        set({ isEnabled: false });
    },

    toggleFeature: (feature) => {
        set((state) => ({
            preferences: {
                ...state.preferences,
                [feature]: !state.preferences[feature]
            }
        }));
    },

    generateSmartReply: async (message, context) => {
        const { preferences } = get();

        if (!preferences.smartReplies) {
            return [];
        }

        set({ isProcessing: true });
        try {
            const replies = await aiAssistantService.generateSmartReplies(message, context);
            set({ isProcessing: false });
            return replies;
        } catch (error) {
            set({ isProcessing: false });
            return [];
        }
    },

    summarizeConversation: async (messages, participantName = 'Correspondant') => {
        const { preferences } = get();

        if (!preferences.autoSummarize) {
            return '';
        }

        set({ isProcessing: true });
        try {
            const summary = await aiAssistantService.summarizeConversation(messages, 200, participantName);
            set({ isProcessing: false });
            return summary;
        } catch (error) {
            set({ isProcessing: false });
            return '';
        }
    }
}));

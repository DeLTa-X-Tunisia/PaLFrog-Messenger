import { create } from 'zustand';
import { gamificationService } from '../services/gamification.service';

interface GamificationState {
    stats: any;
    achievements: any[];
    isInitialized: boolean;

    // Actions
    initialize: () => void;
    trackActivity: (type: string, data?: any) => void;
    getLeaderboardData: () => any;
    getNextLevelProgress: () => any;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
    stats: null,
    achievements: [],
    isInitialized: false,

    initialize: () => {
        const stats = gamificationService.getStats();
        const achievements = gamificationService.getAchievements();

        set({
            stats,
            achievements,
            isInitialized: true
        });
    },

    trackActivity: (type, data) => {
        switch (type) {
            case 'message_sent':
                gamificationService.trackMessageSent();
                break;
            case 'file_shared':
                gamificationService.trackFileShared();
                break;
            case 'video_call':
                gamificationService.trackVideoCall();
                break;
            case 'security_enabled':
                gamificationService.trackSecurityFeatureEnabled();
                break;
            case 'bridge_connected':
                gamificationService.trackBridgeConnected();
                break;
            case 'ai_suggestion_used':
                gamificationService.trackAISuggestionUsed();
                break;
        }

        // Mettre à jour l'état
        const stats = gamificationService.getStats();
        const achievements = gamificationService.getAchievements();
        set({ stats, achievements });
    },

    getLeaderboardData: () => {
        return gamificationService.getLeaderboardStats();
    },

    getNextLevelProgress: () => {
        return gamificationService.getRankProgress();
    }
}));

import { create } from 'zustand';
import { securityScoreService } from '../services/security-score.service';

interface SecurityState {
    score: number;
    level: string;
    breakdown: Record<string, number>;
    isCalculating: boolean;
    improvementTips: string[];
    lastUpdate: Date | null;

    // Actions
    calculateScore: () => Promise<void>;
    dismissTip: (tip: string) => void;
    markTipCompleted: (tip: string) => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
    score: 0,
    level: 'calculating',
    breakdown: {},
    isCalculating: false,
    improvementTips: [],
    lastUpdate: null,

    calculateScore: async () => {
        set({ isCalculating: true });

        try {
            const securityScore = await securityScoreService.calculateSecurityScore();
            const improvementTips = securityScoreService.getImprovementTips();

            set({
                score: securityScore.overall,
                level: securityScore.level,
                breakdown: securityScore.breakdown,
                improvementTips,
                lastUpdate: new Date(),
                isCalculating: false
            });
        } catch (error) {
            console.error('Failed to calculate security score:', error);
            set({ isCalculating: false });
        }
    },

    dismissTip: (tip: string) => {
        set((state) => ({
            improvementTips: state.improvementTips.filter(t => t !== tip)
        }));

        // Sauvegarder la décision de l'utilisateur
        const dismissedTips = JSON.parse(localStorage.getItem('palfrog-dismissed-tips') || '[]');
        dismissedTips.push(tip);
        localStorage.setItem('palfrog-dismissed-tips', JSON.stringify(dismissedTips));
    },

    markTipCompleted: (tip: string) => {
        set((state) => ({
            improvementTips: state.improvementTips.filter(t => t !== tip)
        }));

        // Marquer comme complété
        const completedTips = JSON.parse(localStorage.getItem('palfrog-completed-tips') || '[]');
        completedTips.push(tip);
        localStorage.setItem('palfrog-completed-tips', JSON.stringify(completedTips));
    }
}));

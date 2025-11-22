import { create } from 'zustand';
import { analyticsService } from '../services/analytics.service';

interface AnalyticsState {
    privacyLevel: 'minimal' | 'balanced' | 'detailed';
    isGeneratingReport: boolean;
    lastReport: any | null;

    // Actions
    setPrivacyLevel: (level: 'minimal' | 'balanced' | 'detailed') => void;
    generateComprehensiveReport: () => Promise<any>;
    getRelationshipMap: () => Promise<any>;
    getProductivityReport: () => Promise<any>;
    getMoodReport: () => Promise<any>;
    getCommunicationGoals: () => Promise<any>;
    clearAllData: () => void;
    exportData: (format: 'json' | 'csv') => Promise<Blob>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
    privacyLevel: 'balanced',
    isGeneratingReport: false,
    lastReport: null,

    setPrivacyLevel: (level) => {
        analyticsService.setPrivacyLevel(level);
        set({ privacyLevel: level });
    },

    generateComprehensiveReport: async () => {
        set({ isGeneratingReport: true });

        try {
            const report = await analyticsService.generateComprehensiveReport();
            set({ lastReport: report, isGeneratingReport: false });
            return report;
        } catch (error) {
            set({ isGeneratingReport: false });
            throw error;
        }
    },

    getRelationshipMap: async () => {
        return await analyticsService.generateRelationshipMap();
    },

    getProductivityReport: async () => {
        return await analyticsService.generateProductivityReport();
    },

    getMoodReport: async () => {
        return await analyticsService.generateMoodReport();
    },

    getCommunicationGoals: async () => {
        return await analyticsService.generateCommunicationGoals();
    },

    clearAllData: () => {
        analyticsService.clearAllData();
        set({ lastReport: null });
    },

    exportData: async (format: 'json' | 'csv') => {
        const report = await get().generateComprehensiveReport();

        if (format === 'json') {
            return new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json'
            });
        } else {
            // Conversion CSV basique
            const csv = convertToCSV(report);
            return new Blob([csv], { type: 'text/csv' });
        }
    }
}));

// Utilitaire de conversion CSV
function convertToCSV(data: any): string {
    // Implémentation basique de conversion CSV
    const headers = ['Category', 'Metric', 'Value'];
    const rows: string[] = [headers.join(',')];

    // Extraire quelques métriques principales
    if (data.conversationStats) {
        Object.entries(data.conversationStats).forEach(([key, value]) => {
            rows.push(`Conversation,${key},${value}`);
        });
    }

    if (data.productivityStats) {
        Object.entries(data.productivityStats).forEach(([key, value]) => {
            if (typeof value === 'number') {
                rows.push(`Productivity,${key},${value}`);
            }
        });
    }

    return rows.join('\n');
}

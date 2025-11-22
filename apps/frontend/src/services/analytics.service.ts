import { useWebRTCStore } from '../stores/webrtc.store';
import { useAuthStore } from '../stores/auth.store';
import { useGamificationStore } from '../stores/gamification.store';
import { useBridgeStore } from '../stores/bridge.store';
import { databaseService } from './database.service';

interface ConversationStats {
    totalMessages: number;
    messagesSent: number;
    messagesReceived: number;
    averageResponseTime: number; // en minutes
    mostActiveHours: { hour: number; count: number }[];
    conversationLength: number; // durée moyenne en minutes
}

interface RelationshipMap {
    contacts: {
        id: string;
        name: string;
        messageCount: number;
        lastInteraction: Date;
        strength: number; // 0-100
        sentiment: 'positive' | 'negative' | 'neutral';
        commonTopics: string[];
    }[];
    groups: {
        id: string;
        name: string;
        participantCount: number;
        activityLevel: number;
    }[];
}

interface ProductivityStats {
    timeSpent: number; // en minutes
    focusSessions: number;
    interruptions: number;
    peakProductivityHours: number[];
    weeklyTrend: { date: string; productivity: number }[];
}

interface MoodTracking {
    dailyMood: { date: string; mood: number; factors: string[] }[];
    sentimentTrend: { date: string; positive: number; negative: number; neutral: number }[];
    stressIndicators: string[];
    wellbeingScore: number;
}

interface CommunicationGoals {
    goals: {
        id: string;
        title: string;
        target: number;
        current: number;
        unit: string;
        deadline?: Date;
        category: 'social' | 'productivity' | 'learning' | 'wellbeing';
    }[];
    progress: number; // pourcentage global
}

class AnalyticsService {
    private conversationStats: ConversationStats = {
        totalMessages: 0,
        messagesSent: 0,
        messagesReceived: 0,
        averageResponseTime: 0,
        mostActiveHours: [],
        conversationLength: 0
    };

    private dataCollectionEnabled = true;
    private privacyLevel: 'minimal' | 'balanced' | 'detailed' = 'balanced';

    constructor() {
        this.initializeDataCollection();
        this.startPeriodicAnalysis();
    }

    // 🎯 COLLECTE ET ANALYSE DES DONNÉES
    private initializeDataCollection() {
        if (!this.dataCollectionEnabled) return;

        // Surveiller les nouveaux messages
        this.setupMessageMonitoring();

        // Surveiller l'activité de l'application
        this.setupActivityTracking();

        // Charger les données historiques
        this.loadHistoricalData();
    }

    private setupMessageMonitoring() {
        // Intercepter l'ajout de messages
        const originalAddMessage = useWebRTCStore.getState().addMessage;

        useWebRTCStore.setState({
            addMessage: (message) => {
                // Appeler la fonction originale
                originalAddMessage(message);

                // Analyser le message
                this.analyzeNewMessage(message);
            }
        });
    }

    private setupActivityTracking() {
        // Track du temps passé dans l'application
        let sessionStart = new Date();
        let activeTime = 0;

        const updateActiveTime = () => {
            const now = new Date();
            activeTime += (now.getTime() - sessionStart.getTime()) / 1000 / 60; // en minutes
            sessionStart = now;
        };

        // Track de l'activité window
        window.addEventListener('focus', () => {
            sessionStart = new Date();
        });

        window.addEventListener('blur', () => {
            updateActiveTime();
        });

        // Sauvegarder périodiquement
        setInterval(() => {
            updateActiveTime();
            this.saveActivityData(activeTime);
        }, 30000); // Toutes les 30 secondes
    }

    // 🎯 ANALYSE DES CONVERSATIONS
    private analyzeNewMessage(message: any) {
        this.updateConversationStats(message);
        this.updateRelationshipMap(message);
        this.updateMoodTracking(message);
        this.updateProductivityStats();
    }

    private updateConversationStats(message: any) {
        const stats = this.conversationStats;

        stats.totalMessages++;

        if (message.sender === 'me') {
            stats.messagesSent++;
        } else {
            stats.messagesReceived++;
        }

        // Analyser l'heure d'activité
        const hour = new Date(message.timestamp).getHours();
        const hourStat = stats.mostActiveHours.find(h => h.hour === hour);

        if (hourStat) {
            hourStat.count++;
        } else {
            stats.mostActiveHours.push({ hour, count: 1 });
        }

        // Trier par activité
        stats.mostActiveHours.sort((a, b) => b.count - a.count);

        this.saveConversationStats();
    }

    private async getAllMessagesFromDB(): Promise<any[]> {
        const chats = await databaseService.getAllChats();
        let allMessages: any[] = [];
        for (const chat of chats) {
            const messages = await databaseService.getChatMessages(chat.id, 1000);
            allMessages = [...allMessages, ...messages];
        }
        return allMessages;
    }

    // 🎯 CARTE DES RELATIONS
    async generateRelationshipMap(): Promise<RelationshipMap> {
        const contacts = new Map();
        const chats = await databaseService.getAllChats();

        // Analyser tous les messages pour construire la carte des relations
        for (const chat of chats) {
            const messages = await databaseService.getChatMessages(chat.id, 1000);

            messages.forEach(message => {
                const contactId = chat.id;

                if (!contacts.has(contactId)) {
                    contacts.set(contactId, {
                        id: contactId,
                        name: chat.participantName || contactId,
                        messageCount: 0,
                        lastInteraction: new Date(message.timestamp),
                        interactions: []
                    });
                }

                const contact = contacts.get(contactId);
                contact.messageCount++;
                if (new Date(message.timestamp) > contact.lastInteraction) {
                    contact.lastInteraction = new Date(message.timestamp);
                }
                contact.interactions.push({
                    timestamp: new Date(message.timestamp),
                    type: message.sender === 'me' ? 'sent' : 'received',
                    content: message.content
                });
            });
        }

        // Calculer la force des relations
        const contactArray = Array.from(contacts.values()).map(contact => {
            const strength = this.calculateRelationshipStrength(contact);
            const sentiment = this.analyzeConversationSentiment(contact.interactions);
            const commonTopics = this.extractCommonTopics(contact.interactions);

            return {
                ...contact,
                strength,
                sentiment,
                commonTopics: commonTopics.slice(0, 5)
            };
        });

        return {
            contacts: contactArray.sort((a, b) => b.strength - a.strength),
            groups: await this.analyzeGroupActivity()
        };
    }

    private calculateRelationshipStrength(contact: any): number {
        const { messageCount, lastInteraction, interactions } = contact;
        const now = new Date();
        const daysSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

        // Facteurs: volume, récence, fréquence
        const volumeScore = Math.min(messageCount / 100, 1) * 40;
        const recencyScore = Math.max(0, 1 - (daysSinceLastInteraction / 30)) * 30;
        const frequencyScore = this.calculateFrequencyScore(interactions) * 30;

        return Math.min(volumeScore + recencyScore + frequencyScore, 100);
    }

    private calculateFrequencyScore(interactions: any[]): number {
        if (interactions.length < 2) return 0;

        const timestamps = interactions.map(i => new Date(i.timestamp).getTime());
        const intervals = [];

        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const daysBetween = avgInterval / (1000 * 60 * 60 * 24);

        // Plus l'intervalle est court, plus le score est élevé
        return Math.max(0, 1 - (daysBetween / 7));
    }

    private analyzeConversationSentiment(interactions: any[]): 'positive' | 'negative' | 'neutral' {
        // Analyse basique du sentiment (en réalité, utiliserait l'IA)
        const positiveWords = ['super', 'génial', 'merci', 'content', 'bon', 'excellent', 'parfait'];
        const negativeWords = ['mauvais', 'probleme', 'erreur', 'fâché', 'triste', 'déçu'];

        let positiveCount = 0;
        let negativeCount = 0;

        interactions.forEach(interaction => {
            const text = interaction.content.toLowerCase();
            positiveWords.forEach(word => {
                if (text.includes(word)) positiveCount++;
            });
            negativeWords.forEach(word => {
                if (text.includes(word)) negativeCount++;
            });
        });

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    private extractCommonTopics(interactions: any[]): string[] {
        const allText = interactions.map(i => i.content).join(' ').toLowerCase();
        const words = allText.split(/\s+/).filter(word => word.length > 3);

        const wordFreq: { [key: string]: number } = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    // 🎯 ANALYSE DE PRODUCTIVITÉ
    async generateProductivityReport(): Promise<ProductivityStats> {
        const activityData = await this.loadActivityData();
        const messages = await this.getAllMessagesFromDB();

        const timeSpent = activityData.totalTime || 0;
        const focusSessions = this.calculateFocusSessions(activityData.sessions || []);
        const interruptions = this.calculateInterruptions(messages);
        const peakHours = this.findPeakProductivityHours(messages);
        const weeklyTrend = this.calculateWeeklyTrend(activityData);

        return {
            timeSpent,
            focusSessions,
            interruptions,
            peakProductivityHours: peakHours,
            weeklyTrend
        };
    }

    private calculateFocusSessions(sessions: any[]): number {
        // Une session de focus = période d'activité > 15 minutes sans interruption
        return sessions.filter(session =>
            session.duration > 15 && session.interruptions < 3
        ).length;
    }

    private calculateInterruptions(messages: any[]): number {
        // Une interruption = message reçu pendant une période d'inactivité
        let interruptions = 0;
        let lastActivity = new Date();

        messages.forEach(message => {
            const messageTime = new Date(message.timestamp);
            const timeDiff = (messageTime.getTime() - lastActivity.getTime()) / (1000 * 60); // minutes

            if (message.sender !== 'me' && timeDiff > 5) {
                interruptions++;
            }

            lastActivity = messageTime;
        });

        return interruptions;
    }

    private findPeakProductivityHours(messages: any[]): number[] {
        const hourCounts: number[] = Array(24).fill(0);

        messages.forEach(message => {
            if (message.sender === 'me') {
                const hour = new Date(message.timestamp).getHours();
                hourCounts[hour]++;
            }
        });

        // Retourner les 3 heures les plus productives
        return hourCounts
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(item => item.hour);
    }

    // 🎯 SUIVI D'HUMEUR
    async generateMoodReport(): Promise<MoodTracking> {
        const messages = await this.getAllMessagesFromDB();
        const dailyMood = this.analyzeDailyMood(messages);
        const sentimentTrend = this.analyzeSentimentTrend(messages);
        const stressIndicators = this.detectStressIndicators(messages);
        const wellbeingScore = this.calculateWellbeingScore(dailyMood, stressIndicators);

        return {
            dailyMood,
            sentimentTrend,
            stressIndicators,
            wellbeingScore
        };
    }

    private analyzeDailyMood(messages: any[]): { date: string; mood: number; factors: string[] }[] {
        const moodByDate = new Map<string, { date: string; sentiments: number[]; factors: string[] }>();

        messages.forEach(message => {
            const date = new Date(message.timestamp).toDateString();
            const sentiment = this.analyzeMessageSentiment(message.content);

            if (!moodByDate.has(date)) {
                moodByDate.set(date, {
                    date,
                    sentiments: [],
                    factors: []
                });
            }

            const dayData = moodByDate.get(date)!;
            dayData.sentiments.push(sentiment.score);

            if (sentiment.factors.length > 0) {
                dayData.factors.push(...sentiment.factors);
            }
        });

        return Array.from(moodByDate.values()).map(dayData => ({
            date: dayData.date,
            mood: dayData.sentiments.length > 0
                ? dayData.sentiments.reduce((a: number, b: number) => a + b, 0) / dayData.sentiments.length
                : 50,
            factors: [...new Set(dayData.factors)].slice(0, 3)
        }));
    }

    private analyzeMessageSentiment(content: string): { score: number; factors: string[] } {
        // Score de sentiment basique (0-100, 50 = neutre)
        const positiveWords = ['super', 'génial', 'merci', 'content', 'bon', 'excellent', 'parfait', '👍', '😊', '🎉'];
        const negativeWords = ['mauvais', 'probleme', 'erreur', 'fâché', 'triste', 'déçu', '👎', '😞', '😠'];

        let score = 50; // neutre
        const factors: string[] = [];

        const text = content.toLowerCase();

        positiveWords.forEach(word => {
            if (text.includes(word)) {
                score += 5;
                factors.push(word);
            }
        });

        negativeWords.forEach(word => {
            if (text.includes(word)) {
                score -= 5;
                factors.push(word);
            }
        });

        return {
            score: Math.max(0, Math.min(100, score)),
            factors
        };
    }

    // 🎯 OBJECTIFS DE COMMUNICATION
    async generateCommunicationGoals(): Promise<CommunicationGoals> {
        const defaultGoals: CommunicationGoals['goals'] = [
            {
                id: 'social-connections',
                title: 'Élargir le réseau social',
                target: 10,
                current: 0,
                unit: 'nouveaux contacts',
                category: 'social'
            },
            {
                id: 'response-time',
                title: 'Améliorer le temps de réponse',
                target: 30,
                current: 0,
                unit: 'minutes en moyenne',
                category: 'productivity'
            },
            {
                id: 'meaningful-conversations',
                title: 'Conversations significatives',
                target: 5,
                current: 0,
                unit: 'par semaine',
                category: 'wellbeing'
            },
            {
                id: 'learning-share',
                title: 'Partage de connaissances',
                target: 3,
                current: 0,
                unit: 'ressources partagées',
                category: 'learning'
            }
        ];

        // Calculer la progression actuelle
        const relationshipMap = await this.generateRelationshipMap();
        const productivityStats = await this.generateProductivityReport();

        defaultGoals[0].current = relationshipMap.contacts.length;
        defaultGoals[1].current = Math.round(productivityStats.timeSpent / 60); // exemple
        defaultGoals[2].current = this.calculateMeaningfulConversations();
        defaultGoals[3].current = this.calculateSharedResources();

        const progress = defaultGoals.reduce((sum, goal) =>
            sum + (goal.current / goal.target) * 25, 0
        );

        return {
            goals: defaultGoals,
            progress: Math.min(100, progress)
        };
    }

    // 🎯 RAPPORTS ET EXPORT
    async generateComprehensiveReport() {
        const [
            relationshipMap,
            productivityStats,
            moodTracking,
            communicationGoals,
            conversationStats
        ] = await Promise.all([
            this.generateRelationshipMap(),
            this.generateProductivityReport(),
            this.generateMoodReport(),
            this.generateCommunicationGoals(),
            this.getConversationStats()
        ]);

        return {
            summary: {
                generatedAt: new Date(),
                period: 'all-time',
                overallScore: this.calculateOverallScore(
                    relationshipMap,
                    productivityStats,
                    moodTracking
                )
            },
            relationshipMap,
            productivityStats,
            moodTracking,
            communicationGoals,
            conversationStats,
            insights: this.generateInsights(
                relationshipMap,
                productivityStats,
                moodTracking
            )
        };
    }

    private calculateOverallScore(
        relationships: RelationshipMap,
        productivity: ProductivityStats,
        mood: MoodTracking
    ): number {
        const relationshipScore = relationships.contacts.length > 0
            ? relationships.contacts.reduce((sum, contact) => sum + contact.strength, 0) / relationships.contacts.length
            : 0;

        const productivityScore = Math.min(productivity.timeSpent / 60, 100); // normalisé
        const wellbeingScore = mood.wellbeingScore;

        return Math.round((relationshipScore + productivityScore + wellbeingScore) / 3);
    }

    private generateInsights(
        relationships: RelationshipMap,
        productivity: ProductivityStats,
        mood: MoodTracking
    ): string[] {
        const insights: string[] = [];

        // Insights relations
        if (relationships.contacts.length < 5) {
            insights.push("💡 Vous pourriez élargir votre réseau en contactant de nouvelles personnes");
        }

        const strongRelationships = relationships.contacts.filter(c => c.strength > 70);
        if (strongRelationships.length > 0) {
            insights.push(`🌟 Vous avez ${strongRelationships.length} relations très fortes - continuez à les entretenir !`);
        }

        // Insights productivité
        if (productivity.peakProductivityHours.length > 0) {
            insights.push(`⏰ Vous êtes plus productif autour de ${productivity.peakProductivityHours[0]}h - planifiez vos tâches importantes à ce moment`);
        }

        if (productivity.interruptions > 10) {
            insights.push("🔕 Beaucoup d'interruptions détectées - envisagez des plages de travail sans distraction");
        }

        // Insights humeur
        if (mood.wellbeingScore < 40) {
            insights.push("😌 Votre bien-être communicationnel semble bas - prenez du temps pour des conversations positives");
        }

        return insights.slice(0, 5);
    }

    // 🎯 PERSISTANCE DES DONNÉES
    private saveConversationStats() {
        localStorage.setItem('palfrog-conversation-stats', JSON.stringify(this.conversationStats));
    }

    private async loadHistoricalData() {
        try {
            const saved = localStorage.getItem('palfrog-conversation-stats');
            if (saved) {
                this.conversationStats = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load historical data:', error);
        }
    }

    private saveActivityData(activeTime: number) {
        const today = new Date().toDateString();
        const activityData = JSON.parse(localStorage.getItem('palfrog-activity-data') || '{}');

        if (!activityData[today]) {
            activityData[today] = { totalTime: 0, sessions: [] };
        }

        activityData[today].totalTime += activeTime;
        localStorage.setItem('palfrog-activity-data', JSON.stringify(activityData));
    }

    private async loadActivityData() {
        try {
            const saved = localStorage.getItem('palfrog-activity-data');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            return {};
        }
    }

    // 🎯 CONTRÔLES DE CONFIDENTIALITÉ
    setPrivacyLevel(level: 'minimal' | 'balanced' | 'detailed') {
        this.privacyLevel = level;
        this.dataCollectionEnabled = level !== 'minimal';
        localStorage.setItem('palfrog-analytics-privacy', level);
    }

    getPrivacyLevel() {
        return this.privacyLevel;
    }

    clearAllData() {
        localStorage.removeItem('palfrog-conversation-stats');
        localStorage.removeItem('palfrog-activity-data');
        localStorage.removeItem('palfrog-analytics-privacy');
        this.conversationStats = {
            totalMessages: 0,
            messagesSent: 0,
            messagesReceived: 0,
            averageResponseTime: 0,
            mostActiveHours: [],
            conversationLength: 0
        };
    }

    // 🎯 MÉTHODES PUBLIQUES
    getConversationStats(): ConversationStats {
        return { ...this.conversationStats };
    }

    private startPeriodicAnalysis() {
        // Analyser les données toutes les heures
        setInterval(() => {
            this.generateComprehensiveReport().catch(console.error);
        }, 60 * 60 * 1000);
    }

    // Méthodes utilitaires
    private calculateMeaningfulConversations(): number {
        // Logique pour calculer les conversations significatives
        return Math.floor(Math.random() * 5); // Placeholder
    }

    private calculateSharedResources(): number {
        // Logique pour calculer les ressources partagées
        return Math.floor(Math.random() * 3); // Placeholder
    }

    private calculateWeeklyTrend(activityData: any): { date: string; productivity: number }[] {
        // Générer des données de tendance hebdomadaire
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toDateString(),
                productivity: Math.floor(Math.random() * 100)
            };
        }).reverse();
    }

    private async analyzeGroupActivity() {
        // Analyser l'activité des groupes (à implémenter)
        return [];
    }

    private analyzeSentimentTrend(messages: any[]) {
        // Analyser les tendances de sentiment (à implémenter)
        return [];
    }

    private detectStressIndicators(messages: any[]) {
        // Détecter les indicateurs de stress (à implémenter)
        return [];
    }

    private calculateWellbeingScore(dailyMood: any[], stressIndicators: string[]) {
        // Calculer le score de bien-être (à implémenter)
        return 75;
    }

    // Placeholder methods to fix errors
    private updateRelationshipMap(message: any) {
        // Placeholder
    }
    private updateMoodTracking(message: any) {
        // Placeholder
    }
    private updateProductivityStats() {
        // Placeholder
    }
}

export const analyticsService = new AnalyticsService();

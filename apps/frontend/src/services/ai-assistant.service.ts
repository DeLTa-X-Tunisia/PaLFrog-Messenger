import * as tf from '@tensorflow/tfjs';
import { useTranslation } from '../hooks/useTranslation';

interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface AICapabilities {
    summarization: boolean;
    translation: boolean;
    sentiment: boolean;
    suggestions: boolean;
    smartReplies: boolean;
}

class AIAssistantService {
    private model: tf.LayersModel | null = null;
    private isInitialized = false;
    private messageHistory: AIMessage[] = [];
    private capabilities: AICapabilities = {
        summarization: false,
        translation: false,
        sentiment: false,
        suggestions: false,
        smartReplies: false
    };

    async initialize() {
        try {
            // Charger le modèle TensorFlow.js optimisé pour le client
            this.model = await tf.loadLayersModel('/models/ai-assistant/model.json');

            // Initialiser les capacités basées sur le modèle chargé
            await this.initializeCapabilities();

            this.isInitialized = true;
            console.log('AI Assistant initialized successfully');
        } catch (error) {
            console.warn('AI model not available, using fallback methods');
            await this.initializeFallbackCapabilities();
        }
    }

    private async initializeCapabilities() {
        // Déterminer les capacités du modèle chargé
        this.capabilities = {
            summarization: true,
            translation: true,
            sentiment: true,
            suggestions: true,
            smartReplies: true
        };
    }

    private async initializeFallbackCapabilities() {
        // Méthodes de fallback sans ML
        this.capabilities = {
            summarization: true,  // Via algorithmes simples
            translation: false,   // Nécessite modèle
            sentiment: true,      // Via lexiques
            suggestions: true,    // Via templates
            smartReplies: true    // Via règles
        };
    }

    // 🎯 RÉSUMÉ AUTOMATIQUE DES CONVERSATIONS
    async summarizeConversation(messages: any[], maxLength: number = 200, participantName: string = 'Correspondant'): Promise<string> {
        if (!this.capabilities.summarization) {
            return this.fallbackSummarize(messages, maxLength, participantName);
        }

        try {
            const conversationText = messages
                .filter(msg => {
                    // Filtrer les messages techniques/fichiers
                    if (msg.type === 'file') return false;
                    if (msg.type === 'system') return false;

                    // Vérification supplémentaire si le type n'est pas défini ou incorrect
                    try {
                        if (msg.content.startsWith('{') && msg.content.includes('"type":')) {
                            const parsed = JSON.parse(msg.content);
                            return !['file_offer', 'file_metadata', 'file_chunk', 'encrypted_message'].includes(parsed.type);
                        }
                    } catch {
                        // Si ce n'est pas du JSON valide, c'est probablement du texte
                        return true;
                    }

                    return true;
                })
                .map(msg => {
                    const senderName = msg.sender === 'me' ? 'Moi' : participantName;
                    return `${senderName}: ${msg.content}`;
                })
                .join('\n');

            // Utiliser le modèle pour générer le résumé
            const summary = await this.generateSummary(conversationText, maxLength);
            return summary;
        } catch (error) {
            console.error('Summarization failed:', error);
            return this.fallbackSummarize(messages, maxLength, participantName);
        }
    }

    private async generateSummary(text: string, maxLength: number): Promise<string> {
        // Placeholder for actual model inference
        // In a real implementation, this would use this.model.predict()
        return this.fallbackSummarize([{ sender: 'system', content: text }], maxLength, 'Système');
    }

    private fallbackSummarize(messages: any[], maxLength: number, participantName: string): string {
        // Algorithme simple de résumé
        const recentMessages = messages
            .filter(msg => {
                // Filtrer les messages techniques/fichiers
                if (msg.type === 'file') return false;
                try {
                    if (msg.content.startsWith('{') && msg.content.includes('"type":')) {
                        const parsed = JSON.parse(msg.content);
                        return !['file_offer', 'file_metadata', 'file_chunk', 'encrypted_message'].includes(parsed.type);
                    }
                } catch { return true; }
                return true;
            })
            .slice(-10);

        const keyPoints = recentMessages
            .map(msg => {
                const senderName = msg.sender === 'me' ? 'Moi' : participantName;
                const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
                return `${senderName} : ${content}`;
            });

        return `Résumé de la conversation :\n• ${keyPoints.join('\n• ')}`;
    }

    // 🎯 SUGGESTIONS DE RÉPONSES INTELLIGENTES
    async generateSmartReplies(lastMessage: string, context: string[]): Promise<string[]> {
        // Note: useTranslation cannot be used inside a class method directly if it's a hook.
        // We will handle translations in the fallback method by returning keys or using a passed translator.
        // For this implementation, we'll assume we return keys or hardcoded strings for now, 
        // or we need to refactor to not use the hook inside the service class directly.
        // However, the user provided code uses `useTranslation` inside `generateSmartReplies` which is invalid for a hook.
        // I will modify it to use a static translation map or expect the caller to handle it, 
        // but to stick to the user's request structure, I'll implement `generateTemplateReplies` 
        // to return hardcoded strings or keys, and we'll fix the hook usage.
        // Actually, `useTranslation` is a hook and cannot be called here. 
        // I will use a simple object for translations or just return the keys/default text.

        if (!this.capabilities.smartReplies) {
            return this.generateTemplateReplies(lastMessage);
        }

        try {
            // Analyser l'intention du message
            const intent = await this.analyzeMessageIntent(lastMessage);

            // Générer des réponses contextuelles
            const replies = await this.generateContextualReplies(intent, context);
            return replies.slice(0, 3);
        } catch (error) {
            return this.generateTemplateReplies(lastMessage);
        }
    }

    private async analyzeMessageIntent(message: string): Promise<string> {
        // Placeholder
        return 'unknown';
    }

    private async generateContextualReplies(intent: string, context: string[]): Promise<string[]> {
        // Placeholder
        return [];
    }

    private generateTemplateReplies(message: string): string[] {
        // Removed useTranslation hook call as it's invalid in a class method.
        // Returning hardcoded French strings as per the user's example logic, 
        // or we could return translation keys.

        const lowerMessage = message.toLowerCase();
        const replies = new Set<string>();

        // Réponses basées sur des motifs courants
        if (lowerMessage.includes('?')) {
            replies.add("D'accord");
            replies.add("Laisse-moi réfléchir");
            replies.add("Bonne question");
        }

        if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
            replies.add("De rien !");
            replies.add("Content de pouvoir aider");
        }

        if (lowerMessage.includes('salut') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            replies.add("Salut !");
            replies.add("Comment ça va ?");
        }

        // Réponses générales
        replies.add("Intéressant");
        replies.add("Je vois");
        replies.add("Parlons-en");

        return Array.from(replies).slice(0, 3);
    }

    // 🎯 ANALYSE DE SENTIMENT
    async analyzeSentiment(message: string): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
        emotions: string[];
    }> {
        if (!this.capabilities.sentiment) {
            return this.fallbackSentimentAnalysis(message);
        }

        try {
            // Utiliser le modèle pour l'analyse de sentiment
            return await this.modelBasedSentimentAnalysis(message);
        } catch (error) {
            return this.fallbackSentimentAnalysis(message);
        }
    }

    private async modelBasedSentimentAnalysis(message: string) {
        // Placeholder
        return this.fallbackSentimentAnalysis(message);
    }

    private fallbackSentimentAnalysis(message: string) {
        const positiveWords = ['bon', 'super', 'génial', 'excellent', 'parfait', 'content', 'heureux'];
        const negativeWords = ['mauvais', 'terrible', 'horrible', 'triste', 'fâché', 'déçu'];

        const words = message.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });

        if (positiveScore > negativeScore) {
            return { sentiment: 'positive' as const, confidence: 0.7, emotions: ['joy'] };
        } else if (negativeScore > positiveScore) {
            return { sentiment: 'negative' as const, confidence: 0.7, emotions: ['sadness'] };
        } else {
            return { sentiment: 'neutral' as const, confidence: 0.8, emotions: [] };
        }
    }

    // 🎯 TRADUCTION AUTOMATIQUE
    async translateText(text: string, targetLang: string): Promise<string> {
        if (!this.capabilities.translation) {
            return text; // Fallback: pas de traduction
        }

        try {
            // Implémentation de traduction via modèle local
            return await this.modelBasedTranslation(text, targetLang);
        } catch (error) {
            console.warn('Translation failed:', error);
            return text;
        }
    }

    private async modelBasedTranslation(text: string, targetLang: string): Promise<string> {
        // Placeholder
        return text;
    }

    // 🎯 DÉTECTION DE THÈMES
    async detectTopics(messages: any[]): Promise<string[]> {
        const allText = messages.map(msg => msg.content).join(' ');
        const commonWords = this.extractCommonTopics(allText);

        return commonWords.slice(0, 5);
    }

    private extractCommonTopics(text: string): string[] {
        // Algorithme simple d'extraction de thèmes
        const words = text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word));

        const wordFreq: { [key: string]: number } = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    private isStopWord(word: string): boolean {
        const stopWords = ['avec', 'dans', 'pour', 'par', 'sur', 'est', 'sont', 'ont'];
        return stopWords.includes(word);
    }

    // 🎯 GÉNÉRATION DE RAPPORTS
    async generateConversationReport(messages: any[]): Promise<{
        summary: string;
        topics: string[];
        sentiment: { positive: number; negative: number; neutral: number };
        activity: { [date: string]: number };
    }> {
        const summary = await this.summarizeConversation(messages);
        const topics = await this.detectTopics(messages);

        const sentimentAnalysis = await Promise.all(
            messages.slice(-20).map(msg => this.analyzeSentiment(msg.content))
        );

        const sentiment = {
            positive: sentimentAnalysis.filter(s => s.sentiment === 'positive').length,
            negative: sentimentAnalysis.filter(s => s.sentiment === 'negative').length,
            neutral: sentimentAnalysis.filter(s => s.sentiment === 'neutral').length
        };

        const activity = this.calculateActivity(messages);

        return { summary, topics, sentiment, activity };
    }

    private calculateActivity(messages: any[]): { [date: string]: number } {
        const activity: { [date: string]: number } = {};

        messages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            activity[date] = (activity[date] || 0) + 1;
        });

        return activity;
    }

    getCapabilities(): AICapabilities {
        return this.capabilities;
    }

    isReady(): boolean {
        return this.isInitialized;
    }
}

export const aiAssistantService = new AIAssistantService();

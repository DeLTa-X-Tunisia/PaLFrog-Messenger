import { useTranslation } from '../hooks/useTranslation';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: 'social' | 'security' | 'communication' | 'mastery';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlocked: boolean;
    unlockedAt?: Date;
    progress: number;
    maxProgress: number;
}

interface UserStats {
    level: number;
    experience: number;
    points: number;
    streak: number;
    lastActivity: Date;
    achievements: Achievement[];
    rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

class GamificationService {
    private stats: UserStats = {
        level: 1,
        experience: 0,
        points: 0,
        streak: 0,
        lastActivity: new Date(),
        achievements: [],
        rank: 'bronze'
    };

    private achievements: Achievement[] = [
        {
            id: 'first_message',
            name: 'Premier Pas',
            description: 'Envoyez votre premier message',
            icon: '💬',
            points: 50,
            category: 'communication',
            rarity: 'common',
            unlocked: false,
            progress: 0,
            maxProgress: 1
        },
        {
            id: 'security_master',
            name: 'Maître de la Sécurité',
            description: 'Activez toutes les fonctionnalités de sécurité',
            icon: '🛡️',
            points: 200,
            category: 'security',
            rarity: 'epic',
            unlocked: false,
            progress: 0,
            maxProgress: 5
        },
        {
            id: 'social_butterfly',
            name: 'Papillon Social',
            description: 'Communiquez avec 10 contacts différents',
            icon: '🦋',
            points: 150,
            category: 'social',
            rarity: 'rare',
            unlocked: false,
            progress: 0,
            maxProgress: 10
        },
        {
            id: 'file_sharer',
            name: 'Partageur Pro',
            description: 'Partagez 50 fichiers',
            icon: '📁',
            points: 100,
            category: 'communication',
            rarity: 'rare',
            unlocked: false,
            progress: 0,
            maxProgress: 50
        },
        {
            id: 'call_expert',
            name: 'Expert en Appels',
            description: 'Passez 10 appels vidéo',
            icon: '📹',
            points: 300,
            category: 'communication',
            rarity: 'epic',
            unlocked: false,
            progress: 0,
            maxProgress: 10
        },
        {
            id: 'streak_master',
            name: 'Maître de la Régularité',
            description: 'Connectez-vous 30 jours consécutifs',
            icon: '🔥',
            points: 500,
            category: 'mastery',
            rarity: 'legendary',
            unlocked: false,
            progress: 0,
            maxProgress: 30
        },
        {
            id: 'bridge_explorer',
            name: 'Explorateur de Bridges',
            description: 'Connectez 3 services externes',
            icon: '🌉',
            points: 250,
            category: 'mastery',
            rarity: 'epic',
            unlocked: false,
            progress: 0,
            maxProgress: 3
        },
        {
            id: 'ai_companion',
            name: 'Compagnon IA',
            description: 'Utilisez 50 suggestions IA',
            icon: '🤖',
            points: 180,
            category: 'mastery',
            rarity: 'rare',
            unlocked: false,
            progress: 0,
            maxProgress: 50
        }
    ];

    constructor() {
        this.loadStats();
        this.initializeAchievements();
        this.startDailyReset();
    }

    // 🎯 GESTION DES POINTS ET EXPÉRIENCE
    addExperience(amount: number, reason: string) {
        this.stats.experience += amount;
        this.stats.points += Math.floor(amount / 10);
        this.stats.lastActivity = new Date();

        // Vérifier le niveau up
        this.checkLevelUp();

        // Vérifier les succès
        this.checkAchievements();

        this.saveStats();
        console.log(`+${amount} XP - ${reason}`);
    }

    addPoints(amount: number, reason: string) {
        this.stats.points += amount;
        this.stats.lastActivity = new Date();
        this.saveStats();
        console.log(`+${amount} points - ${reason}`);
    }

    // 🎯 SUIVI DES STREAKS
    updateStreak() {
        const today = new Date();
        const lastActivity = new Date(this.stats.lastActivity);
        const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Jour consécutif
            this.stats.streak++;
            this.addExperience(this.stats.streak * 10, `Streak de ${this.stats.streak} jours`);
        } else if (diffDays > 1) {
            // Streak brisé
            this.stats.streak = 1;
            this.addExperience(10, 'Nouveau streak');
        }

        this.stats.lastActivity = today;
        this.saveStats();
    }

    // 🎯 GESTION DES NIVEAUX
    private checkLevelUp() {
        const expNeeded = this.getExpForLevel(this.stats.level + 1);

        if (this.stats.experience >= expNeeded) {
            this.stats.level++;
            this.addPoints(100, `Niveau ${this.stats.level} atteint!`);

            // Mettre à jour le rang
            this.updateRank();

            // Notification de niveau
            this.triggerLevelUpNotification();
        }
    }

    private getExpForLevel(level: number): number {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // 🎯 GESTION DES RANGS
    private updateRank() {
        const ranks = [
            { level: 1, rank: 'bronze' },
            { level: 5, rank: 'silver' },
            { level: 10, rank: 'gold' },
            { level: 20, rank: 'platinum' },
            { level: 30, rank: 'diamond' }
        ];

        const newRank = ranks
            .filter(r => this.stats.level >= r.level)
            .reduce((max, r) => r.level > max.level ? r : max, ranks[0]);

        if (newRank.rank !== this.stats.rank) {
            this.stats.rank = newRank.rank as any;
            this.addPoints(500, `Rang ${newRank.rank} atteint!`);
        }
    }

    // 🎯 GESTION DES SUCCÈS
    private initializeAchievements() {
        this.stats.achievements = this.achievements.map(achievement => ({
            ...achievement,
            unlocked: false,
            progress: 0
        }));
    }

    private checkAchievements() {
        this.stats.achievements.forEach(achievement => {
            if (!achievement.unlocked) {
                this.updateAchievementProgress(achievement.id);
            }
        });
    }

    updateAchievementProgress(achievementId: string, progress: number = 1) {
        const achievement = this.stats.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return;

        achievement.progress += progress;

        if (achievement.progress >= achievement.maxProgress) {
            this.unlockAchievement(achievementId);
        }

        this.saveStats();
    }

    private unlockAchievement(achievementId: string) {
        const achievement = this.stats.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        achievement.unlockedAt = new Date();

        this.addPoints(achievement.points, `Succès: ${achievement.name}`);
        this.triggerAchievementNotification(achievement);

        console.log(`🎉 Succès débloqué: ${achievement.name}`);
    }

    // 🎯 ÉVÉNEMENTS DE JEU
    trackMessageSent() {
        this.addExperience(5, 'Message envoyé');
        this.updateAchievementProgress('first_message');
        this.updateAchievementProgress('social_butterfly');
    }

    trackFileShared() {
        this.addExperience(10, 'Fichier partagé');
        this.updateAchievementProgress('file_sharer');
    }

    trackVideoCall() {
        this.addExperience(25, 'Appel vidéo');
        this.updateAchievementProgress('call_expert');
    }

    trackSecurityFeatureEnabled() {
        this.addExperience(15, 'Fonctionnalité de sécurité activée');
        this.updateAchievementProgress('security_master');
    }

    trackBridgeConnected() {
        this.addExperience(20, 'Bridge connecté');
        this.updateAchievementProgress('bridge_explorer');
    }

    trackAISuggestionUsed() {
        this.addExperience(2, 'Suggestion IA utilisée');
        this.updateAchievementProgress('ai_companion');
    }

    // 🎯 NOTIFICATIONS
    private triggerLevelUpNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Level Up!', {
                body: `Félicitations! Vous êtes maintenant niveau ${this.stats.level}`,
                icon: '/icon-192.png'
            });
        }
    }

    private triggerAchievementNotification(achievement: Achievement) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🏆 Succès Débloqué!', {
                body: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
                icon: '/icon-192.png'
            });
        }
    }

    // 🎯 LEADERBOARDS
    getLeaderboardStats() {
        return {
            level: this.stats.level,
            rank: this.stats.rank,
            points: this.stats.points,
            streak: this.stats.streak,
            achievements: this.stats.achievements.filter(a => a.unlocked).length,
            totalAchievements: this.stats.achievements.length
        };
    }

    getRankProgress(): { current: number; next: number; percentage: number } {
        const currentExp = this.stats.experience;
        const currentLevelExp = this.getExpForLevel(this.stats.level);
        const nextLevelExp = this.getExpForLevel(this.stats.level + 1);
        const expForNextLevel = nextLevelExp - currentLevelExp;
        const expInCurrentLevel = currentExp - currentLevelExp;
        const percentage = (expInCurrentLevel / expForNextLevel) * 100;

        return {
            current: expInCurrentLevel,
            next: expForNextLevel,
            percentage: Math.min(100, Math.max(0, percentage))
        };
    }

    // 🎯 PERSISTANCE
    private loadStats() {
        try {
            const saved = localStorage.getItem('palfrog-gamification-stats');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.stats = { ...this.stats, ...parsed };
                this.stats.lastActivity = new Date(this.stats.lastActivity);
            }
        } catch (error) {
            console.error('Failed to load gamification stats:', error);
        }
    }

    private saveStats() {
        try {
            localStorage.setItem('palfrog-gamification-stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save gamification stats:', error);
        }
    }

    // 🎯 RÉINITIALISATION QUOTIDIENNE
    private startDailyReset() {
        // Vérifier tous les jours à minuit
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.dailyReset();
            // Répéter toutes les 24 heures
            setInterval(() => this.dailyReset(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }

    private dailyReset() {
        this.updateStreak();
        this.saveStats();
    }

    // 🎯 MÉTHODES PUBLIQUES
    getStats(): UserStats {
        return { ...this.stats };
    }

    getAchievements(): Achievement[] {
        return [...this.stats.achievements];
    }

    getUnlockedAchievements(): Achievement[] {
        return this.stats.achievements.filter(a => a.unlocked);
    }

    getNextAchievements(): Achievement[] {
        return this.stats.achievements
            .filter(a => !a.unlocked)
            .sort((a, b) => b.points - a.points)
            .slice(0, 3);
    }
}

export const gamificationService = new GamificationService();

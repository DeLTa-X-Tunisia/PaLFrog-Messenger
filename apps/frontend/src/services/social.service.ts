interface VoiceRoom {
    id: string;
    name: string;
    description: string;
    host: string;
    participants: string[];
    maxParticipants: number;
    isPublic: boolean;
    tags: string[];
    createdAt: Date;
}

interface CommunityEvent {
    id: string;
    title: string;
    description: string;
    organizer: string;
    date: Date;
    duration: number;
    type: 'voice_chat' | 'webinar' | 'game' | 'qa';
    participants: string[];
    maxParticipants: number;
    roomId?: string;
}

class SocialService {
    private voiceRooms: VoiceRoom[] = [];
    private communityEvents: CommunityEvent[] = [];
    private activeVoiceRoom: string | null = null;

    // 🎤 GESTION DES SALONS VOCAUX
    createVoiceRoom(roomData: Omit<VoiceRoom, 'id' | 'createdAt' | 'participants'>): VoiceRoom {
        const room: VoiceRoom = {
            ...roomData,
            id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            participants: [roomData.host],
            createdAt: new Date()
        };

        this.voiceRooms.push(room);
        this.broadcastRoomUpdate();
        return room;
    }

    joinVoiceRoom(roomId: string, userId: string): boolean {
        const room = this.voiceRooms.find(r => r.id === roomId);
        if (!room || room.participants.length >= room.maxParticipants) {
            return false;
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            this.broadcastRoomUpdate();
        }

        return true;
    }

    leaveVoiceRoom(roomId: string, userId: string) {
        const room = this.voiceRooms.find(r => r.id === roomId);
        if (!room) return;

        room.participants = room.participants.filter(p => p !== userId);

        // Supprimer le salon s'il est vide
        if (room.participants.length === 0) {
            this.voiceRooms = this.voiceRooms.filter(r => r.id !== roomId);
        }

        this.broadcastRoomUpdate();
    }

    getVoiceRooms(): VoiceRoom[] {
        return this.voiceRooms.filter(room =>
            room.isPublic || room.participants.includes('current-user') // À adapter
        );
    }

    // 🎪 GESTION DES ÉVÉNEMENTS
    createCommunityEvent(eventData: Omit<CommunityEvent, 'id' | 'participants'>): CommunityEvent {
        const event: CommunityEvent = {
            ...eventData,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            participants: [eventData.organizer]
        };

        this.communityEvents.push(event);
        this.broadcastEventUpdate();
        return event;
    }

    joinCommunityEvent(eventId: string, userId: string): boolean {
        const event = this.communityEvents.find(e => e.id === eventId);
        if (!event || event.participants.length >= event.maxParticipants) {
            return false;
        }

        if (!event.participants.includes(userId)) {
            event.participants.push(userId);
            this.broadcastEventUpdate();
        }

        return true;
    }

    getUpcomingEvents(): CommunityEvent[] {
        const now = new Date();
        return this.communityEvents
            .filter(event => new Date(event.date) > now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // 🎮 SYSTÈME DE JEUX
    async startGameSession(gameType: 'chess' | 'cards' | 'trivia', participants: string[]) {
        const sessionId = `game-${Date.now()}`;

        // Initialiser la session de jeu
        const gameSession = {
            id: sessionId,
            type: gameType,
            participants,
            state: 'waiting',
            createdAt: new Date()
        };

        // Pourrait intégrer avec WebRTC DataChannel pour le gameplay en temps réel
        return gameSession;
    }

    // 📡 DIFFUSION DES MISES À JOUR
    private broadcastRoomUpdate() {
        // En réalité, utiliser Socket.IO pour les mises à jour en temps réel
        window.dispatchEvent(new CustomEvent('voiceRoomsUpdated', {
            detail: this.voiceRooms
        }));
    }

    private broadcastEventUpdate() {
        window.dispatchEvent(new CustomEvent('communityEventsUpdated', {
            detail: this.communityEvents
        }));
    }
}

export const socialService = new SocialService();

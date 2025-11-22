import { create } from 'zustand';
import { socketService } from '../services/socket.service';
import { databaseService } from '../services/database.service';
import { notificationService } from '../services/notification.service';
import { cryptoService } from '../services/crypto.service';
import { friendsService } from '../services/friends.service';
import { managers } from '../services/managers';

interface Reaction {
    emoji: string;
    count: number;
    users: string[];
}

interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    type: 'text' | 'file' | 'system';
    reactions?: Reaction[];
    bridge?: {
        source: string;
        externalId: string;
    };
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'refused';
    isPendingAuth?: boolean;
    chatId?: string;
    receiverId?: string;
}

const resolveChatId = (message: Message, activeChatId: string | null): string | undefined => {
    if (message.chatId) {
        return message.chatId;
    }

    if (message.sender === 'me') {
        if (message.receiverId) {
            return message.receiverId;
        }

        if (message.bridge?.externalId) {
            return message.bridge.externalId;
        }

        return activeChatId ?? undefined;
    }

    if (message.sender === 'system') {
        return message.receiverId ?? activeChatId ?? undefined;
    }

    return message.sender;
};

interface PeerConnection {
    peerId: string;
    connection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    isConnected: boolean;
}

interface UserInfo {
    userId: string;
    username: string;
    email: string;
    isOnline: boolean;
    avatarUrl?: string;
    status?: 'online' | 'busy' | 'away' | 'dnd' | 'offline';
}

interface WebRTCState {
    // État des connexions
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    peerConnections: Map<string, PeerConnection>;
    dataChannels: Map<string, RTCDataChannel>;
    pendingCandidates: Map<string, RTCIceCandidateInit[]>;

    // Utilisateurs
    onlineUsers: UserInfo[];

    // Messagerie
    messages: Message[];
    activeChat: string | null; // peerId ou roomId

    // État UI
    isCallActive: boolean;
    isConnecting: boolean;

    // Actions
    initializeWebRTC: () => Promise<void>;
    createPeerConnection: (peerId: string) => Promise<RTCPeerConnection>;
    handleOffer: (peerId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    handleAnswer: (peerId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    handleCandidate: (peerId: string, candidate: RTCIceCandidateInit) => Promise<void>;
    sendMessage: (content: string, receiverId?: string) => void;
    addMessage: (message: Message) => void;
    removeMessage: (messageId: string) => void; // Nouvelle action
    setActiveChat: (peerId: string) => void;
    disconnect: () => void;

    // Actions Utilisateurs
    setOnlineUsers: (users: UserInfo[]) => void;
    addUser: (user: UserInfo) => void;
    removeUser: (userId: string) => void;
    updateUserStatus: (userId: string, status: string) => void;
    notifyUserStatus: (username: string, isOnline: boolean) => void;

    // Actions Persistance
    loadChatHistory: (peerId: string) => Promise<void>;
    clearChatHistory: (peerId: string) => Promise<void>;
    exportChat: (peerId: string) => Promise<void>;
    markAsRead: (peerId: string) => Promise<void>;
    updateMessageStatus: (messageId: string, status: 'pending' | 'sent' | 'delivered' | 'read' | 'refused') => void;
    updateMessageContent: (messageId: string, newContent: string) => void;

    // Indicateurs de frappe
    typingUsers: Map<string, NodeJS.Timeout>; // userId -> timeout
    isTyping: boolean;

    // Nouvelles actions
    startTyping: (peerId: string) => void;
    stopTyping: (peerId: string) => void;
    setTypingIndicator: (peerId: string, isTyping: boolean) => void;

    // État de chiffrement
    encryptionStatus: Map<string, 'pending' | 'established' | 'failed'>;
    isEncryptionEnabled: boolean;

    // Nouvelles actions chiffrement
    initializeEncryption: (peerId: string) => Promise<void>;
    sendEncryptedMessage: (content: string, peerId?: string) => Promise<void>;
    sendPlainTextMessage: (content: string, peerId: string) => void;
    handleEncryptedMessage: (peerId: string, encryptedData: any) => Promise<void>;

    // Actions Réactions
    addReaction: (messageId: string, emoji: string) => void;

    // Notifications
    totalUnreadCount: number;
    updateUnreadCount: () => Promise<void>;

    // Notification utilisateur en ligne
    onlineNotification: { userId?: string; username: string; status?: string } | null;
    showOnlineNotification: (username: string, status?: string, userId?: string) => void;
    hideOnlineNotification: () => void;

    // Autorisation de conversation
    authorizedUsers: string[];
    authorizeUser: (userId: string) => void;
    unauthorizeUser: (userId: string) => void;
    acceptAuth: (peerId: string) => void;
    rejectAuth: (peerId: string) => void;
}

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
    localStream: null,
    remoteStreams: new Map(),
    peerConnections: new Map(),
    dataChannels: new Map(),
    pendingCandidates: new Map(),
    messages: [],
    activeChat: null,
    isCallActive: false,
    isConnecting: false,
    onlineUsers: [],

    totalUnreadCount: 0,
    onlineNotification: null,

    // Initialiser depuis le localStorage
    authorizedUsers: JSON.parse(localStorage.getItem('authorizedUsers') || '[]'),

    authorizeUser: (userId: string) => {
        const { authorizedUsers } = get();
        if (!authorizedUsers.includes(userId)) {
            const newAuthorized = [...authorizedUsers, userId];
            set({ authorizedUsers: newAuthorized });
            localStorage.setItem('authorizedUsers', JSON.stringify(newAuthorized));
        }
    },

    unauthorizeUser: (userId: string) => {
        const { authorizedUsers } = get();
        const newAuthorized = authorizedUsers.filter(id => id !== userId);
        set({ authorizedUsers: newAuthorized });
        localStorage.setItem('authorizedUsers', JSON.stringify(newAuthorized));
    },

    acceptAuth: (peerId: string) => {
        get().authorizeUser(peerId);

        // Mettre à jour les messages en attente
        set((state) => ({
            messages: state.messages.map(m =>
                m.sender === peerId && m.isPendingAuth
                    ? { ...m, isPendingAuth: false }
                    : m
            )
        }));

        // Envoyer le signal d'acceptation
        const { dataChannels } = get();
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'auth_accepted'
            }));
        }
    },

    rejectAuth: (peerId: string) => {
        // Supprimer les messages en attente
        set((state) => ({
            messages: state.messages.filter(m => !(m.sender === peerId && m.isPendingAuth))
        }));

        // Envoyer le signal de refus
        const { dataChannels } = get();
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'auth_refused'
            }));
        }
    },

    showOnlineNotification: (username: string, status = 'online', userId?: string) => {
        set({ onlineNotification: { username, status, userId } });
    },

    hideOnlineNotification: () => {
        set({ onlineNotification: null });
    },

    updateUnreadCount: async () => {
        try {
            const chats = await databaseService.getAllChats();
            const total = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
            set({ totalUnreadCount: total });
        } catch (error) {
            console.error('Failed to update unread count:', error);
        }
    },

    typingUsers: new Map(),
    isTyping: false,

    encryptionStatus: new Map(),
    isEncryptionEnabled: true, // Activé par défaut

    initializeEncryption: async (peerId: string) => {
        const { dataChannels } = get();

        set((state) => {
            const updatedStatus = new Map(state.encryptionStatus);
            updatedStatus.set(peerId, 'pending');
            return { encryptionStatus: updatedStatus };
        });

        try {
            // Initialiser le service crypto
            await cryptoService.initialize();

            // Vérifier si on a déjà une clé partagée
            if (!cryptoService.hasSharedKey(peerId)) {
                // Initier l'échange de clés
                const dataChannel = dataChannels.get(peerId);
                if (dataChannel && dataChannel.readyState === 'open') {
                    await cryptoService.sendPublicKey(peerId, dataChannel);
                } else {
                    throw new Error('DataChannel not ready');
                }
            } else {
                // Clé déjà établie
                set((state) => {
                    const updatedStatus = new Map(state.encryptionStatus);
                    updatedStatus.set(peerId, 'established');
                    return { encryptionStatus: updatedStatus };
                });
            }
        } catch (error) {
            console.error('Encryption initialization failed:', error);
            set((state) => {
                const updatedStatus = new Map(state.encryptionStatus);
                updatedStatus.set(peerId, 'failed');
                return { encryptionStatus: updatedStatus };
            });
        }
    },

    sendEncryptedMessage: async (content: string, peerId?: string) => {
        const { activeChat, dataChannels, isEncryptionEnabled, addMessage } = get();
        const targetPeerId = peerId || activeChat;

        if (!targetPeerId) {
            console.error('No active chat');
            return;
        }

        if (!isEncryptionEnabled) {
            // Fallback: envoyer en clair
            get().sendPlainTextMessage(content, targetPeerId);
            return;
        }

        try {
            // Vérifier le statut de chiffrement
            const encryptionStatus = get().encryptionStatus.get(targetPeerId);
            if (encryptionStatus !== 'established' && !cryptoService.hasSharedKey(targetPeerId)) {
                console.warn('Encryption not established, falling back to plain text');
                get().sendPlainTextMessage(content, targetPeerId);
                return;
            }

            // Chiffrer le message
            const { encrypted, iv } = await cryptoService.encryptMessage(targetPeerId, content);

            // Envoyer via DataChannel
            const dataChannel = dataChannels.get(targetPeerId);
            if (dataChannel && dataChannel.readyState === 'open') {
                const encryptedMessage = {
                    type: 'encrypted_message',
                    encrypted,
                    iv,
                    timestamp: new Date().toISOString(),
                };

                dataChannel.send(JSON.stringify(encryptedMessage));
                // Note: Le message est déjà ajouté par sendMessage, pas besoin de l'ajouter ici
            } else {
                throw new Error('DataChannel not available');
            }
        } catch (error) {
            console.error('Failed to send encrypted message:', error);

            // Fallback: envoyer en clair
            get().sendPlainTextMessage(content, targetPeerId);
        }
    },

    handleEncryptedMessage: async (peerId: string, encryptedData: any) => {
        const { addMessage, isEncryptionEnabled } = get();

        if (!isEncryptionEnabled) {
            console.warn('Encryption disabled, cannot decrypt message');
            return;
        }

        try {
            // Déchiffrer le message
            const decryptedContent = await cryptoService.decryptMessage(
                peerId,
                encryptedData.encrypted,
                encryptedData.iv
            );

            // Ajouter le message déchiffré
            addMessage({
                id: `${peerId}-${Date.now()}`,
                content: decryptedContent,
                sender: peerId,
                timestamp: new Date(encryptedData.timestamp),
                type: 'text'
            });
        } catch (error) {
            console.error('Failed to decrypt message:', error);

            // Ajouter un message d'erreur
            addMessage({
                id: `${peerId}-${Date.now()}`,
                content: '🔒 Message chiffré non déchiffrable',
                sender: peerId,
                timestamp: new Date(),
                type: 'system'
            });
        }
    },

    startTyping: (peerId: string) => {
        const { dataChannels, activeChat } = get();

        // Ne pas envoyer l'indicateur si ce n'est pas le chat actif
        if (activeChat !== peerId) return;

        // Envoyer l'événement "typing start" via DataChannel
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            const typingEvent = {
                type: 'typing_start',
                timestamp: new Date().toISOString(),
            };
            dataChannel.send(JSON.stringify(typingEvent));
        } else {
            // Fallback via Socket.IO
            socketService.sendTypingStart(peerId);
        }
    },

    stopTyping: (peerId: string) => {
        const { dataChannels, activeChat } = get();

        // Envoyer l'événement "typing stop" via DataChannel
        const dataChannel = dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open' && activeChat === peerId) {
            const typingEvent = {
                type: 'typing_stop',
                timestamp: new Date().toISOString(),
            };
            dataChannel.send(JSON.stringify(typingEvent));
        } else {
            // Fallback via Socket.IO
            socketService.sendTypingStop(peerId);
        }
    },

    setTypingIndicator: (peerId: string, isTyping: boolean) => {
        const { typingUsers } = get();
        const updatedTypingUsers = new Map(typingUsers);

        if (isTyping) {
            // Définir un timeout pour l'indicateur distant (5 secondes max)
            const timeout = setTimeout(() => {
                get().setTypingIndicator(peerId, false);
            }, 5000);

            updatedTypingUsers.set(peerId, timeout);
        } else {
            // Nettoyer le timeout
            const timeout = updatedTypingUsers.get(peerId);
            if (timeout) {
                clearTimeout(timeout);
                updatedTypingUsers.delete(peerId);
            }
        }

        set({
            typingUsers: updatedTypingUsers,
            isTyping: updatedTypingUsers.size > 0
        });
    },

    setOnlineUsers: (users) => {
        console.log('Store updating onlineUsers:', users);
        set({ onlineUsers: users });
    },
    addUser: (user) => set((state) => ({
        onlineUsers: [...state.onlineUsers.filter(u => u.userId !== user.userId), user]
    })),
    removeUser: (userId) => set((state) => ({
        onlineUsers: state.onlineUsers.filter(u => u.userId !== userId)
    })),
    updateUserStatus: (userId, status) => set((state) => {
        console.log('🔷 Store: updateUserStatus called for', userId, 'new status:', status);

        // Vérifier si l'utilisateur existe
        const userExists = state.onlineUsers.some(u => u.userId === userId);

        if (!userExists) {
            console.warn('⚠️ Store: User', userId, 'not found in onlineUsers - adding with minimal info');
            return {
                onlineUsers: [
                    ...state.onlineUsers,
                    {
                        userId,
                        username: 'Unknown User',
                        email: '',
                        isOnline: status !== 'offline',
                        status: status as any
                    }
                ]
            };
        }

        // Mettre à jour l'utilisateur existant
        const updated = state.onlineUsers.map(u => {
            if (u.userId === userId) {
                console.log('🔷 Store: Updating user', u.username, 'from', u.status, 'to', status);
                return { ...u, status: status as any, isOnline: status !== 'offline' };
            }
            return u;
        });
        console.log('🔷 Store: Updated user:', updated.find(u => u.userId === userId));
        return { onlineUsers: updated };
    }),
    notifyUserStatus: (username, isOnline) => {
        if (isOnline) {
            notificationService.notifyUserOnline(username);
        }
    },

    loadChatHistory: async (peerId: string) => {
        try {
            const messages = await databaseService.getChatMessages(peerId);

            set((state) => ({
                messages: [...messages, ...state.messages].filter((msg, index, self) =>
                    index === self.findIndex(m => m.id === msg.id)
                ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            }));
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    },

    clearChatHistory: async (peerId: string) => {
        try {
            await databaseService.clearChat(peerId);

            set((state) => ({
                messages: state.messages.filter(msg => {
                    const messageChatId = msg.chatId ?? (msg.sender === 'me' ? msg.receiverId : msg.sender);
                    return messageChatId !== peerId;
                })
            }));
        } catch (error) {
            console.error('Failed to clear chat history:', error);
        }
    },

    exportChat: async (peerId: string) => {
        try {
            // Récupérer l'historique complet depuis la base de données
            const messages = await databaseService.getChatMessages(peerId, 10000); // Limite large pour l'export

            if (messages.length === 0) {
                // Fallback sur le state si la DB est vide (ex: nouveaux messages non persistés)
                const stateMessages = get().messages.filter(msg => {
                    const messageChatId = msg.chatId ?? (msg.sender === 'me' ? msg.receiverId : msg.sender);
                    return messageChatId === peerId;
                });

                if (stateMessages.length === 0) {
                    console.warn('Aucun message à exporter');
                    return;
                }
                messages.push(...stateMessages);
            }

            // Préparer le contenu du fichier
            let content = `Conversation avec ${peerId}\n`;
            content += `Exporté le ${new Date().toLocaleString()}\n`;
            content += `----------------------------------------\n\n`;

            messages.forEach((msg: any) => {
                const date = new Date(msg.timestamp).toLocaleString();
                const sender = msg.sender === 'me' ? 'Moi' : (msg.sender === peerId ? peerId : msg.sender);
                content += `[${date}] ${sender}:\n${msg.content}\n\n`;
            });

            content += `----------------------------------------\n`;
            content += `Conversation exportée depuis PalFrog\n`;

            // Créer et télécharger le fichier
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `conversation_${peerId}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Failed to export chat:', error);
        }
    },

    updateMessageStatus: (messageId, status) => {
        set((state) => ({
            messages: state.messages.map(m =>
                m.id === messageId ? { ...m, status } : m
            )
        }));
    },

    updateMessageContent: (messageId, newContent) => {
        set((state) => {
            const updatedMessages = state.messages.map(m =>
                m.id === messageId ? { ...m, content: newContent } : m
            );

            // Persister le changement
            const message = updatedMessages.find(m => m.id === messageId);
            if (message) {
                // Adapter le message pour le service de base de données
                const dbMessage = {
                    ...message,
                    chatId: state.activeChat || 'unknown' // Ajouter chatId manquant
                };
                databaseService.saveMessage(dbMessage);
            }

            return { messages: updatedMessages };
        });
    },

    markAsRead: async (peerId: string) => {
        try {
            // Mettre à jour le chat en base de données
            const chats = await databaseService.getAllChats();
            const chat = chats.find(c => c.id === peerId);

            if (chat) {
                await databaseService.updateChat(peerId, {
                    sender: 'me', // Astuce pour reset le compteur (voir database.service.ts)
                    content: chat.lastMessage,
                    timestamp: chat.lastActivity
                });

                // Mettre à jour le compteur global
                await get().updateUnreadCount();

                // Envoyer le signal de lecture
                const { dataChannels } = get();
                const dataChannel = dataChannels.get(peerId);
                if (dataChannel && dataChannel.readyState === 'open') {
                    dataChannel.send(JSON.stringify({
                        type: 'message_read',
                        timestamp: new Date().toISOString()
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    initializeWebRTC: async () => {
        try {
            // Configuration STUN/TURN pour la connexion P2P
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    // Ajouter vos serveurs TURN ici pour le relay NAT
                ],
                iceCandidatePoolSize: 10,
            };

            // Initialiser les streams (pour future audio/vidéo)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false, // Audio seulement pour commencer
            });

            set({ localStream: stream, isCallActive: true });

        } catch (error) {
            console.error('WebRTC initialization failed:', error);
            // Fallback: fonctionner en mode texte seulement
            set({ isCallActive: true });
        }
    },

    createPeerConnection: async (peerId: string) => {
        const { peerConnections, localStream } = get();

        if (peerConnections.has(peerId)) {
            return peerConnections.get(peerId)!.connection;
        }

        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        };

        const peerConnection = new RTCPeerConnection(configuration);

        // Ajouter le stream local (si disponible)
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        // Créer le DataChannel pour la messagerie texte
        const dataChannel = peerConnection.createDataChannel('chat', {
            ordered: true,
            maxPacketLifeTime: 3000, // 3 secondes pour la fiabilité
        });

        // Gérer les messages entrants du DataChannel
        dataChannel.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'auth_accepted') {
                    set((state) => ({
                        messages: state.messages.map(m =>
                            m.sender === 'me' && m.status === 'pending'
                                ? { ...m, status: 'delivered' }
                                : m
                        )
                    }));
                    return;
                }

                if (message.type === 'message_read') {
                    set((state) => ({
                        messages: state.messages.map(m =>
                            m.sender === 'me' && (m.status === 'sent' || m.status === 'delivered')
                                ? { ...m, status: 'read' }
                                : m
                        )
                    }));
                    return;
                }

                if (message.type === 'message_received') {
                    if (message.messageId) {
                        set((state) => ({
                            messages: state.messages.map(m =>
                                m.id === message.messageId
                                    ? { ...m, status: 'delivered' }
                                    : m
                            )
                        }));
                    }
                    return;
                }

                if (message.type === 'auth_refused') {
                    set((state) => ({
                        messages: state.messages.filter(m => !(m.sender === 'me' && m.status === 'pending'))
                    }));
                    // Notification in-app intégrée au lieu de notification système
                    const { showInAppNotification } = await import('../services/toast-helper');
                    showInAppNotification(
                        'Message refusé',
                        `L'utilisateur a refusé votre demande de conversation.`,
                        { type: 'system' }
                    );
                    return;
                }

                if (message.type === 'encrypted_message') {
                    get().handleEncryptedMessage(peerId, message);
                    return;
                }

                if (message.type === 'typing_start') {
                    get().setTypingIndicator(peerId, true);
                    return;
                }

                if (message.type === 'typing_stop') {
                    get().setTypingIndicator(peerId, false);
                    return;
                }

                // Gestion des fichiers
                if (['file_metadata', 'file_chunk', 'file_transfer_ack', 'chunk_ack', 'file_offer', 'file_accept', 'file_reject', 'file_cancel'].includes(message.type)) {
                    managers.fileTransfer.handleFileMessage(peerId, message, dataChannel);
                    return;
                }

                // Vérification de l'autorisation
                const { authorizedUsers } = get();
                const isAuthorized = authorizedUsers.includes(peerId);

                const messageId = message.id || Date.now().toString();

                // On n'ajoute le message que si c'est du texte explicite ou si le type est manquant (compatibilité)
                // Cela évite d'afficher le JSON brut des messages système/fichiers non gérés
                if (message.type === 'text' || !message.type) {
                    get().addMessage({
                        id: messageId,
                        content: message.content || '',
                        sender: peerId,
                        timestamp: new Date(),
                        type: 'text',
                        isPendingAuth: !isAuthorized
                    });

                    // Envoyer l'accusé de réception (si autorisé)
                    if (isAuthorized) {
                        dataChannel.send(JSON.stringify({
                            type: 'message_received',
                            messageId: messageId
                        }));
                    }
                }
            } catch (error) {
                console.error('Error handling incoming message:', error);
            }
        };

        dataChannel.onopen = () => {
            console.log('DataChannel ouvert avec', peerId);
            const updatedChannels = new Map(get().dataChannels);
            updatedChannels.set(peerId, dataChannel);
            set({ dataChannels: updatedChannels });
        };

        // Gérer les streams distants
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            const updatedStreams = new Map(get().remoteStreams);
            updatedStreams.set(peerId, remoteStream);
            set({ remoteStreams: updatedStreams });
        };

        // Gérer la connexion ICE
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.sendICECandidate(peerId, event.candidate);
            }
        };

        // Gérer la connexion ICE
        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);

            if (peerConnection.iceConnectionState === 'connected') {
                console.log('Connexion P2P établie avec', peerId);
            }
        };

        const newPeerConnection: PeerConnection = {
            peerId,
            connection: peerConnection,
            dataChannel,
            isConnected: false
        };

        const updatedConnections = new Map(peerConnections);
        updatedConnections.set(peerId, newPeerConnection);
        set({ peerConnections: updatedConnections });

        // Traiter les candidats ICE en attente (au cas où)
        const { pendingCandidates } = get();
        const candidates = pendingCandidates.get(peerId);
        if (candidates) {
            console.log(`Processing ${candidates.length} queued ICE candidates for ${peerId} (initiator)`);
            for (const candidate of candidates) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding queued ice candidate', e);
                }
            }
            const updatedPending = new Map(pendingCandidates);
            updatedPending.delete(peerId);
            set({ pendingCandidates: updatedPending });
        }

        // Créer et envoyer l'offre
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketService.sendOffer(peerId, offer);

        return peerConnection;
    },

    handleOffer: async (peerId: string, offer: RTCSessionDescriptionInit) => {
        const { peerConnections, localStream } = get();

        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        };

        const peerConnection = new RTCPeerConnection(configuration);

        // Ajouter le stream local
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        // Gérer le DataChannel entrant (créé par l'initiateur)
        peerConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;

            dataChannel.onmessage = (msgEvent) => {
                try {
                    const message = JSON.parse(msgEvent.data);

                    if (message.type === 'encrypted_message') {
                        get().handleEncryptedMessage(peerId, message);
                        return;
                    }

                    if (message.type === 'typing_start') {
                        get().setTypingIndicator(peerId, true);
                        return;
                    }

                    if (message.type === 'typing_stop') {
                        get().setTypingIndicator(peerId, false);
                        return;
                    }

                    // Gestion des fichiers
                    if (['file_metadata', 'file_chunk', 'file_transfer_ack', 'chunk_ack', 'file_offer', 'file_accept', 'file_reject', 'file_cancel'].includes(message.type)) {
                        managers.fileTransfer.handleFileMessage(peerId, message, dataChannel);
                        return;
                    }

                    if (message.type === 'text' || !message.type) {
                        get().addMessage({
                            id: Date.now().toString(),
                            content: message.content || '',
                            sender: peerId,
                            timestamp: new Date(),
                            type: 'text'
                        });
                    }
                } catch (error) {
                    console.error('Error handling incoming message (remote):', error);
                }
            };

            dataChannel.onopen = () => {
                console.log('DataChannel (remote) ouvert avec', peerId);
                const updatedChannels = new Map(get().dataChannels);
                updatedChannels.set(peerId, dataChannel);
                set({ dataChannels: updatedChannels });
            };
        };

        // Gérer les streams distants
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            const updatedStreams = new Map(get().remoteStreams);
            updatedStreams.set(peerId, remoteStream);
            set({ remoteStreams: updatedStreams });
        };

        // Gérer les candidats ICE
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.sendICECandidate(peerId, event.candidate);
            }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socketService.sendAnswer(peerId, answer);

        const newPeerConnection: PeerConnection = {
            peerId,
            connection: peerConnection,
            dataChannel: null as any, // Sera défini via ondatachannel
            isConnected: false
        };

        const updatedConnections = new Map(peerConnections);
        updatedConnections.set(peerId, newPeerConnection);
        set({ peerConnections: updatedConnections });

        // Traiter les candidats ICE en attente
        const { pendingCandidates } = get();
        const candidates = pendingCandidates.get(peerId);
        if (candidates) {
            console.log(`Processing ${candidates.length} queued ICE candidates for ${peerId}`);
            for (const candidate of candidates) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding queued ice candidate', e);
                }
            }
            const updatedPending = new Map(pendingCandidates);
            updatedPending.delete(peerId);
            set({ pendingCandidates: updatedPending });
        }
    },

    handleAnswer: async (peerId: string, answer: RTCSessionDescriptionInit) => {
        const { peerConnections } = get();
        const pcWrapper = peerConnections.get(peerId);

        if (pcWrapper) {
            await pcWrapper.connection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    },

    handleCandidate: async (peerId: string, candidate: RTCIceCandidateInit) => {
        const { peerConnections, pendingCandidates } = get();
        const pcWrapper = peerConnections.get(peerId);

        if (pcWrapper) {
            try {
                await pcWrapper.connection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        } else {
            console.log(`Queueing ICE candidate for ${peerId}`);
            const currentCandidates = pendingCandidates.get(peerId) || [];
            const updatedCandidates = new Map(pendingCandidates);
            updatedCandidates.set(peerId, [...currentCandidates, candidate]);
            set({ pendingCandidates: updatedCandidates });
        }
    },

    sendPlainTextMessage: (content: string, peerId: string) => {
        const { dataChannels } = get();
        const dataChannel = dataChannels.get(peerId);

        if (dataChannel && dataChannel.readyState === 'open') {
            const message = {
                type: 'text',
                content,
                timestamp: new Date().toISOString(),
                sender: 'me'
            };

            dataChannel.send(JSON.stringify(message));
            // Note: Le message est déjà ajouté par sendMessage, pas besoin de l'ajouter ici
        } else {
            console.warn(`DataChannel not open for ${peerId}, cannot send plain text message`);
        }
    },

    sendMessage: async (content: string, receiverId?: string) => {
        const { activeChat, isEncryptionEnabled } = get();
        const targetPeerId = receiverId || activeChat;

        if (!targetPeerId) {
            console.error('Aucun chat actif');
            return;
        }

        // Ajouter le message localement avec le statut 'pending'
        const message: Message = {
            id: Date.now().toString(),
            content,
            sender: 'me',
            timestamp: new Date(),
            type: 'text',
            status: 'sent',
            chatId: targetPeerId,
            receiverId: targetPeerId
        };
        get().addMessage(message);

        if (isEncryptionEnabled) {
            await get().sendEncryptedMessage(content, targetPeerId);
        } else {
            get().sendPlainTextMessage(content, targetPeerId);
        }
    },

    addMessage: (message: Message) => {
        const { activeChat, messages, onlineUsers } = get();

        const normalizedTimestamp = message.timestamp instanceof Date
            ? message.timestamp
            : new Date(message.timestamp);

        const resolvedChatId = resolveChatId(message, activeChat);

        const normalizedType = message.type || 'text';

        const normalizedMessage: Message = {
            ...message,
            timestamp: normalizedTimestamp,
            type: normalizedType,
            chatId: resolvedChatId,
        };

        // Éviter les doublons
        if (messages.some(m => m.id === normalizedMessage.id)) {
            return;
        }

        // Déterminer le chatId correct pour la persistance
        // Si c'est un message entrant, le chatId est l'expéditeur
        // Si c'est un message sortant ('me'), le chatId est le destinataire (activeChat)
        const chatId = resolvedChatId;

        if (chatId && !normalizedMessage.isPendingAuth) {
            // Trouver le nom de l'expéditeur
            const senderUser = onlineUsers.find(u => u.userId === normalizedMessage.sender);
            const senderName = senderUser ? senderUser.username : undefined;

            // Persister en base seulement si autorisé
            databaseService.saveMessage({
                ...normalizedMessage,
                chatId: chatId,
                type: normalizedType as 'text' | 'file' | 'system',
                senderName: senderName
            }).then(() => {
                get().updateUnreadCount();
            });
        }

        // Notification pour les messages entrants (seulement si autorisé)
        if (normalizedMessage.sender !== 'me' && chatId && activeChat !== chatId && !normalizedMessage.isPendingAuth) {
            // Résolution asynchrone du nom pour la notification
            (async () => {
                let senderName = normalizedMessage.sender;

                // 1. Chercher dans les utilisateurs en ligne (rapide)
                const onlineUser = get().onlineUsers.find(u => u.userId === normalizedMessage.sender);
                if (onlineUser) {
                    senderName = onlineUser.username;
                } else {
                    // 2. Chercher dans la base de données locale (cache)
                    const chat = await databaseService.getChat(normalizedMessage.sender);
                    if (chat && chat.participantName && chat.participantName !== normalizedMessage.sender) {
                        senderName = chat.participantName;
                    } else {
                        // 3. Chercher dans la liste d'amis (API)
                        try {
                            const friends = await friendsService.getFriends();
                            const friend = friends.find((f: any) => f.friend.id === normalizedMessage.sender);
                            if (friend) {
                                senderName = friend.friend.username;
                                // Mettre à jour le cache local si trouvé
                                databaseService.updateChat(chatId, {
                                    sender: normalizedMessage.sender,
                                    content: normalizedMessage.content,
                                    timestamp: normalizedMessage.timestamp
                                }, senderName);
                            }
                        } catch (e) {
                            // Ignorer les erreurs silencieusement
                        }
                    }
                }

                notificationService.notifyNewMessage({
                    id: normalizedMessage.id,
                    content: normalizedMessage.content,
                    sender: senderName,
                    chatId: chatId, // Pour les chats 1-to-1
                });
            })();
        }

        set((state) => ({
            messages: [...state.messages, normalizedMessage]
        }));
    },

    removeMessage: (messageId: string) => {
        set((state) => ({
            messages: state.messages.filter(m => {
                // Si c'est un message de fichier, on vérifie si le contenu correspond à l'ID de transfert
                // Mais ici on filtre par ID de message, c'est plus simple
                return m.id !== messageId;
            })
        }));
        // TODO: Supprimer aussi de la base de données si nécessaire
    },

    setActiveChat: (peerId: string) => {
        set({ activeChat: peerId });
    },

    disconnect: () => {
        const { peerConnections, localStream } = get();

        // Fermer toutes les connexions
        peerConnections.forEach((pc) => {
            pc.connection.close();
        });

        // Arrêter les streams
        localStream?.getTracks().forEach(track => track.stop());

        set({
            localStream: null,
            remoteStreams: new Map(),
            peerConnections: new Map(),
            dataChannels: new Map(),
            isCallActive: false,
            activeChat: null
        });
    },

    addReaction: (messageId: string, emoji: string) => {
        set((state) => ({
            messages: state.messages.map((msg) => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    const existingReaction = reactions.find((r) => r.emoji === emoji);

                    let newReactions;
                    if (existingReaction) {
                        newReactions = reactions.map((r) =>
                            r.emoji === emoji
                                ? { ...r, count: r.count + 1, users: [...r.users, 'me'] }
                                : r
                        );
                    } else {
                        newReactions = [...reactions, { emoji, count: 1, users: ['me'] }];
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            })
        }));
    }
}));

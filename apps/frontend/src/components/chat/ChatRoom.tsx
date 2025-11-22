import React, { useState, useEffect, useRef } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { useAuthStore } from '../../stores/auth.store';
import { databaseService } from '../../services/database.service';
import { useCallStore } from '../../stores/call.store';
import { FileShareButton } from './FileShareButton';
import { MessageSearch } from './MessageSearch';
import { AISuggestions } from '../ai/AISuggestions';
import { ConversationSummary } from '../ai/ConversationSummary';
import { useAIStore } from '../../stores/ai.store';
import { FileMessage } from './FileMessage';
import { ConversationAuthToggle } from './ConversationAuthToggle';
import { authAPI } from '../../services/api';
import { UserProfileModal } from './UserProfileModal';
import { RichTextMessageInput } from './RichTextMessageInput';
import { sanitizeHtml, isMessageEmpty } from '../../utils/html-sanitizer';

export const ChatRoom: React.FC = () => {
    const {
        messages,
        activeChat,
        sendMessage,
        onlineUsers,
        loadChatHistory,
        clearChatHistory,
        exportChat,
        typingUsers,
        startTyping,
        stopTyping,
        encryptionStatus,
        isEncryptionEnabled,
        authorizedUsers,
        authorizeUser,
        acceptAuth,
        rejectAuth,
        markAsRead
    } = useWebRTCStore();
    const { startCall } = useCallStore();
    const { user } = useAuthStore();
    const { preferences } = useAIStore();
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isTempAuthorized, setIsTempAuthorized] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    // État pour activer/désactiver les suggestions AI (désactivé par défaut)
    const [isAISuggestionsEnabled, setIsAISuggestionsEnabled] = useState(() => {
        const saved = localStorage.getItem('palfrog-ai-suggestions-enabled');
        return saved ? JSON.parse(saved) : false;
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const activeUser = onlineUsers.find(u => u.userId === activeChat);
    const recipientStatus = activeUser?.status || 'offline';
    const isRecipientDND = recipientStatus === 'dnd';
    const isPermanentlyAuthorized = activeChat ? authorizedUsers.includes(activeChat) : false;
    const isAuthorized = isPermanentlyAuthorized || isTempAuthorized;

    useEffect(() => {
        const updateChatDetails = async () => {
            let currentAvatarUrl: string | undefined;
            let currentDisplayName: string | undefined;

            if (activeUser) {
                currentDisplayName = activeUser.username;
                currentAvatarUrl = activeUser.avatarUrl;
            }

            // Si on n'a pas trouvé l'avatar via l'utilisateur en ligne, ou si l'utilisateur est hors ligne
            if (!currentAvatarUrl) {
                try {
                    // 1. Chercher dans la base de données locale (chats)
                    const chats = await databaseService.getAllChats();
                    const chat = chats.find(c => c.participantId === activeChat);

                    if (chat) {
                        if (!currentDisplayName) currentDisplayName = chat.participantName;
                        if (chat.avatarUrl) currentAvatarUrl = chat.avatarUrl;
                    }

                    // 2. Si toujours pas d'avatar, chercher via l'API
                    if (!currentAvatarUrl && activeChat) {
                        try {
                            const profile = await authAPI.getVisibleProfile(activeChat);
                            if (profile) {
                                if (!currentDisplayName) currentDisplayName = profile.username;
                                if (profile.avatarUrl) {
                                    currentAvatarUrl = profile.avatarUrl;
                                    // Mettre à jour le cache local
                                    databaseService.updateChatAvatar(activeChat, profile.avatarUrl);
                                }
                            }
                        } catch (e) {
                            // Ignorer les erreurs API
                        }
                    }
                } catch (error) {
                    console.error('Error fetching chat details:', error);
                }
            }

            setDisplayName(currentDisplayName || 'Utilisateur inconnu');
            setAvatarUrl(currentAvatarUrl);
        };
        updateChatDetails();
    }, [activeChat, activeUser]);

    const handleSuggestionSelect = (suggestion: string) => {
        setInputValue(suggestion);
    };

    const getMessageContext = () => {
        return messages
            .slice(-5)
            .map(msg => msg.content)
            .filter(content => content && content.length > 0);
    };
    // Obtenir le statut de chiffrement pour le chat actif
    const getEncryptionStatus = () => {
        if (!activeChat || !isEncryptionEnabled) return null;

        const status = encryptionStatus.get(activeChat);

        switch (status) {
            case 'established':
                return { text: 'Chiffrement E2E activé', icon: '🔒', color: 'text-green-500' };
            case 'pending':
                return { text: 'Établissement du chiffrement...', icon: '⏳', color: 'text-yellow-500' };
            case 'failed':
                return { text: 'Chiffrement échoué', icon: '⚠️', color: 'text-red-500' };
            default:
                return { text: 'Chiffrement en attente', icon: '🔓', color: 'text-gray-500' };
        }
    };

    const encryptionInfo = getEncryptionStatus();

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    };

    useEffect(() => {
        if (activeChat) {
            // Charger l'historique au montage
            loadChatHistory(activeChat);
            // Reset temp auth
            setIsTempAuthorized(false);
            // Marquer comme lu
            markAsRead(activeChat);
            
            // Scroll immédiat au changement de chat (sans animation pour être instantané)
            setTimeout(() => scrollToBottom('auto'), 100);
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (activeChat) {
                stopTyping(activeChat);
            }
        };
    }, [activeChat, loadChatHistory, stopTyping, markAsRead]);

    // Marquer comme lu à la réception de nouveaux messages
    useEffect(() => {
        if (activeChat && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.sender === activeChat) {
                markAsRead(activeChat);
            }
        }
    }, [messages.length, activeChat, markAsRead]);

    // Scroll automatique lors de nouveaux messages ou indicateur de frappe
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom('smooth');
        }
    }, [messages.length, typingUsers]);

    // Scroll lors du chargement initial des messages (après loadChatHistory)
    useEffect(() => {
        if (messages.length > 0 && activeChat) {
            // Double timeout pour s'assurer que le DOM est rendu
            setTimeout(() => scrollToBottom('auto'), 150);
        }
    }, [activeChat, messages.length > 0]);

    // Mémoriser l'état des suggestions AI
    useEffect(() => {
        localStorage.setItem('palfrog-ai-suggestions-enabled', JSON.stringify(isAISuggestionsEnabled));
    }, [isAISuggestionsEnabled]);

    const toggleAISuggestions = () => {
        setIsAISuggestionsEnabled((prev: boolean) => !prev);
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);

        if (activeChat) {
            if (!isTyping && !isMessageEmpty(value)) {
                setIsTyping(true);
                startTyping(activeChat);
            }

            // Réinitialiser le timeout de frappe
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (activeChat) {
                    stopTyping(activeChat);
                }
            }, 1000); // Arrêter après 1 seconde d'inactivité
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMessageEmpty(inputValue) && activeChat) {
            // Vérifier si le destinataire est en mode DND
            if (isRecipientDND) {
                // Afficher une notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-20 right-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in-right max-w-md';
                notification.innerHTML = `
                    <div class="flex items-start space-x-3">
                        <span class="text-2xl">🚫</span>
                        <div>
                            <p class="font-semibold mb-1">Message non envoyé</p>
                            <p class="text-sm">${displayName} est en mode <strong>Ne pas déranger</strong>. Votre message ne peut pas être envoyé pour le moment.</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.classList.add('animate-fade-out');
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
                return;
            }

            // Si je suis l'initiateur ou si je réponds, j'autorise implicitement
            if (!authorizedUsers.includes(activeChat)) {
                authorizeUser(activeChat);
            }

            // Arrêter l'indicateur de frappe
            setIsTyping(false);
            stopTyping(activeChat);

            sendMessage(inputValue, activeChat);
            setInputValue('');

            // Nettoyer le timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    // Obtenir les utilisateurs en train de taper dans le chat actif
    const getTypingUsersText = () => {
        if (!activeChat || typingUsers.size === 0) return null;

        const typingInThisChat = Array.from(typingUsers.keys()).includes(activeChat);
        if (typingInThisChat) {
            return `${displayName || activeChat} est en train d'écrire...`;
        }

        return null;
    };

    const typingText = getTypingUsersText();

    const modalUser = activeUser ? {
        id: activeUser.userId,
        username: activeUser.username,
        email: activeUser.email,
        avatarUrl: activeUser.avatarUrl
    } : activeChat ? {
        id: activeChat,
        username: displayName,
        avatarUrl: avatarUrl
    } : null;

    if (!activeChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm text-gray-500 p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mb-6 animate-float">
                    <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Bienvenue sur PaLFroG</h3>
                <p className="max-w-md">Sélectionnez un contact dans la liste pour démarrer une conversation sécurisée en Peer-to-Peer.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white/30 backdrop-blur-sm overflow-hidden rounded-tl-2xl shadow-inner">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/60 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-10 h-10 rounded-full object-cover shadow-md"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-md">
                            {displayName[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-800">{displayName}</h3>
                        <div className="flex flex-col">
                            {(() => {
                                const status = activeUser ? (activeUser.status || 'online') : 'offline';
                                const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
                                    online: { label: 'En ligne', color: 'bg-green-500', textColor: 'text-green-600' },
                                    busy: { label: 'Occupé(e)', color: 'bg-red-500', textColor: 'text-red-600' },
                                    away: { label: 'Absent(e)', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                                    dnd: { label: 'Ne pas déranger', color: 'bg-red-600', textColor: 'text-red-700' },
                                    offline: { label: 'Hors ligne', color: 'bg-gray-400', textColor: 'text-gray-400' },
                                };
                                const currentStatus = statusConfig[status] || statusConfig.offline;

                                return (
                                    <span className={`text-xs flex items-center gap-1 font-medium ${currentStatus.textColor}`}>
                                        <span className={`w-2 h-2 rounded-full ${currentStatus.color} ${status === 'online' ? 'animate-pulse' : ''}`}></span>
                                        {currentStatus.label}
                                    </span>
                                );
                            })()}
                            {encryptionInfo && (
                                <span className={`text-[10px] flex items-center gap-1 font-medium ${encryptionInfo.color}`}>
                                    <span>{encryptionInfo.icon}</span>
                                    {encryptionInfo.text}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {activeChat && <ConversationAuthToggle userId={activeChat} />}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="p-2 text-gray-500 hover:text-primary-500 transition-colors rounded-full hover:bg-primary-50"
                            title="Voir le profil"
                        >
                            👤
                        </button>
                        <button
                            onClick={() => activeChat && startCall(activeChat, 'audio')}
                            className="p-2 text-gray-500 hover:text-green-500 transition-colors rounded-full hover:bg-green-50"
                            title="Appel audio"
                        >
                            📞
                        </button>
                        <button
                            onClick={() => activeChat && startCall(activeChat, 'video')}
                            className="p-2 text-gray-500 hover:text-green-500 transition-colors rounded-full hover:bg-green-50"
                            title="Appel vidéo"
                        >
                            📹
                        </button>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
                            title="Rechercher"
                        >
                            🔍
                        </button>
                        <button
                            onClick={() => activeChat && clearChatHistory(activeChat)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            title="Effacer l'historique"
                        >
                            🗑️
                        </button>
                        <button
                            onClick={() => activeChat && exportChat(activeChat)}
                            className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
                            title="Exporter la conversation"
                        >
                            📤
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <MessageSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Résumé IA toujours visible en haut */}
            {preferences.autoSummarize && activeChat && (
                <div className="px-4 pt-4 z-10">
                    <ConversationSummary
                        messages={messages}
                        conversationId={activeChat}
                        participantName={displayName}
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.filter(m => (m.sender === activeChat || (m.sender === 'me' && activeChat)) && !m.isPendingAuth).map((msg, index, arr) => {
                    const isMe = msg.sender === 'me';
                    const nextMsg = arr[index + 1];

                    // Logique d'affichage du timestamp et de groupement
                    const isLast = !nextMsg;
                    const isDifferentSender = nextMsg && nextMsg.sender !== msg.sender;
                    const isTimeGap = nextMsg && (new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime() > 60000); // 1 minute

                    const showTimestamp = isLast || isDifferentSender || isTimeGap;
                    const marginBottom = showTimestamp ? 'mb-4' : 'mb-1';
                    const showAvatar = !isMe && showTimestamp;

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'} animate-fade-in-up ${marginBottom}`}>
                            {!isMe && (
                                <div className="w-8 h-8 flex-shrink-0">
                                    {showAvatar && (
                                        avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={displayName}
                                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                                                {displayName[0]?.toUpperCase()}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                            <div className={`max-w-[70%] shadow-lg rounded-3xl backdrop-blur-sm transition-all duration-300 ease-out animate-[slideUp_0.3s_ease-out] ${isMe
                                ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 ' + (showTimestamp ? 'rounded-br-md' : 'rounded-br-2xl')
                                : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 ' + (showTimestamp ? 'rounded-bl-md' : 'rounded-bl-2xl')
                                } ${msg.type === 'file' ? 'p-1 bg-none border-none shadow-none !bg-transparent' : 'px-6 py-3'}`}>
                                {msg.type === 'file' ? (
                                    <FileMessage message={msg} isMe={isMe} />
                                ) : (
                                    <div 
                                        className={`leading-relaxed break-words prose prose-sm max-w-none ${isMe ? 'text-white' : 'text-gray-800'}`}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }}
                                    />
                                )}
                                {showTimestamp && (
                                    <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-primary-100' : 'text-gray-400'} ${msg.type === 'file' ? 'pr-2' : ''}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && (
                                            <span className="ml-1 text-xs opacity-70 inline-flex items-center gap-0.5" title={msg.status}>
                                                {msg.status === 'pending' && '🕒'}
                                                {msg.status === 'sent' && '✓'}
                                                {msg.status === 'delivered' && '✓✓'}
                                                {msg.status === 'read' && <span className="text-blue-200 font-bold">✓✓</span>}
                                                {msg.status === 'refused' && <span className="text-red-300">🚫</span>}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />

                {/* Indicateur de frappe */}
                {typingText && (
                    <div className="flex justify-start animate-fade-in-up">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>

                                </div>
                                <span className="text-xs text-gray-500 italic">{typingText}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Suggestions IA */}
            {messages.length > 0 && isAISuggestionsEnabled && (
                <div className="px-4">
                    <AISuggestions
                        lastMessage={messages[messages.length - 1]?.content || ''}
                        messageContext={getMessageContext()}
                        onSuggestionSelect={handleSuggestionSelect}
                    />
                </div>
            )}

            {/* Input or Request */}
            {!isAuthorized && messages.some(m => m.sender === activeChat && m.isPendingAuth) ? (
                <div className="p-6 bg-white/80 border-t border-gray-200/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                        👋
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-gray-800">Nouvelle demande de conversation</h3>
                        <p className="text-gray-600 text-sm mt-1">
                            {activeUser?.username || 'Cet utilisateur'} souhaite discuter avec vous.
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => acceptAuth(activeChat!)}
                            className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform active:scale-95"
                        >
                            Toujours autoriser
                        </button>
                        <button
                            onClick={() => setIsTempAuthorized(true)}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Accepter (Session)
                        </button>
                        <button
                            onClick={() => rejectAuth(activeChat!)}
                            className="bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Refuser
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSend} className="p-4 bg-white/50 border-t border-gray-200/60 backdrop-blur-md">
                    {isRecipientDND && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start space-x-3 animate-fade-in">
                            <span className="text-xl">🚫</span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800 mb-1">Mode Ne pas déranger actif</p>
                                <p className="text-xs text-red-600">{displayName} a activé le mode Ne pas déranger. L'envoi de messages est temporairement désactivé.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 mb-2">
                        {isEncryptionEnabled ? (
                            <div className="flex items-center space-x-1 text-green-500 text-xs">
                                <span>🔒</span>
                                <span>Messages chiffrés de bout en bout</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-1 text-yellow-500 text-xs">
                                <span>⚠️</span>
                                <span>Messages non chiffrés</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 items-end">
                        {activeChat && (
                            <div className="flex items-center gap-2 mb-2">
                                <FileShareButton peerId={activeChat} />
                                <button
                                    onClick={toggleAISuggestions}
                                    className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                                        isAISuggestionsEnabled
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                            : 'bg-white border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300'
                                    }`}
                                    title={isAISuggestionsEnabled ? 'Désactiver les suggestions AI' : 'Activer les suggestions AI'}
                                >
                                    {isAISuggestionsEnabled ? '🤖' : '💡'}
                                </button>
                            </div>
                        )}
                        <RichTextMessageInput
                            value={inputValue}
                            onChange={handleInputChange}
                            onSubmit={() => {
                                if (!isMessageEmpty(inputValue) && !isRecipientDND) {
                                    handleSend({ preventDefault: () => {} } as React.FormEvent);
                                }
                            }}
                            placeholder={isRecipientDND ? `${displayName} est en mode Ne pas déranger` : "Écrivez votre message..."}
                            disabled={isRecipientDND}
                        />
                        <button
                            type="submit"
                            disabled={isMessageEmpty(inputValue) || isRecipientDND}
                            className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95 mb-2"
                            title={isRecipientDND ? `${displayName} est en mode Ne pas déranger` : "Envoyer (Enter)"}
                        >
                            Envoyer
                        </button>
                    </div>
                </form>
            )}

            {modalUser && (
                <UserProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={modalUser}
                    isOnline={!!activeUser}
                />
            )}
        </div>
    );
};

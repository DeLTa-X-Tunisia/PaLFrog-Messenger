import React, { useEffect, useState } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { databaseService } from '../../services/database.service';
import { useAuthStore } from '../../stores/auth.store';
import { ConfirmModal } from '../ui/ConfirmModal';
import { htmlToPlainText } from '../../utils/html-sanitizer';
import toast from 'react-hot-toast';

interface ChatPreview {
    id: string;
    participantId: string;
    participantName: string;
    lastMessage: string;
    lastActivity: Date;
    unreadCount: number;
    avatarUrl?: string;
}

export const ConversationList: React.FC = () => {
    const {
        activeChat,
        setActiveChat,
        onlineUsers,
        messages, // To trigger updates
        totalUnreadCount,
        clearChatHistory,
        exportChat,
        createPeerConnection
    } = useWebRTCStore();
    const { user: currentUser, setCurrentView } = useAuthStore();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const loadChats = async () => {
        const allChats = await databaseService.getAllChats();
        // Sort by unread count (desc) then date (desc)
        const sortedChats = allChats.sort((a, b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        });
        setChats(sortedChats);
    };

    useEffect(() => {
        loadChats();
        // Set up an interval or subscription if needed, 
        // but relying on 'messages' change in store might be enough if we trigger it right
    }, [messages, activeChat, totalUnreadCount]);

    const handleChatClick = async (chatId: string) => {
        setActiveChat(chatId);
        await createPeerConnection(chatId);
        setCurrentView('chat');
    };

    const handleDelete = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer la conversation',
            message: 'Voulez-vous vraiment supprimer cette conversation ?',
            onConfirm: async () => {
                try {
                    await clearChatHistory(chatId);
                    loadChats();
                    toast.success('Conversation supprimée');
                } catch (error) {
                    toast.error('Erreur lors de la suppression');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleExport = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        await exportChat(chatId);
        toast.success('Conversation exportée');
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={true}
            />
            <div className="p-4 border-b border-gray-200/60">
                <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {chats.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Aucune conversation
                    </div>
                )}
                {chats.map((chat) => {
                    const onlineUser = onlineUsers.find(u => u.userId === chat.participantId);
                    const isOnline = !!onlineUser;
                    const isActive = activeChat === chat.participantId;
                    const isUnread = chat.unreadCount > 0;

                    // Utiliser le nom de l'utilisateur en ligne s'il est disponible, sinon le nom stocké
                    const displayName = onlineUser?.username || chat.participantName;
                    const avatarUrl = onlineUser?.avatarUrl || chat.avatarUrl;

                    return (
                        <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat.participantId)}
                            className={`
                                w-full p-3 flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer group relative
                                ${isActive ? 'bg-primary-50 border border-primary-100 shadow-sm' : 'hover:bg-white hover:shadow-sm border border-transparent'}
                                ${isUnread ? 'bg-blue-50/50' : ''}
                            `}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-sm">
                                        {displayName[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className={`truncate text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {displayName}
                                    </h3>
                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                        {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`truncate text-xs mt-0.5 ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                    {(() => {
                                        try {
                                            // Tenter de parser si c'est un JSON (message fichier)
                                            if (chat.lastMessage.startsWith('{') && chat.lastMessage.includes('"type":')) {
                                                const parsed = JSON.parse(chat.lastMessage);
                                                if (parsed.type === 'file_offer' || parsed.type === 'file_metadata') {
                                                    return `📎 Fichier : ${parsed.name || 'Inconnu'}`;
                                                }
                                                if (parsed.type === 'encrypted_message') {
                                                    return '🔒 Message chiffré';
                                                }
                                            }
                                            // Convertir le HTML en texte brut pour l'aperçu
                                            return htmlToPlainText(chat.lastMessage);
                                        } catch {
                                            // Si erreur, convertir quand même le HTML en texte
                                            return htmlToPlainText(chat.lastMessage);
                                        }
                                    })()}
                                </p>
                            </div>

                            {/* Unread Badge */}
                            {isUnread && (
                                <div className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 shadow-sm">
                                    {chat.unreadCount}
                                </div>
                            )}

                            {/* Actions (Hover) */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg shadow-sm p-1">
                                <button
                                    onClick={(e) => handleExport(e, chat.participantId)}
                                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Exporter"
                                >
                                    📤
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, chat.participantId)}
                                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-red-600 transition-colors"
                                    title="Supprimer"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

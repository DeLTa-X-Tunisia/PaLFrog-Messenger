import React, { useEffect, useState } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { useAuthStore } from '../../stores/auth.store';
import { SecurityBadge } from '../security/SecurityBadge';
import { friendsService } from '../../services/friends.service';
import { chatService } from '../../services/chat.service';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { UserProfileModal } from './UserProfileModal';

export const ContactsList: React.FC = () => {
    const { onlineUsers, createPeerConnection, setActiveChat, activeChat } = useWebRTCStore();
    const { user: currentUser, setCurrentView } = useAuthStore();
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const loadFriends = async () => {
        try {
            const myFriends = await friendsService.getFriends();
            setFriends(myFriends);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };

    useEffect(() => {
        loadFriends();
    }, []);

    const handleMessage = async (userId: string) => {
        try {
            await chatService.createConversation([userId]);
            setActiveChat(userId);
            await createPeerConnection(userId);
            setCurrentView('chat');
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    };

    const handleRemove = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Retirer un ami',
            message: 'Voulez-vous vraiment retirer cet ami de votre liste ?',
            isDangerous: true,
            onConfirm: async () => {
                try {
                    await friendsService.removeFriend(userId);
                    loadFriends();
                    toast.success('Ami retiré');
                } catch (error) {
                    console.error('Error removing friend:', error);
                    toast.error('Erreur lors de la suppression');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleBlock = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Bloquer un utilisateur',
            message: 'Voulez-vous vraiment bloquer cet utilisateur ? Il ne pourra plus vous contacter.',
            isDangerous: true,
            onConfirm: async () => {
                try {
                    await friendsService.blockUser(userId);
                    loadFriends();
                    toast.success('Utilisateur bloqué');
                } catch (error) {
                    console.error('Error blocking user:', error);
                    toast.error('Erreur lors du blocage');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUnblock = async (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await friendsService.unblockUser(userId);
            loadFriends();
            toast.success('Utilisateur débloqué');
        } catch (error) {
            console.error('Error unblocking user:', error);
            toast.error('Erreur lors du déblocage');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmModal.isDangerous}
            />
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={selectedUser}
                isOnline={selectedUser ? onlineUsers.some(u => u.userId === selectedUser.id) : false}
            />
            <div className="p-4 border-b border-gray-200/60">
                <SecurityBadge />
                <h2 className="text-lg font-semibold text-gray-800">Mes Amis</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {friends.map((friendRelation) => {
                    const friend = friendRelation.friend;
                    const isBlocked = friendRelation.status === 'BLOCKED';
                    const onlineUser = onlineUsers.find(u => u.userId === friend.id);

                    // Determine status
                    const status = onlineUser ? (onlineUser.status || 'online') : 'offline';
                    // console.log(`Contact ${friend.username} status:`, status, onlineUser); // Debug log
                    const isOnline = status !== 'offline';

                    const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
                        online: { label: 'En ligne', color: 'bg-green-500', textColor: 'text-green-600' },
                        busy: { label: 'Occupé(e)', color: 'bg-red-500', textColor: 'text-red-600' },
                        away: { label: 'Absent(e)', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                        dnd: { label: 'Ne pas déranger', color: 'bg-red-600', textColor: 'text-red-700' },
                        offline: { label: 'Hors ligne', color: 'bg-gray-400', textColor: 'text-gray-400' },
                    };

                    const currentStatus = statusConfig[status] || statusConfig.offline;
                    const avatarUrl = onlineUser?.avatarUrl || friend.profile?.avatarUrl || friend.avatarUrl;

                    return (
                        <div
                            key={friend.id}
                            onDoubleClick={() => !isBlocked && handleMessage(friend.id)}
                            className={`w-full p-3 flex items-center justify-between rounded-xl transition-all duration-200 group cursor-pointer
              ${activeChat === friend.id
                                    ? 'bg-primary-50 border border-primary-100 shadow-sm'
                                    : 'hover:bg-white hover:shadow-sm border border-transparent'
                                }
              ${isBlocked ? 'opacity-75 bg-gray-50' : ''}
            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={friend.username}
                                            className={`w-10 h-10 rounded-full object-cover shadow-md transition-transform ${isBlocked ? 'grayscale' : 'group-hover:scale-105'}`}
                                        />
                                    ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-transform ${isBlocked
                                            ? 'bg-gray-400'
                                            : 'bg-gradient-to-br from-primary-500 to-accent-500 group-hover:scale-105'
                                            }`}>
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    {!isBlocked && isOnline && (
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${currentStatus.color} border-2 border-white`}></div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 flex items-center gap-2">
                                        {friend.username}
                                        {isBlocked && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-bold uppercase tracking-wider">Bloqué</span>}
                                    </div>
                                    <div className={`text-xs font-medium ${isBlocked
                                        ? 'text-orange-500'
                                        : currentStatus.textColor
                                        }`}>
                                        {isBlocked ? 'Bloqué' : currentStatus.label}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isBlocked && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMessage(friend.id); }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Envoyer un message"
                                        >
                                            ✉️
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUser(friend);
                                                setIsProfileOpen(true);
                                            }}
                                            className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Voir profil"
                                        >
                                            👤
                                        </button>
                                    </>
                                )}
                                {isBlocked && (
                                    <button
                                        onClick={(e) => handleUnblock(friend.id, e)}
                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Débloquer"
                                    >
                                        🔓
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleRemove(friend.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Retirer des amis"
                                >
                                    ❌
                                </button>
                                {!isBlocked && (
                                    <button
                                        onClick={(e) => handleBlock(friend.id, e)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Bloquer"
                                    >
                                        🚫
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}

                {friends.length === 0 && (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-3">👥</div>
                        <p className="text-gray-500 text-sm">Vous n'avez pas encore d'amis.</p>
                        <button
                            onClick={() => setCurrentView('friend-search')}
                            className="text-xs text-primary-500 mt-2 hover:underline hover:text-primary-600 transition-colors"
                        >
                            Utilisez l'onglet "Ajout" pour en trouver !
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

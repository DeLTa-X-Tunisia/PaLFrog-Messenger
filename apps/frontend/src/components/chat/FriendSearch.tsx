import React, { useState, useEffect } from 'react';
import { friendsService, User } from '../../services/friends.service';
import { chatService } from '../../services/chat.service';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { UserProfileModal } from './UserProfileModal';

export const FriendSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { createPeerConnection, setActiveChat, onlineUsers } = useWebRTCStore();
    const { setCurrentView } = useAuthStore();
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

    const loadUsers = async (searchQuery: string) => {
        setLoading(true);
        try {
            const results = await friendsService.searchUsers(searchQuery);
            setUsers(results);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Charger tous les utilisateurs au démarrage
        loadUsers('');
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadUsers(query);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleAddFriend = async (userId: string) => {
        try {
            await friendsService.addFriend(userId);
            // Recharger la liste pour mettre à jour les statuts
            loadUsers(query);
            toast.success('Ami ajouté avec succès !');
        } catch (error) {
            toast.error('Erreur lors de l\'ajout de l\'ami');
        }
    };

    const handleBlockUser = (userId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Bloquer un utilisateur',
            message: 'Voulez-vous vraiment bloquer cet utilisateur ?',
            isDangerous: true,
            onConfirm: async () => {
                try {
                    await friendsService.blockUser(userId);
                    loadUsers(query);
                    toast.success('Utilisateur bloqué');
                } catch (error) {
                    toast.error('Erreur lors du blocage');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUnblockUser = async (userId: string) => {
        try {
            await friendsService.unblockUser(userId);
            loadUsers(query);
            toast.success('Utilisateur débloqué');
        } catch (error) {
            toast.error('Erreur lors du déblocage');
        }
    };

    const handleMessage = async (userId: string) => {
        try {
            // Créer ou récupérer la conversation côté backend
            await chatService.createConversation([userId]);

            // Configurer le chat et la vue
            setActiveChat(userId);
            await createPeerConnection(userId);
            setCurrentView('chat');
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            // On essaie quand même d'ouvrir le chat
            setActiveChat(userId);
            setCurrentView('chat');
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
            <div className="p-4 border-b border-gray-200/60">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Rechercher un ami</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Nom d'utilisateur ou email..."
                        value={query}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loading && <div className="text-center p-4 text-gray-500">Chargement...</div>}

                {!loading && users.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Aucun utilisateur trouvé
                        <p className="text-xs mt-2 text-gray-400">(Vous ne pouvez pas vous rechercher vous-même)</p>
                    </div>
                )}

                {users.map((user) => {
                    const onlineUser = onlineUsers.find(u => u.userId === user.id);
                    const avatarUrl = onlineUser?.avatarUrl || user.avatarUrl;

                    return (
                        <div
                            key={user.id}
                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                            onDoubleClick={() => handleMessage(user.id)}
                        >
                            <div className="flex items-center gap-3">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="font-medium text-gray-800">{user.username}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUser(user);
                                        setIsProfileOpen(true);
                                    }}
                                    className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Voir profil"
                                >
                                    👤
                                </button>

                                {user.friendStatus === 'ACCEPTED' ? (
                                    <button
                                        onClick={() => handleMessage(user.id)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Envoyer un message"
                                    >
                                        ✉️
                                    </button>
                                ) : user.friendStatus === 'BLOCKED' ? (
                                    <button
                                        onClick={() => handleUnblockUser(user.id)}
                                        className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                                        title="Débloquer cet utilisateur"
                                    >
                                        Débloquer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAddFriend(user.id)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Ajouter aux amis"
                                    >
                                        ➕
                                    </button>
                                )}

                                {user.friendStatus !== 'BLOCKED' && (
                                    <button
                                        onClick={() => handleBlockUser(user.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Bloquer"
                                    >
                                        🚫
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={selectedUser}
                isOnline={selectedUser ? onlineUsers.some(u => u.userId === selectedUser.id) : false}
            />
        </div>
    );
};

import { create } from 'zustand';
// Note: groupManager à implémenter dans services/managers.ts si nécessaire
import { persist } from 'zustand/middleware';

interface GroupMember {
    userId: string;
    username: string;
    role: 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
    joinedAt: Date;
}

interface Group {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    members: GroupMember[];
    settings: {
        encryption: boolean;
        fileSharing: boolean;
        joinPermission: 'open' | 'approval' | 'invite';
    };
    createdAt: Date;
    updatedAt: Date;
}

interface GroupMessage {
    id: string;
    groupId: string;
    senderId: string;
    content: string;
    type: 'text' | 'file' | 'system';
    timestamp: Date;
    encrypted: boolean;
}

interface GroupState {
    groups: Map<string, Group>;
    groupMessages: Map<string, GroupMessage[]>;
    activeGroup: string | null;

    // Actions
    createGroup: (name: string, description: string, settings: Group['settings']) => Promise<void>;
    joinGroup: (groupId: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    sendGroupMessage: (groupId: string, content: string) => Promise<void>;
    addGroupMember: (groupId: string, userId: string, role?: GroupMember['role']) => Promise<void>;
    removeGroupMember: (groupId: string, userId: string) => Promise<void>;
    setActiveGroup: (groupId: string | null) => void;
}

export const useGroupStore = create<GroupState>()(
    persist(
        (set, get) => ({
            groups: new Map(),
            groupMessages: new Map(),
            activeGroup: null,

            createGroup: async (name, description, settings) => {
                const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const newGroup: Group = {
                    id: groupId,
                    name,
                    description,
                    creatorId: 'current-user-id', // À remplacer par l'ID réel
                    members: [{
                        userId: 'current-user-id',
                        username: 'current-username',
                        role: 'OWNER',
                        joinedAt: new Date()
                    }],
                    settings,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                set((state) => {
                    const updatedGroups = new Map(state.groups);
                    updatedGroups.set(groupId, newGroup);
                    return { groups: updatedGroups };
                });

                // TODO: Implémenter groupManager dans services/managers.ts
                // await managers.group.createGroup(groupId);
            },

            joinGroup: async (groupId: string) => {
                // Implémentation de la logique pour rejoindre un groupe
            },

            leaveGroup: async (groupId: string) => {
                // Implémentation de la logique pour quitter un groupe
            },

            addGroupMember: async (groupId: string, userId: string, role?: GroupMember['role']) => {
                // Implémentation de la logique pour ajouter un membre
            },

            removeGroupMember: async (groupId: string, userId: string) => {
                // Implémentation de la logique pour supprimer un membre
            },

            sendGroupMessage: async (groupId, content) => {
                const { groupMessages } = get();

                const message: GroupMessage = {
                    id: `group-msg-${Date.now()}`,
                    groupId,
                    senderId: 'current-user-id',
                    content,
                    type: 'text',
                    timestamp: new Date(),
                    encrypted: true
                };

                // Ajouter localement
                const updatedMessages = new Map(groupMessages);
                const groupMsgs = updatedMessages.get(groupId) || [];
                groupMsgs.push(message);
                updatedMessages.set(groupId, groupMsgs);

                set({ groupMessages: updatedMessages });

                // TODO: Implémenter groupManager dans services/managers.ts
                // await managers.group.sendGroupMessage(groupId, content);
            },

            setActiveGroup: (groupId) => {
                set({ activeGroup: groupId });
            }
        }),
        {
            name: 'group-storage',
        }
    )
);

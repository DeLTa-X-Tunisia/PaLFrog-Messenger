import { useAuthStore } from './auth.store';
import { useWebRTCStore } from './webrtc.store';
import { useCallStore } from './call.store';
import { useFileTransferStore } from './file-transfer.store';
import { shallow } from 'zustand/shallow';

// Selecteurs optimisés pour éviter les re-renders inutiles
export const useAuthUser = () =>
    useAuthStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }), shallow);

export const useActiveChat = () =>
    useWebRTCStore(state => ({
        activeChat: state.activeChat,
        messages: state.messages,
        encryptionStatus: state.encryptionStatus
    }), shallow);

export const useCallState = () =>
    useCallStore(state => ({
        currentCall: state.currentCall,
        localStream: state.localStream,
        remoteStream: state.remoteStream
    }), shallow);

export const useActiveTransfers = () =>
    useFileTransferStore(state => {
        const transfers = Array.from(state.transfers.values());
        return {
            activeTransfers: transfers.filter(t =>
                t.status === 'pending' || t.status === 'transferring'
            ),
            completedTransfers: transfers.filter(t =>
                t.status === 'completed' || t.status === 'failed'
            )
        };
    }, shallow);

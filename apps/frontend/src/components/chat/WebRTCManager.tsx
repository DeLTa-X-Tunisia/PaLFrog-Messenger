import React, { useEffect } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { socketService } from '../../services/socket.service';
import { useAuthStore } from '../../stores/auth.store';

export const WebRTCManager: React.FC = () => {
    const { initializeWebRTC } = useWebRTCStore();
    const { user } = useAuthStore();
    const userId = user?.id;

    useEffect(() => {
        if (userId) {
            initializeWebRTC();
            socketService.connect();
        }

        return () => {
            socketService.disconnect();
        };
    }, [userId, initializeWebRTC]);

    return null;
};

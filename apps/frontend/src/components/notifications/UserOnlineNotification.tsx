import React, { useEffect, useState } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { useAuthStore } from '../../stores/auth.store';

export const UserOnlineNotification: React.FC = () => {
    const { onlineNotification, hideOnlineNotification, setActiveChat, onlineUsers } = useWebRTCStore();
    const { setCurrentView } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (onlineNotification) {
            setIsVisible(true);

            // Jouer un son doux (généré via Web Audio API)
            playOnlineSound();

            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(hideOnlineNotification, 500); // Attendre la fin de l'animation
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [onlineNotification, hideOnlineNotification]);

    const playOnlineSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio play failed', e);
        }
    };

    const handleClick = () => {
        console.log('Notification clicked', onlineNotification);
        if (onlineNotification) {
            // Priorité à l'ID utilisateur s'il est disponible
            if (onlineNotification.userId) {
                console.log('Opening chat with userId:', onlineNotification.userId);
                setActiveChat(onlineNotification.userId);
                setCurrentView('chat');
                setIsVisible(false);
                setTimeout(hideOnlineNotification, 300);
                return;
            }

            // Fallback : recherche par nom d'utilisateur
            console.log('Searching user by username:', onlineNotification.username);
            const user = onlineUsers.find(u => u.username === onlineNotification.username);
            if (user) {
                console.log('Found user:', user.userId);
                setActiveChat(user.userId);
                setCurrentView('chat');
                setIsVisible(false);
                setTimeout(hideOnlineNotification, 300);
            } else {
                console.warn('User not found for notification click');
            }
        }
    };

    if (!onlineNotification && !isVisible) return null;

    const status = onlineNotification?.status || 'online';
    console.log('🎨 UserOnlineNotification: Rendering with data:', {
        username: onlineNotification?.username,
        status: status,
        rawNotification: onlineNotification
    });

    const statusConfig: Record<string, { label: string; badgeLabel: string; color: string; textColor: string; message: string; ringColor: string }> = {
        online: {
            label: 'est en ligne',
            badgeLabel: 'En ligne',
            color: 'bg-green-500',
            textColor: 'text-green-700',
            message: 'Cliquez pour discuter !',
            ringColor: 'ring-green-500'
        },
        busy: {
            label: 'est occupé(e)',
            badgeLabel: 'Occupé',
            color: 'bg-red-500',
            textColor: 'text-red-700',
            message: 'Revenez plus tard.',
            ringColor: 'ring-red-500'
        },
        away: {
            label: 'est absent(e)',
            badgeLabel: 'Absent',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-700',
            message: 'Peut ne pas répondre.',
            ringColor: 'ring-yellow-500'
        },
        dnd: {
            label: 'ne veut pas être dérangé(e)',
            badgeLabel: 'DND',
            color: 'bg-red-600',
            textColor: 'text-red-800',
            message: 'Ne pas déranger.',
            ringColor: 'ring-red-600'
        },
        offline: {
            label: 'est hors ligne',
            badgeLabel: 'Hors ligne',
            color: 'bg-gray-400',
            textColor: 'text-gray-600',
            message: '',
            ringColor: 'ring-gray-400'
        },
    };

    const currentStatus = statusConfig[status] || statusConfig.online;

    return (
        <div
            onClick={handleClick}
            className={`fixed top-24 right-6 z-[100] transition-all duration-500 ease-out cursor-pointer transform
                ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}
            `}
        >
            <div className={`
                bg-white/90 backdrop-blur-xl 
                px-6 py-4 rounded-2xl shadow-2xl 
                border border-white/50
                flex items-center gap-4 
                hover:shadow-3xl hover:translate-y-1 hover:scale-[1.02] 
                active:scale-95
                transition-all duration-300 group
                max-w-sm w-full
            `}>
                <div className="relative flex-shrink-0">
                    <div className={`w-4 h-4 ${currentStatus.color} rounded-full animate-ping absolute top-0 left-0 opacity-50`}></div>
                    <div className={`w-4 h-4 ${currentStatus.color} rounded-full relative z-10 ring-2 ring-white shadow-sm`}></div>
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 truncate text-base">
                            {onlineNotification?.username}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentStatus.color} ${currentStatus.textColor} bg-opacity-20`}>
                            {currentStatus.badgeLabel}
                        </span>
                    </div>
                    <span className={`text-sm ${currentStatus.textColor} font-medium mt-0.5 truncate`}>
                        {onlineNotification?.username} {currentStatus.label}
                    </span>
                </div>

                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

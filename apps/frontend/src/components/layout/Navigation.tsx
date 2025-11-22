import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useSubscriptionStore } from '../../stores/subscription.store';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { UserGuide } from '../help/UserGuide';

const navigationItems = [
    { id: 'chat', icon: '💬', label: 'Messages' },
    { id: 'contacts', icon: '👥', label: 'Contacts' },
    { id: 'friend-search', icon: '🔍', label: 'Recherche amis' },
    { id: 'bridge', icon: '🌉', label: 'Bridges' },
    { id: 'social', icon: '🎮', label: 'Arcade' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'security', icon: '🛡️', label: 'Sécurité' },
    { id: 'settings', icon: '⚙️', label: 'Paramètres' },
];

export const Navigation: React.FC = () => {
    const { ui, setCurrentView, user } = useAuthStore();
    const { currentTier } = useSubscriptionStore();
    const { totalUnreadCount, updateUnreadCount } = useWebRTCStore();

    useEffect(() => {
        updateUnreadCount();
    }, []);

    return (
        <nav className="h-full bg-white/90 backdrop-blur-md border-r border-gray-200/60 shadow-sm flex flex-col">
            {/* Logo étendu */}
            <div className="p-4 border-b border-gray-200/60">
                <div className={`flex items-center space-x-3 transition-all duration-300 ${ui.sidebarOpen ? 'opacity-100' : 'lg:opacity-0 xl:opacity-100'}`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-400 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-primary-600 bg-clip-text text-transparent">
                            Palfrog
                        </h2>
                        <p className="text-xs text-gray-500">Connectez-vous librement</p>
                    </div>
                </div>
            </div>

            {/* Menu navigation */}
            <div className="flex-1 py-4 px-3 space-y-1">
                {navigationItems.map((item) => {
                    const notificationCount = item.id === 'chat' ? totalUnreadCount : 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id as any)}
                            className={`
              w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group relative
              ${ui.currentView === item.id
                                    ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
            `}
                        >
                            <div className="relative flex items-center justify-center">
                                <span className="text-lg transform group-hover:scale-110 transition-transform duration-200">
                                    {item.icon}
                                </span>
                                {notificationCount > 0 && (
                                    <span className={`
                                    absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white
                                    transition-all duration-300 
                                    ${ui.sidebarOpen ? 'opacity-0 scale-0' : 'lg:opacity-100 lg:scale-100 xl:opacity-0 xl:scale-0'}
                                `} />
                                )}
                            </div>

                            <span className={`font-medium text-sm transition-all duration-300 ${ui.sidebarOpen ? 'opacity-100' : 'lg:opacity-0 xl:opacity-100'}`}>
                                {item.label}
                            </span>

                            {notificationCount > 0 && (
                                <span className={`
                                ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center shadow-sm
                                transition-all duration-300 ${ui.sidebarOpen ? 'opacity-100' : 'lg:opacity-0 xl:opacity-100'}
                            `}>
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Upgrade Banner - Moved to Settings */}
        </nav>
    );
};

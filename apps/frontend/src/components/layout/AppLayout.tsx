import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAuthStore } from '../../stores/auth.store';
import { UserOnlineNotification } from '../notifications/UserOnlineNotification';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { ui } = useAuthStore();

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
            <UserOnlineNotification />

            {/* Navigation latérale animée */}
            <div className={`
        fixed lg:relative z-40 transform transition-all duration-300 ease-in-out
        ${ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 lg:w-20 xl:w-80
      `}>
                <Navigation />
            </div>

            {/* Overlay mobile */}
            {ui.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => useAuthStore.getState().toggleSidebar()}
                />
            )}

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-hidden transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
};

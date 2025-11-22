import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { HeaderLanguageSelector } from './HeaderLanguageSelector';
import { UserStatusSelector } from './UserStatusSelector';
import { UserProfileModal } from '../chat/UserProfileModal';
import { UserGuide } from '../help/UserGuide';

export const Header: React.FC = () => {
    const { user, logout, ui, toggleSidebar } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm relative z-30">
            {user && (
                <UserProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={user}
                    isOnline={true}
                />
            )}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Bouton menu mobile */}
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo et titre */}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-400 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-primary-600 bg-clip-text text-transparent">
                            Palfrog
                        </h1>
                        <HeaderLanguageSelector />
                    </div>

                    {/* User menu */}
                    {user && (
                        <div className="flex items-center space-x-4">
                            <UserGuide trigger={
                                <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-600 transition-all duration-200" title="Guide d'utilisation">
                                    <span className="font-bold text-xl">?</span>
                                </div>
                            } />
                            <UserStatusSelector />
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                                </div>
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                </button>

                                {/* Dropdown menu */}
                                <div className="absolute right-0 top-12 w-48 py-2 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={() => setIsProfileOpen(true)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-150"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Mon Profil</span>
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-150"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Déconnexion</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';

type UserStatus = 'online' | 'busy' | 'away' | 'dnd' | 'offline';

const STATUS_CONFIG: Record<UserStatus, { label: string; icon: string; color: string }> = {
    online: { label: 'En ligne', icon: '🟢', color: 'text-green-500' },
    busy: { label: 'Occupé(e)', icon: '🔴', color: 'text-red-500' },
    away: { label: 'Absent(e)', icon: '🟡', color: 'text-yellow-500' },
    dnd: { label: 'Ne pas déranger', icon: '🚫', color: 'text-red-600' },
    offline: { label: 'Hors ligne', icon: '⚫', color: 'text-gray-500' },
};

export const UserStatusSelector: React.FC = () => {
    const { user, setStatus } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentStatus = (user?.status as UserStatus) || 'online';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleStatusChange = (status: UserStatus) => {
        setStatus(status);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 border border-transparent hover:border-gray-200"
                title="Changer de statut"
            >
                <span className="text-lg leading-none">{STATUS_CONFIG[currentStatus].icon}</span>
                <span className={`text-sm font-medium hidden md:block ${STATUS_CONFIG[currentStatus].color}`}>
                    {STATUS_CONFIG[currentStatus].label}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                    <div className="py-1">
                        {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-gray-50 transition-colors duration-150
                                    ${currentStatus === status ? 'bg-blue-50/50' : ''}
                                `}
                            >
                                <span className="text-lg">{STATUS_CONFIG[status].icon}</span>
                                <span className={`font-medium ${currentStatus === status ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {STATUS_CONFIG[status].label}
                                </span>
                                {currentStatus === status && (
                                    <span className="ml-auto text-blue-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

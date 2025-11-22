import React from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';

interface ConversationAuthToggleProps {
    userId: string;
}

export const ConversationAuthToggle: React.FC<ConversationAuthToggleProps> = ({ userId }) => {
    const { authorizedUsers, authorizeUser, unauthorizeUser } = useWebRTCStore();
    const isAuthorized = authorizedUsers.includes(userId);

    const handleToggle = () => {
        if (isAuthorized) {
            unauthorizeUser(userId);
        } else {
            authorizeUser(userId);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">
                {isAuthorized ? 'Autorisé' : 'Non autorisé'}
            </span>
            <button
                onClick={handleToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isAuthorized ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                title={isAuthorized ? 'Désactiver l\'autorisation' : 'Autoriser la conversation'}
            >
                <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${isAuthorized ? 'translate-x-5' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
};

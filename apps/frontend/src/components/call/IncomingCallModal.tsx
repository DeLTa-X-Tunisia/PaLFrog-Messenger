import React from 'react';
import { useCallStore } from '../../stores/call.store';
import { useWebRTCStore } from '../../stores/webrtc.store';

export const IncomingCallModal: React.FC = () => {
    const { currentCall, acceptCall, rejectCall } = useCallStore();
    const { onlineUsers } = useWebRTCStore();

    // Ne pas afficher si pas d'appel, si ce n'est pas un appel entrant, ou si l'appel est déjà accepté (actif)
    if (!currentCall || currentCall.direction !== 'incoming' || currentCall.status === 'active') {
        return null;
    }

    // Récupérer le nom d'utilisateur lisible au lieu de l'UUID
    const caller = onlineUsers.find(u => u.userId === currentCall.peerId);
    const callerName = caller?.username || 'Utilisateur';
    const callerInitial = callerName.charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl text-white font-semibold">
                        {callerInitial}
                    </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Appel {currentCall.type === 'audio' ? 'audio' : 'vidéo'} entrant
                </h2>

                <p className="text-gray-600 mb-6">
                    📞 {callerName} vous appelle
                </p>

                <div className="flex justify-center space-x-6">
                    {/* Bouton Refuser */}
                    <button
                        onClick={rejectCall}
                        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Bouton Accepter */}
                    <button
                        onClick={() => acceptCall(currentCall.peerId)}
                        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-200 transform hover:scale-110"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCallStore } from '../../stores/call.store';
import { useWebRTCStore } from '../../stores/webrtc.store';
import { friendsService } from '../../services/friends.service';
import { isElectron } from '../../utils/environment';
import { fetchScreenCaptureSources, type ScreenCaptureSource } from '../../utils/screenCapture';
import { ScreenShareSourcePicker } from './ScreenShareSourcePicker';

type ViewMode = 'minimized' | 'normal' | 'fullscreen';

export const CallInterface: React.FC = () => {
    const {
        currentCall,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoOff,
        isScreenSharing,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    } = useCallStore();

    const { onlineUsers } = useWebRTCStore();
    const [peerName, setPeerName] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('normal');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
    const [isLoadingSources, setIsLoadingSources] = useState(false);
    const [screenSources, setScreenSources] = useState<ScreenCaptureSource[]>([]);
    const [sourceError, setSourceError] = useState<string | null>(null);
    const [viewport, setViewport] = useState(() => (typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1280, height: 720 }));

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const hasCenteredPosition = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (viewMode === 'normal') {
            hasCenteredPosition.current = false;
        }
    }, [viewMode]);

    const containerDimensions = useMemo(() => {
        if (viewMode !== 'normal') {
            return null;
        }

        const margin = 32;
        const targetAspect = 16 / 9;

        const availableWidth = Math.max(1, viewport.width - margin);
        const availableHeight = Math.max(1, viewport.height - margin);

        const maxWidth = Math.min(availableWidth, 960);
        const maxHeight = Math.min(availableHeight, 720);

        const minWidth = Math.min(320, maxWidth);
        const minHeight = Math.min(240, maxHeight);

        let width = maxWidth;
        let height = width / targetAspect;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * targetAspect;
        }

        if (width < minWidth) {
            width = minWidth;
            height = width / targetAspect;
        }

        if (height < minHeight) {
            height = minHeight;
            width = Math.min(height * targetAspect, maxWidth);
        }

        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);

        return { width, height };
    }, [viewport, viewMode]);

    useEffect(() => {
        if (viewMode !== 'normal' || !containerDimensions) {
            return;
        }

        if (!hasCenteredPosition.current) {
            const { width, height } = containerDimensions;
            const centeredX = Math.max(16, (viewport.width - width) / 2);
            const centeredY = Math.max(16, (viewport.height - height) / 2);
            setPosition({ x: centeredX, y: centeredY });
            hasCenteredPosition.current = true;
            return;
        }

        const margin = 16;
        setPosition((prev) => {
            const maxX = Math.max(margin, viewport.width - containerDimensions.width - margin);
            const maxY = Math.max(margin, viewport.height - containerDimensions.height - margin);

            return {
                x: Math.min(Math.max(prev.x, margin), maxX),
                y: Math.min(Math.max(prev.y, margin), maxY),
            };
        });
    }, [containerDimensions, viewport, viewMode]);

    const loadScreenSources = useCallback(async () => {
        setIsLoadingSources(true);
        setSourceError(null);

        try {
            const sources = await fetchScreenCaptureSources();
            setScreenSources(sources);

            if (sources.length === 0) {
                setSourceError("Aucune source n'a été détectée. Essayez d'actualiser ou de vérifier vos permissions.");
            }
        } catch (error) {
            console.error('Failed to fetch screen capture sources', error);
            setScreenSources([]);
            setSourceError('Impossible de récupérer les sources disponibles.');
        } finally {
            setIsLoadingSources(false);
        }
    }, []);

    useEffect(() => {
        if (!isSourcePickerOpen) {
            return;
        }

        loadScreenSources();
    }, [isSourcePickerOpen, loadScreenSources]);

    useEffect(() => {
        if (!isSourcePickerOpen) {
            setSourceError(null);
        }
    }, [isSourcePickerOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (viewMode !== 'normal') return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || viewMode !== 'normal') {
            return;
        }

        const margin = 16;
        const dims = containerDimensions || { width: 640, height: 480 };
        const maxX = Math.max(margin, viewport.width - dims.width - margin);
        const maxY = Math.max(margin, viewport.height - dims.height - margin);

        setPosition({
            x: Math.min(Math.max(e.clientX - dragOffset.x, margin), maxX),
            y: Math.min(Math.max(e.clientY - dragOffset.y, margin), maxY)
        });
    }, [isDragging, dragOffset, viewMode, containerDimensions, viewport]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const resolvePeerName = async () => {
            if (!currentCall?.peerId) return;

            // 1. Chercher dans les utilisateurs en ligne
            const onlineUser = onlineUsers.find(u => u.userId === currentCall.peerId);
            if (onlineUser) {
                setPeerName(onlineUser.username);
                return;
            }

            // 2. Chercher dans la liste d'amis
            try {
                const friends = await friendsService.getFriends();
                const friendRelation = friends.find((f: any) => f.friend.id === currentCall.peerId);
                if (friendRelation) {
                    setPeerName(friendRelation.friend.username);
                    return;
                }
            } catch (error) {
                console.warn('Failed to fetch friends for name resolution', error);
            }

            // 3. Fallback sur l'ID si rien trouvé
            setPeerName(currentCall.peerId);
        };

        resolvePeerName();
    }, [currentCall?.peerId, onlineUsers]);

    useEffect(() => {
        if (localVideoRef.current && localStream && !isVideoOff) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoOff]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => { });

            const handleUnmute = () => {
                remoteVideoRef.current?.play().catch(() => { });
            };

            remoteStream.getVideoTracks().forEach(track => {
                track.addEventListener('unmute', handleUnmute);
            });

            return () => {
                remoteStream.getVideoTracks().forEach(track => {
                    track.removeEventListener('unmute', handleUnmute);
                });
            };
        }
    }, [remoteStream]);

    const handleScreenShareClick = useCallback(async () => {
        if (isScreenSharing) {
            try {
                await toggleScreenShare();
            } catch (error) {
                console.error('Failed to stop screen sharing', error);
            }
            return;
        }

        if (!isElectron()) {
            try {
                await toggleScreenShare();
            } catch (error) {
                console.error('Screen share failed:', error);
            }
            return;
        }

        setIsSourcePickerOpen(true);
    }, [isScreenSharing, toggleScreenShare]);

    const handleSourceSelect = useCallback(async (sourceId: string) => {
        setIsSourcePickerOpen(false);
        try {
            await toggleScreenShare(sourceId);
        } catch (error) {
            console.error('Screen share failed:', error);
        }
    }, [toggleScreenShare]);

    if (!currentCall) return null;

    const getCallDuration = () => {
        if (!currentCall.startTime) return '00:00';

        const now = currentCall.endTime || new Date();
        const diff = Math.floor((now.getTime() - currentCall.startTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const getContainerStyle = () => {
        if (viewMode === 'fullscreen') {
            return { top: '1rem', right: '1rem', bottom: '1rem', left: '1rem' };
        }

        if (viewMode === 'minimized') {
            return { bottom: '1rem', right: '1rem', width: '320px', height: '180px' };
        }

        const fallbackWidth = 640;
        const fallbackHeight = 480;
        const { width, height } = containerDimensions || { width: fallbackWidth, height: fallbackHeight };

        return {
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${width}px`,
            height: `${height}px`,
        };
    };

    return (
        <>
            <ScreenShareSourcePicker
                isOpen={isSourcePickerOpen}
                isLoading={isLoadingSources}
                sources={screenSources}
                error={sourceError}
                onSelect={handleSourceSelect}
                onRefresh={loadScreenSources}
                onCancel={() => setIsSourcePickerOpen(false)}
            />

            {/* Overlay sombre uniquement en mode normal/fullscreen pour focus, mais optionnel */}
            {viewMode !== 'minimized' && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            )}

            <div
                ref={windowRef}
                className={`fixed z-50 bg-gray-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out border border-gray-700
                    ${viewMode === 'fullscreen' ? 'rounded-none' : 'rounded-2xl'}
                `}
                style={getContainerStyle()}
            >
                {/* Header / Drag Handle */}
                <div
                    className={`absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start p-4 ${viewMode === 'normal' ? 'cursor-move' : ''}`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentCall.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                        <span className="text-white text-sm font-medium shadow-black drop-shadow-md">
                            {currentCall.status === 'active' ? getCallDuration() : 'Connexion...'}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'minimized' ? 'normal' : 'minimized')}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={viewMode === 'minimized' ? "Agrandir" : "Réduire"}
                        >
                            {viewMode === 'minimized' ? '↗️' : '🔽'}
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'fullscreen' ? 'normal' : 'fullscreen')}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={viewMode === 'fullscreen' ? "Quitter plein écran" : "Plein écran"}
                        >
                            {viewMode === 'fullscreen' ? '↙️' : '⛶'}
                        </button>
                    </div>
                </div>

                {/* Vidéo distante */}
                <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                    {currentCall.type === 'video' && remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            className="max-h-full max-w-full w-auto h-auto object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="text-center text-white">
                                <div className={`bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${viewMode === 'minimized' ? 'w-12 h-12' : 'w-24 h-24'}`}>
                                    <span className={`${viewMode === 'minimized' ? 'text-xl' : 'text-3xl'} font-bold`}>
                                        {peerName ? peerName.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                {viewMode !== 'minimized' && (
                                    <>
                                        <h3 className="text-2xl font-bold mb-1">{peerName || 'Utilisateur inconnu'}</h3>
                                        <p className="text-gray-400 text-sm uppercase tracking-wider font-medium">
                                            Appel {currentCall.type === 'audio' ? 'audio' : 'vidéo'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vidéo locale (PIP) */}
                    {currentCall.type === 'video' && localStream && !isVideoOff && (
                        <div className={`absolute bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300
                            ${viewMode === 'minimized' ? 'bottom-2 right-2 w-20 h-14' : 'bottom-4 right-4 w-48 h-36'}
                        `}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        </div>
                    )}
                </div>

                {/* Contrôles d'appel (Masqués en mode réduit) */}
                {viewMode !== 'minimized' && (
                    <div className="bg-gray-800/90 backdrop-blur-md p-4 border-t border-gray-700">
                        <div className="flex flex-wrap justify-center gap-4">
                            {/* Micro */}
                            <button
                                onClick={toggleAudio}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isAudioMuted
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                            >
                                {isAudioMuted ? (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>

                            {/* Caméra */}
                            {currentCall.type === 'video' && (
                                <button
                                    onClick={toggleVideo}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isVideoOff
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-gray-600 hover:bg-gray-500'
                                        }`}
                                >
                                    {isVideoOff ? (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Partage d'écran */}
                            {currentCall.type === 'video' && (
                                <button
                                    onClick={handleScreenShareClick}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isScreenSharing
                                        ? 'bg-blue-500 hover:bg-blue-600'
                                        : 'bg-gray-600 hover:bg-gray-500'
                                        }`}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                    </svg>
                                </button>
                            )}

                            {/* Raccrocher */}
                            <button
                                onClick={endCall}
                                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 transform hover:scale-110 shadow-lg"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

import React from 'react';
import type { ScreenCaptureSource } from '../../utils/screenCapture';

interface ScreenShareSourcePickerProps {
    isOpen: boolean;
    isLoading: boolean;
    sources: ScreenCaptureSource[];
    error?: string | null;
    onSelect: (sourceId: string) => void;
    onRefresh: () => void;
    onCancel: () => void;
}

export const ScreenShareSourcePicker: React.FC<ScreenShareSourcePickerProps> = ({
    isOpen,
    isLoading,
    sources,
    error,
    onSelect,
    onRefresh,
    onCancel,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Choisir une source à partager</h2>
                        <p className="text-sm text-gray-500">Sélectionnez un écran ou une fenêtre avant de démarrer le partage.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                        >
                            Actualiser
                        </button>
                        <button
                            onClick={onCancel}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                            {error}
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                            Aucune source disponible. Essayez d'actualiser ou vérifiez vos permissions.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sources.map((source) => (
                                <button
                                    key={source.id}
                                    onClick={() => onSelect(source.id)}
                                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary-400 hover:shadow-lg"
                                >
                                    <div className="relative aspect-video w-full bg-gray-200">
                                        {source.thumbnailUrl ? (
                                            <img
                                                src={source.thumbnailUrl}
                                                alt={source.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400">
                                                Aperçu indisponible
                                            </div>
                                        )}
                                        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow">
                                            {source.type === 'screen' ? 'Écran' : 'Fenêtre'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        {source.appIconUrl && (
                                            <img
                                                src={source.appIconUrl}
                                                alt="Icône"
                                                className="h-10 w-10 rounded-lg object-contain"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{source.name}</p>
                                            {source.displayId && (
                                                <p className="text-xs text-gray-500">Affichage {source.displayId}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

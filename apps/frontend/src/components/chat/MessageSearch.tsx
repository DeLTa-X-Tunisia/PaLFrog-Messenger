import React, { useMemo, useState } from 'react';
import { useWebRTCStore } from '../../stores/webrtc.store';

interface MessageSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

type StoreState = ReturnType<typeof useWebRTCStore>;
type StoreMessage = StoreState['messages'][number];

interface HighlightRange {
    start: number;
    end: number;
}

interface MatchResult {
    original: StoreMessage;
    plainContent: string;
    highlightRanges: HighlightRange[];
}

const stripHtml = (value: string): string => {
    const sanitized = value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return sanitized;
};

const normalizeForSearch = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const tokenizeSearchTerm = (value: string): string[] =>
    normalizeForSearch(value)
        .split(/\s+/)
        .filter(Boolean);

const buildNormalizedContent = (text: string) => {
    const normalizedChars: string[] = [];
    const indexMap: number[] = [];

    Array.from(text).forEach((char, index) => {
        const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!normalized) {
            return;
        }

        Array.from(normalized).forEach((normalizedChar) => {
            normalizedChars.push(normalizedChar.toLowerCase());
            indexMap.push(index);
        });
    });

    return {
        normalized: normalizedChars.join(''),
        indexMap,
    };
};

const mergeRanges = (ranges: HighlightRange[]): HighlightRange[] => {
    if (ranges.length <= 1) {
        return ranges;
    }

    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged: HighlightRange[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];

        if (current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
        } else {
            merged.push({ ...current });
        }
    }

    return merged;
};

const buildHighlightRanges = (normalized: string, indexMap: number[], tokens: string[]): HighlightRange[] => {
    if (!normalized || indexMap.length === 0 || tokens.length === 0) {
        return [];
    }

    const ranges: HighlightRange[] = [];

    tokens.forEach((token) => {
        let searchStart = 0;

        while (searchStart < normalized.length) {
            const matchIndex = normalized.indexOf(token, searchStart);
            if (matchIndex === -1) {
                break;
            }

            const start = indexMap[matchIndex];
            const endIndex = indexMap[Math.min(matchIndex + token.length - 1, indexMap.length - 1)] + 1;

            ranges.push({ start, end: endIndex });

            searchStart = matchIndex + token.length;
        }
    });

    return mergeRanges(ranges);
};

const renderHighlightedContent = (text: string, ranges: HighlightRange[]): React.ReactNode => {
    if (ranges.length === 0) {
        return text;
    }

    const segments: React.ReactNode[] = [];
    let cursor = 0;

    ranges.forEach((range, index) => {
        const start = Math.max(0, Math.min(range.start, text.length));
        const end = Math.max(start, Math.min(range.end, text.length));

        if (cursor < start) {
            segments.push(
                <React.Fragment key={`text-${index}-${cursor}`}>
                    {text.slice(cursor, start)}
                </React.Fragment>
            );
        }

        segments.push(
            <mark
                key={`mark-${index}`}
                className="bg-yellow-200/80 text-current rounded px-1 py-0.5"
            >
                {text.slice(start, end)}
            </mark>
        );

        cursor = end;
    });

    if (cursor < text.length) {
        segments.push(
            <React.Fragment key={`text-tail-${cursor}`}>
                {text.slice(cursor)}
            </React.Fragment>
        );
    }

    return segments;
};

const resolveMessageChatId = (message: StoreMessage): string | undefined => {
    if (message?.chatId) {
        return message.chatId;
    }

    if (message?.sender === 'me' && (message as any)?.receiverId) {
        return (message as any).receiverId as string;
    }

    if (typeof message?.sender === 'string' && message.sender !== 'system' && message.sender !== 'me') {
        return message.sender;
    }

    return undefined;
};

const formatTimestamp = (value: Date | string): string => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleString();
};

const hasContent = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const MessageSearch: React.FC<MessageSearchProps> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { messages, activeChat } = useWebRTCStore();

    const queryTokens = useMemo(() => tokenizeSearchTerm(searchTerm), [searchTerm]);

    const matchedMessages = useMemo<MatchResult[]>(() => {
        if (!isOpen || !activeChat || queryTokens.length === 0) {
            return [];
        }

        return messages.reduce<MatchResult[]>((acc, message) => {
            if (!hasContent(message?.content)) {
                return acc;
            }

            const chatId = resolveMessageChatId(message);
            if (!chatId || chatId !== activeChat) {
                return acc;
            }

            const plainContent = stripHtml(message.content);
            if (!plainContent) {
                return acc;
            }

            const { normalized, indexMap } = buildNormalizedContent(plainContent);
            const matchesAllTokens = queryTokens.every(token => normalized.includes(token));

            if (!matchesAllTokens) {
                return acc;
            }

            const highlightRanges = buildHighlightRanges(normalized, indexMap, queryTokens);

            acc.push({
                original: message,
                plainContent,
                highlightRanges,
            });

            return acc;
        }, []).sort((a, b) => {
            const aTime = (a.original.timestamp instanceof Date ? a.original.timestamp : new Date(a.original.timestamp)).getTime();
            const bTime = (b.original.timestamp instanceof Date ? b.original.timestamp : new Date(b.original.timestamp)).getTime();
            return bTime - aTime;
        });
    }, [messages, activeChat, queryTokens, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    const hasQuery = queryTokens.length > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-40 pt-20">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Rechercher dans les messages..."
                                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                autoFocus
                            />
                            <div className="absolute left-3 top-3 text-gray-400">
                                🔍
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-64">
                    {!hasQuery ? (
                        <div className="p-8 text-center text-gray-500">
                            Tapez pour rechercher...
                        </div>
                    ) : matchedMessages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Aucun message trouvé
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {matchedMessages.map(({ original, plainContent, highlightRanges }) => (
                                <div
                                    key={original.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => {
                                        const element = document.getElementById(`message-${original.id}`);
                                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        element?.classList.add('bg-yellow-100', 'animate-pulse');
                                        setTimeout(() => {
                                            element?.classList.remove('bg-yellow-100', 'animate-pulse');
                                        }, 2000);
                                        onClose();
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {original.sender === 'me' ? 'Vous' : original.sender || 'Système'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(original.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 break-words">
                                        {renderHighlightedContent(plainContent, highlightRanges)}
                                    </p>
                                    {original.type && original.type !== 'text' && (
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600">
                                            {original.type === 'file' ? '📎 Fichier partagé' : 'ℹ️ Message système'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{matchedMessages.length} résultat(s)</span>
                        <span>ESC pour fermer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

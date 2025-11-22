import React, { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/ai.store';
import { useTranslation } from '../../hooks/useTranslation';

interface AISuggestionsProps {
    lastMessage: string;
    messageContext: string[];
    onSuggestionSelect: (suggestion: string) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
    lastMessage,
    messageContext,
    onSuggestionSelect
}) => {
    const { t } = useTranslation();
    const { generateSmartReply, isProcessing, preferences } = useAIStore();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (lastMessage && preferences.smartReplies) {
            const timer = setTimeout(async () => {
                const newSuggestions = await generateSmartReply(lastMessage, messageContext);
                setSuggestions(newSuggestions);
                setIsVisible(newSuggestions.length > 0);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [lastMessage, messageContext, preferences.smartReplies]);

    if (!isVisible || !preferences.smartReplies) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 mb-4">
            <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">AI</span>
                </div>
                <span className="text-sm font-medium">{t('ai.suggestions')}</span>
            </div>

            <div className="flex-1 flex space-x-2 overflow-x-auto">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionSelect(suggestion)}
                        disabled={isProcessing}
                        className="flex-shrink-0 px-3 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm whitespace-nowrap"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                ✕
            </button>
        </div>
    );
};

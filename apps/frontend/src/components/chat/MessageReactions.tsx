import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Reaction {
    emoji: string;
    count: number;
    users: string[]; // User IDs
}

interface MessageReactionsProps {
    messageId: string;
    reactions: Reaction[];
    onReact: (messageId: string, emoji: string) => void;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
    messageId,
    reactions,
    onReact
}) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="relative inline-block">
            {/* Reaction List */}
            <div className="flex gap-1 mt-1">
                {reactions.map((reaction) => (
                    <motion.button
                        key={reaction.emoji}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onReact(messageId, reaction.emoji)}
                        className={`
              px-2 py-0.5 rounded-full text-xs flex items-center gap-1
              ${reaction.users.includes('current-user-id')
                                ? 'bg-blue-100 border-blue-200'
                                : 'bg-gray-100 border-gray-200'}
              border transition-colors
            `}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="text-gray-600 font-medium">{reaction.count}</span>
                    </motion.button>
                ))}

                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Reaction Picker */}
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex gap-1 z-10"
                    >
                        {AVAILABLE_REACTIONS.map((emoji) => (
                            <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    onReact(messageId, emoji);
                                    setShowPicker(false);
                                }}
                                className="p-2 hover:bg-gray-50 rounded-full text-xl transition-colors"
                            >
                                {emoji}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

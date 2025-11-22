import React from 'react';
import { toast, Toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface NotificationToastProps {
    t: Toast;
    title: string;
    message: string;
    avatar?: string;
    type?: 'message' | 'call' | 'system';
    onClick?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ t, title, message, avatar, type = 'message', onClick }) => {
    const handleClick = () => {
        if (onClick) onClick();
        toast.dismiss(t.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`${t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden cursor-pointer hover:bg-white/90 dark:hover:bg-gray-800 transition-colors duration-200`}
            onClick={handleClick}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        {avatar ? (
                            <img
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-500/50"
                                src={avatar}
                                alt=""
                            />
                        ) : (
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-transparent ${type === 'call' ? 'bg-red-500 ring-red-500' :
                                    type === 'system' ? 'bg-blue-500 ring-blue-500' :
                                        'bg-gradient-to-br from-primary-500 to-purple-600 ring-primary-500'
                                }`}>
                                <span className="text-white font-bold text-lg">
                                    {type === 'call' ? '📞' : type === 'system' ? 'ℹ️' : title.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                    ✕
                </button>
            </div>

            {/* Progress bar animation for auto-close */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-purple-600"
            />
        </motion.div>
    );
};

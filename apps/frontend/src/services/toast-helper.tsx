import React from 'react';
import { toast } from 'react-hot-toast';
import { NotificationToast } from '../components/ui/NotificationToast';

export const showInAppNotification = (
    title: string,
    message: string,
    options: {
        avatar?: string;
        type?: 'message' | 'call' | 'system';
        onClick?: () => void;
        duration?: number;
    } = {}
) => {
    toast.custom((t) => (
        <NotificationToast
            t={t}
            title={title}
            message={message}
            avatar={options.avatar}
            type={options.type}
            onClick={options.onClick}
        />
    ), {
        duration: options.duration || 5000,
        position: 'top-right',
    });
};

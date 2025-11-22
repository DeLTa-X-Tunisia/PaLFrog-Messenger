import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notification.service';

export const NotificationSettings: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [soundsEnabled, setSoundsEnabled] = useState(true);
    const [desktopEnabled, setDesktopEnabled] = useState(true);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Charger les préférences depuis le localStorage
        const soundsPref = localStorage.getItem('palfrog-sounds-enabled');
        const desktopPref = localStorage.getItem('palfrog-desktop-notifications');

        if (soundsPref !== null) setSoundsEnabled(JSON.parse(soundsPref));
        if (desktopPref !== null) setDesktopEnabled(JSON.parse(desktopPref));
    }, []);

    const handlePermissionRequest = async () => {
        const granted = await notificationService.requestPermission();
        setPermission(granted ? 'granted' : 'denied');
    };

    const handleSoundsToggle = (enabled: boolean) => {
        setSoundsEnabled(enabled);
        localStorage.setItem('palfrog-sounds-enabled', JSON.stringify(enabled));
    };

    const handleDesktopToggle = (enabled: boolean) => {
        setDesktopEnabled(enabled);
        localStorage.setItem('palfrog-desktop-notifications', JSON.stringify(enabled));
    };

    const testNotification = async () => {
        await notificationService.notifyNewMessage({
            id: 'test',
            content: 'Ceci est une notification de test',
            sender: 'Système',
            chatId: 'test',
        });
    };

    const testSound = async () => {
        await notificationService.playNotificationSound('message');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🔔 Notifications
                </h3>

                {/* Permission du navigateur */}
                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="font-medium text-gray-900">Permissions navigateur</p>
                        <p className="text-sm text-gray-500">
                            {permission === 'granted' ? '✅ Autorisées' :
                                permission === 'denied' ? '❌ Bloquées' : '⏳ En attente'}
                        </p>
                    </div>
                    {permission !== 'granted' && (
                        <button
                            onClick={handlePermissionRequest}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Autoriser
                        </button>
                    )}
                </div>

                {/* Sons */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Sons de notification</p>
                        <p className="text-sm text-gray-500">
                            Jouer un son pour les nouveaux messages
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => testSound()}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Tester le son"
                        >
                            🔊
                        </button>
                        <button
                            onClick={() => handleSoundsToggle(!soundsEnabled)}
                            className="relative inline-block w-12 h-6 focus:outline-none"
                        >
                            <input
                                type="checkbox"
                                checked={soundsEnabled}
                                onChange={() => { }} // Handled by button onClick
                                className="sr-only"
                            />
                            <div className={`
                w-12 h-6 rounded-full transition-colors duration-200
                ${soundsEnabled ? 'bg-primary-500' : 'bg-gray-300'}
              `}></div>
                            <div className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm
                ${soundsEnabled ? 'transform translate-x-7' : 'transform translate-x-1'}
              `}></div>
                        </button>
                    </div>
                </div>

                {/* Notifications desktop */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Notifications desktop</p>
                        <p className="text-sm text-gray-500">
                            Afficher les notifications hors de l'application
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => testNotification()}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Tester la notification"
                        >
                            💬
                        </button>
                        <button
                            onClick={() => handleDesktopToggle(!desktopEnabled)}
                            className="relative inline-block w-12 h-6 focus:outline-none"
                        >
                            <input
                                type="checkbox"
                                checked={desktopEnabled}
                                onChange={() => { }} // Handled by button onClick
                                className="sr-only"
                            />
                            <div className={`
                w-12 h-6 rounded-full transition-colors duration-200
                ${desktopEnabled ? 'bg-primary-500' : 'bg-gray-300'}
              `}></div>
                            <div className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm
                ${desktopEnabled ? 'transform translate-x-7' : 'transform translate-x-1'}
              `}></div>
                        </button>
                    </div>
                </div>

                {/* Informations */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                        💡 Les notifications vous alertent même lorsque l'application est en arrière-plan.
                    </p>
                </div>
            </div>
        </div>
    );
};

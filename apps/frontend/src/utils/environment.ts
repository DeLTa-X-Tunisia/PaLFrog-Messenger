import type { DesktopCapturer } from 'electron';

export const isElectron = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const anyWindow = window as Window & { process?: { versions?: Record<string, string> } };
    return Boolean(anyWindow.process?.versions?.electron);
};

export const getDesktopCapturer = (): DesktopCapturer | null => {
    if (!isElectron()) {
        return null;
    }

    const anyWindow = window as Window & { require?: NodeRequire; desktopCapturer?: unknown };

    if (typeof anyWindow.desktopCapturer !== 'undefined') {
        return anyWindow.desktopCapturer as DesktopCapturer;
    }

    const nodeRequire = anyWindow.require;
    if (typeof nodeRequire === 'function') {
        try {
            const electron = nodeRequire('electron') as typeof import('electron');
            return electron.desktopCapturer;
        } catch (error) {
            console.warn('Failed to load electron desktopCapturer via require', error);
        }
    }

    return null;
};

import type { DesktopCapturer } from 'electron';

declare global {
    interface Window {
        require?: NodeRequire;
        electronAPI?: Record<string, unknown>;
        desktopCapturer?: DesktopCapturer;
    }
}

export { };

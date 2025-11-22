import type { DesktopCapturerSource } from 'electron';
import { getDesktopCapturer } from './environment';

export interface ScreenCaptureSource {
    id: string;
    name: string;
    type: 'screen' | 'window';
    thumbnailUrl: string;
    appIconUrl?: string;
    displayId?: string;
}

const getThumbnailUrl = (source: DesktopCapturerSource): string => {
    try {
        if (!source.thumbnail.isEmpty()) {
            return source.thumbnail.toDataURL();
        }
    } catch (error) {
        console.warn('Failed to generate screen capture thumbnail', error);
    }
    return '';
};

const getAppIconUrl = (source: DesktopCapturerSource): string | undefined => {
    try {
        if (source.appIcon && !source.appIcon.isEmpty()) {
            return source.appIcon.toDataURL();
        }
    } catch (error) {
        console.warn('Failed to generate screen capture app icon', error);
    }
    return undefined;
};

export const fetchScreenCaptureSources = async (): Promise<ScreenCaptureSource[]> => {
    const desktopCapturer = getDesktopCapturer();

    if (!desktopCapturer) {
        throw new Error('desktopCapturer unavailable');
    }

    const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 320, height: 200 },
        fetchWindowIcons: true,
    });

    return sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.id.startsWith('window') ? 'window' : 'screen',
        thumbnailUrl: getThumbnailUrl(source),
        appIconUrl: getAppIconUrl(source),
        displayId: typeof source.display_id === 'string' ? source.display_id : undefined,
    }));
};

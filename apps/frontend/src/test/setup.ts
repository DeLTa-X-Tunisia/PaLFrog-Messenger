import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Nettoyage après chaque test
afterEach(() => {
    cleanup();
});

// Mock de l'API WebRTC
global.RTCPeerConnection = class {
    createDataChannel() { return {}; }
    createOffer() { return Promise.resolve({}); }
    setLocalDescription() { return Promise.resolve(); }
    close() { }
    addEventListener() { }
    removeEventListener() { }
} as any;

// Mock de localStorage
const localStorageMock = (function () {
    let store: any = {};
    return {
        getItem: function (key: string) {
            return store[key] || null;
        },
        setItem: function (key: string, value: string) {
            store[key] = value.toString();
        },
        clear: function () {
            store = {};
        },
        removeItem: function (key: string) {
            delete store[key];
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

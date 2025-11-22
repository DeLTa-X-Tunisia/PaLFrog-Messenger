import { app, BrowserWindow, session, desktopCapturer } from 'electron';
import * as path from 'path';

// Définir le nom de l'application pour les notifications Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('PalFrog');
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // In development, load the Vite dev server
    // In production, load the built index.html
    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        // Adjust path as needed for production build structure
        win.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
}

app.whenReady().then(() => {
    // Permissions pour le partage d'écran
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['window', 'screen'] }).then((sources) => {
            // Grant access to the first screen found.
            if (sources.length > 0) {
                callback({ video: sources[0], audio: 'loopback' });
            } else {
                callback(null);
            }
        }).catch((error) => {
            console.error(error);
            callback(null);
        });
    });

    // Permissions pour caméra et microphone (appels vidéo/audio)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'fullscreen'];
        if (allowedPermissions.includes(permission)) {
            callback(true); // Accorder la permission
        } else {
            callback(false);
        }
    });

    // Permissions pour les devices (caméra/micro) - obligatoire pour getUserMedia
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        if (permission === 'media') {
            return true; // Toujours autoriser l'accès média pour les appels
        }
        return false;
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const { app, BrowserWindow, session, desktopCapturer } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Définir le nom de l'application pour les notifications Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('PalFrog');
}

let mainWindow;

function createWindow() {
    // Gestion de l'icône
    const iconPath = isDev
        ? path.join(__dirname, '../../src/assets/icon.png')
        : path.join(__dirname, '../../assets/icon.png');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // Défini par le plugin Webpack de Forge
            webSecurity: !isDev, // Disable webSecurity in dev to avoid CORS/CSP issues
        },
        show: false, // Attendre ready-to-show
    });

    // En dev, on charge le serveur Vite (http://localhost:5173)
    if (isDev) {
        const loadVite = () => {
            mainWindow.loadURL('http://localhost:5173').catch((err) => {
                console.log('Vite not ready, retrying in 1s...');
                setTimeout(loadVite, 1000);
            });
        };
        loadVite();
        mainWindow.webContents.openDevTools();
    } else {
        // En prod, on charge le fichier index.html packagé par Forge
        mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    // Autoriser le partage d'écran
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
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
            console.log(`✅ Permission accordée: ${permission}`);
            callback(true); // Accorder la permission
        } else {
            console.log(`❌ Permission refusée: ${permission}`);
            callback(false);
        }
    });

    // Permissions pour les devices (caméra/micro) - obligatoire pour getUserMedia
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        if (permission === 'media') {
            console.log('✅ Permission média accordée pour getUserMedia');
            return true; // Toujours autoriser l'accès média pour les appels
        }
        return false;
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Sécurité : empêcher la navigation externe non désirée
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        const isLocalhost = parsedUrl.origin === 'http://localhost:5173';
        // Autoriser localhost en dev, sinon bloquer
        if (!isLocalhost && !isDev) {
            event.preventDefault();
        }
    });
});

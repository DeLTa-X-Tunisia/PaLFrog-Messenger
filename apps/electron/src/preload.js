const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Exemple d'API sécurisée
    getAppVersion: () => process.versions.app,
    // Plus tard, on ajoutera ici les méthodes pour WebRTC, notifications, etc.
});

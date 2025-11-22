import { saveAs } from 'file-saver';
import { syncService } from './sync.service';

interface BackupMetadata {
    version: string;
    timestamp: string;
    messageCount: number;
    size: number;
}

class BackupService {
    async createBackup() {
        try {
            const messages = await syncService.getOfflineMessages();
            // Récupérer d'autres données (contacts, paramètres, etc.)
            const settings = localStorage.getItem('palfrog-settings');

            const backupData = {
                messages,
                settings: settings ? JSON.parse(settings) : {},
                metadata: {
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    messageCount: messages.length
                }
            };

            const blob = new Blob([JSON.stringify(backupData)], {
                type: 'application/json;charset=utf-8'
            });

            saveAs(blob, `palfrog-backup-${new Date().toISOString().split('T')[0]}.json`);

            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }

    async restoreBackup(file: File) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validation basique
            if (!data.metadata || !data.messages) {
                throw new Error('Invalid backup file format');
            }

            // Restaurer les messages via le service de sync
            for (const msg of data.messages) {
                await syncService.saveMessage(msg);
            }

            // Restaurer les paramètres
            if (data.settings) {
                localStorage.setItem('palfrog-settings', JSON.stringify(data.settings));
            }

            return {
                success: true,
                messageCount: data.messages.length
            };
        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        }
    }

    async scheduleAutoBackup(intervalHours: number = 24) {
        // Implémentation de la sauvegarde automatique
        // Pourrait utiliser l'API File System Access pour sauvegarder localement
        // ou envoyer vers un service cloud chiffré
    }
}

export const backupService = new BackupService();

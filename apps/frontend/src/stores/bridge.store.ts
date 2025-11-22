import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bridgeService } from '../services/bridge.service';

interface BridgeState {
    connections: any[];
    isImporting: boolean;
    importProgress: number;
    migrationStats: any;

    // Actions
    connectToService: (service: string, credentials: any) => Promise<boolean>;
    disconnectFromService: (service: string) => void;
    importFromService: (service: string, options: any) => Promise<any>;
    exportToService: (service: string, messages: any[]) => Promise<boolean>;
    migrateFromBackup: (service: string, backupFile: File) => Promise<any>;
    updateBridgeSettings: (service: string, settings: any) => void;
}

export const useBridgeStore = create<BridgeState>()(
    persist(
        (set, get) => ({
            connections: [],
            isImporting: false,
            importProgress: 0,
            migrationStats: {},

            connectToService: async (service, credentials) => {
                try {
                    let success = false;

                    switch (service) {
                        case 'whatsapp':
                            success = await bridgeService.connectWhatsApp(credentials.phoneNumber);
                            break;
                        case 'telegram':
                            success = await bridgeService.connectTelegram(credentials.phoneNumber);
                            break;
                        case 'email':
                            success = await bridgeService.setupEmailBridge(credentials.email, credentials.imap);
                            break;
                        case 'sms':
                            success = await bridgeService.setupSMSBridge(credentials.phoneNumber);
                            break;
                    }

                    if (success) {
                        set({ connections: bridgeService.getConnections() });
                    }

                    return success;
                } catch (error) {
                    console.error(`Connection to ${service} failed:`, error);
                    return false;
                }
            },

            disconnectFromService: (service) => {
                const bridgeId = `${service}-bridge`;
                bridgeService.disconnectBridge(bridgeId);
                set({ connections: bridgeService.getConnections() });
            },

            importFromService: async (service, options) => {
                set({ isImporting: true, importProgress: 0 });

                try {
                    let result;
                    const updateProgress = (progress: number) => {
                        set({ importProgress: progress });
                    };

                    switch (service) {
                        case 'whatsapp':
                            result = await bridgeService.importFromWhatsApp(options.contactId, options.limit);
                            break;
                        case 'signal':
                            result = await bridgeService.migrateFromSignal(options.backupFile);
                            break;
                    }

                    set({ isImporting: false, importProgress: 100 });
                    return result;
                } catch (error) {
                    set({ isImporting: false, importProgress: 0 });
                    throw error;
                }
            },

            exportToService: async (service, messages) => {
                try {
                    switch (service) {
                        case 'whatsapp':
                            return await bridgeService.exportToWhatsApp('default-contact', messages);
                        default:
                            return false;
                    }
                } catch (error) {
                    console.error(`Export to ${service} failed:`, error);
                    return false;
                }
            },

            migrateFromBackup: async (service, backupFile) => {
                set({ isImporting: true, importProgress: 0 });

                try {
                    let result;

                    switch (service) {
                        case 'signal':
                            result = await bridgeService.migrateFromSignal(backupFile);
                            break;
                        // Ajouter d'autres services...
                    }

                    set({
                        isImporting: false,
                        importProgress: 100,
                        migrationStats: result?.stats || {}
                    });

                    return result;
                } catch (error) {
                    set({ isImporting: false, importProgress: 0 });
                    throw error;
                }
            },

            updateBridgeSettings: (service, settings) => {
                const bridgeId = `${service}-bridge`;
                bridgeService.updateConnectionSettings(bridgeId, settings);
                set({ connections: bridgeService.getConnections() });
            }
        }),
        {
            name: 'bridge-storage',
        }
    )
);

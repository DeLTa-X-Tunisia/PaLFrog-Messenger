interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    permissions: string[];
    entryPoint: string;
}

interface Plugin {
    manifest: PluginManifest;
    instance: any;
    status: 'active' | 'inactive' | 'error';
}

class PluginService {
    private plugins: Map<string, Plugin> = new Map();

    async loadPlugin(manifestUrl: string) {
        try {
            const response = await fetch(manifestUrl);
            const manifest: PluginManifest = await response.json();

            if (this.plugins.has(manifest.id)) {
                console.warn(`Plugin ${manifest.id} is already loaded.`);
                return;
            }

            // Charger le script du plugin
            const script = document.createElement('script');
            script.src = manifest.entryPoint;

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            // Initialiser le plugin
            // Note: Dans une implémentation réelle, nous utiliserions un système de sandbox
            // ou Web Workers pour isoler le code du plugin.
            const pluginInstance = (window as any)[`Plugin_${manifest.id}`];

            if (pluginInstance && typeof pluginInstance.init === 'function') {
                await pluginInstance.init();
            }

            this.plugins.set(manifest.id, {
                manifest,
                instance: pluginInstance,
                status: 'active'
            });

            console.log(`Plugin ${manifest.name} loaded successfully.`);
        } catch (error) {
            console.error(`Failed to load plugin from ${manifestUrl}:`, error);
        }
    }

    async unloadPlugin(pluginId: string) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
            await plugin.instance.cleanup();
        }

        this.plugins.delete(pluginId);
        console.log(`Plugin ${pluginId} unloaded.`);
    }

    getPlugins() {
        return Array.from(this.plugins.values());
    }

    // Méthode pour permettre aux plugins d'enregistrer des composants UI
    registerComponent(pluginId: string, componentName: string, component: any) {
        // Logique d'enregistrement de composants
    }

    // Méthode pour permettre aux plugins d'ajouter des commandes
    registerCommand(pluginId: string, commandName: string, handler: Function) {
        // Logique d'enregistrement de commandes
    }
}

export const pluginService = new PluginService();

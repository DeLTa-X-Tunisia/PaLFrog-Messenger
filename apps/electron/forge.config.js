const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { AutoUnpackNativesPlugin } = require('@electron-forge/plugin-auto-unpack-natives');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');

const path = require('path');

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
    packagerConfig: {
        asar: true,
        executableName: 'palfrog',
        icon: './src/assets/icon',
        appBundleId: 'com.palfrog.chat',
        appCategoryType: 'public.app-category.social-networking',
        osxSign: {
            identity: 'Developer ID Application: Your Name (TEAM_ID)',
            'hardened-runtime': true,
            entitlements: 'entitlements.plist',
            'entitlements-inherit': 'entitlements.plist',
        },
        osxNotarize: {
            tool: 'notarytool',
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        },
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            name: 'palfrog',
            authors: 'Palfrog Team',
            exe: 'palfrog.exe',
            setupExe: 'Palfrog-Setup.exe',
            setupIcon: './src/assets/icon.ico',
            loadingGif: './src/assets/installer.gif',
            noMsi: true,
        }),
        new MakerZIP({}, ['darwin']),
        new MakerDeb({
            options: {
                name: 'palfrog',
                productName: 'Palfrog',
                genericName: 'Secure P2P Chat',
                description: 'Secure peer-to-peer chat application with end-to-end encryption',
                categories: ['Network', 'InstantMessaging'],
                icon: './src/assets/icon.png',
            },
        }),
        new MakerRpm({
            options: {
                name: 'palfrog',
                productName: 'Palfrog',
                genericName: 'Secure P2P Chat',
                description: 'Secure peer-to-peer chat application with end-to-end encryption',
                categories: ['Network', 'InstantMessaging'],
                icon: './src/assets/icon.png',
            },
        }),
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig: {
                entry: './src/main.js',
                module: {
                    rules: [],
                },
            },
            renderer: {
                config: {
                    module: {
                        rules: [],
                    },
                },
                entryPoints: [
                    {
                        html: './src/index.html',
                        js: './src/renderer.js',
                        name: 'main_window',
                        preload: {
                            js: './src/preload.js',
                        },
                    },
                ],
            },
            devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:5173; connect-src 'self' http://localhost:5173 ws://localhost:5173 http://localhost:3001 ws://localhost:3001 http://localhost:9000 ws://localhost:9000 ws://0.0.0.0:3000; img-src 'self' data: http://localhost:5173 http://localhost:3001 https:; style-src 'self' 'unsafe-inline' http://localhost:5173; font-src 'self' data: http://localhost:5173;",
        }),
    ],
    hooks: {
        packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
            // Copier les assets supplémentaires
            const fs = require('fs-extra');
            const path = require('path');

            const assetsPath = path.resolve(__dirname, 'src/assets');
            const buildAssetsPath = path.resolve(buildPath, 'assets');

            if (fs.existsSync(assetsPath)) {
                await fs.copy(assetsPath, buildAssetsPath);
            }

            // Créer le fichier de version
            const packageJson = require('./package.json');
            const versionInfo = {
                version: packageJson.version,
                buildDate: new Date().toISOString(),
                electron: electronVersion,
            };

            await fs.writeJson(path.resolve(buildPath, 'version.json'), versionInfo);
        },
    },
};

module.exports = config;

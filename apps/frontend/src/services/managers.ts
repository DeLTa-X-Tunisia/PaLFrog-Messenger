/**
 * 🏗️ Gestionnaires globaux centralisés
 * 
 * Alternative sécurisée à la pollution window.* :
 * - ✅ Import ES6 explicites
 * - ✅ Type-safe avec TypeScript
 * - ✅ Testable et mockable
 * - ✅ Pas de namespace pollution
 */

import { callManager } from './call-manager';
import { fileTransferManager } from './file-transfer-manager';

export const managers = {
    call: callManager,
    fileTransfer: fileTransferManager,
} as const;

// Type pour autocomplete IDE
export type Managers = typeof managers;

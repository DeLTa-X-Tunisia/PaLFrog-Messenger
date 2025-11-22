/**
 * Script de test pour vérifier la propagation des statuts
 * Lance 2 clients, change le statut sur l'un, vérifie que l'autre reçoit la mise à jour
 */

const io = require('socket.io-client');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const NAMESPACE = '/webrtc';

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    user1: '\x1b[36m', // Cyan
    user2: '\x1b[33m', // Yellow
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    info: '\x1b[35m' // Magenta
};

function log(user, message) {
    const color = user === 'USER1' ? colors.user1 : colors.user2;
    console.log(`${color}[${user}]${colors.reset} ${message}`);
}

async function testStatusPropagation() {
    console.log(`${colors.info}🚀 Démarrage du test de propagation des statuts...${colors.reset}\n`);

    // Créer deux clients
    const socket1 = io(`${BACKEND_URL}${NAMESPACE}`, {
        auth: {
            userId: 'test-user-1',
            username: 'Alice'
        }
    });

    const socket2 = io(`${BACKEND_URL}${NAMESPACE}`, {
        auth: {
            userId: 'test-user-2',
            username: 'Bob'
        }
    });

    // Attendre la connexion
    await Promise.all([
        new Promise(resolve => socket1.on('connect', resolve)),
        new Promise(resolve => socket2.on('connect', resolve))
    ]);

    log('USER1', '✅ Alice connectée');
    log('USER2', '✅ Bob connecté');

    // Écouter les événements status-updated
    let user2ReceivedUpdate = false;

    socket2.on('status-updated', (data) => {
        log('USER2', `📩 Reçu status-updated: userId=${data.userId}, status=${data.status}, username=${data.username}`);

        if (data.userId === 'test-user-1' && data.status === 'busy') {
            user2ReceivedUpdate = true;
            console.log(`${colors.success}✅ TEST RÉUSSI: Bob a reçu le changement de statut d'Alice!${colors.reset}`);
        }
    });

    // Alice change son statut à "busy"
    log('USER1', '📤 Alice change son statut à "busy"');
    socket1.emit('update-status', { status: 'busy' });

    // Attendre 2 secondes pour voir si Bob reçoit la mise à jour
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!user2ReceivedUpdate) {
        console.log(`${colors.error}❌ TEST ÉCHOUÉ: Bob n'a pas reçu le changement de statut d'Alice${colors.reset}`);
    }

    // Nettoyer
    socket1.disconnect();
    socket2.disconnect();

    console.log(`${colors.info}\n🏁 Test terminé${colors.reset}`);
    process.exit(user2ReceivedUpdate ? 0 : 1);
}

// Lancer le test
testStatusPropagation().catch(err => {
    console.error(`${colors.error}❌ Erreur pendant le test:${colors.reset}`, err);
    process.exit(1);
});

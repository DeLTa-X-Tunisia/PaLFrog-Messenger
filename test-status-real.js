/**
 * Real End-to-End Test for Status Propagation
 * Simulates two users changing status and verifies complete event chain
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3001';
const NAMESPACE = '/webrtc';
const JWT_SECRET = 'votre-super-secret-jwt-tres-long';

// Test users from database
const USERS = {
    user1: {
        id: 'da242164-2dc7-49e5-842e-ae4b86235a32',
        email: 'user1@user.com',
        username: 'User1'
    },
    user2: {
        id: '9e08b13e-c067-437e-8e78-2c072723e148',
        email: 'user2@example.com',
        username: 'User2'
    }
};

// Generate valid JWT tokens
const TOKENS = {
    user1: jwt.sign(
        { userId: USERS.user1.id, email: USERS.user1.email, username: USERS.user1.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    ),
    user2: jwt.sign(
        { userId: USERS.user2.id, email: USERS.user2.email, username: USERS.user2.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    )
};

let user1Socket = null;
let user2Socket = null;
let testResults = {
    user1Connected: false,
    user2Connected: false,
    user1StatusEmitted: false,
    backendReceivedUpdate: false,
    user2ReceivedStatusUpdate: false,
    user1ReceivedStatusUpdate: false,
    correctStatusData: false,
};

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          STATUS PROPAGATION - END-TO-END TEST                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function test() {
    try {
        // Step 1: Connect User 1
        console.log('📍 STEP 1: Connecting User1...\n');
        await connectUser1();

        // Step 2: Connect User 2
        console.log('\n📍 STEP 2: Connecting User2...\n');
        await connectUser2();

        // Step 3: Set up listener for status updates on both clients
        console.log('\n📍 STEP 3: Setting up status update listeners...\n');
        setupStatusListeners();

        // Step 4: User1 changes status to "busy"
        console.log('\n📍 STEP 4: User1 changing status to "busy"...\n');
        emitStatusUpdate('user1', 'busy');

        // Step 5: Wait for propagation
        console.log('\n📍 STEP 5: Waiting for event propagation (2 seconds)...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 6: User2 changes status to "away"
        console.log('\n📍 STEP 6: User2 changing status to "away"...\n');
        emitStatusUpdate('user2', 'away');

        // Step 7: Wait for propagation
        console.log('\n📍 STEP 7: Waiting for second event propagation (2 seconds)...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extra debug: check if emit was called
        console.log('\n📍 DEBUG: Checking listeners...\n');
        console.log('  Socket.io version check: connected status user1 =', user1Socket.connected);
        console.log('  Socket.io version check: connected status user2 =', user2Socket.connected);

        // Step 8: Verify results
        console.log('\n📍 STEP 8: Verification Results\n');
        printResults();

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
    } finally {
        // Cleanup
        console.log('\n📍 Cleanup: Disconnecting sockets...\n');
        if (user1Socket) user1Socket.disconnect();
        if (user2Socket) user2Socket.disconnect();

        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                      TEST COMPLETE                             ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        process.exit(allTestsPassed() ? 0 : 1);
    }
}

function connectUser1() {
    return new Promise((resolve, reject) => {
        console.log('  Connecting to', `${BASE_URL}${NAMESPACE}`);
        console.log('  User:', USERS.user1.username);

        user1Socket = io(`${BASE_URL}${NAMESPACE}`, {
            auth: { token: TOKENS.user1 },
            transports: ['websocket'],
            reconnection: false
        });

        user1Socket.on('connect', () => {
            console.log('  ✅ User1 connected successfully');
            console.log('  ✅ Socket ID:', user1Socket.id);
            testResults.user1Connected = true;
            resolve();
        });

        user1Socket.on('connect_error', (err) => {
            console.log('  ❌ Connection error:', err.message);
            reject(err);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
}

function connectUser2() {
    return new Promise((resolve, reject) => {
        console.log('  Connecting to', `${BASE_URL}${NAMESPACE}`);
        console.log('  User:', USERS.user2.username);

        user2Socket = io(`${BASE_URL}${NAMESPACE}`, {
            auth: { token: TOKENS.user2 },
            transports: ['websocket'],
            reconnection: false
        });

        user2Socket.on('connect', () => {
            console.log('  ✅ User2 connected successfully');
            console.log('  ✅ Socket ID:', user2Socket.id);
            testResults.user2Connected = true;
            resolve();
        });

        user2Socket.on('connect_error', (err) => {
            console.log('  ❌ Connection error:', err.message);
            reject(err);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
}

function setupStatusListeners() {
    console.log('  Setting up status-updated listener on User1...');
    user1Socket.on('status-updated', (data) => {
        console.log('  🔔 User1 received status-updated event');
        console.log('    Data:', data);
        testResults.user1ReceivedStatusUpdate = true;
        if (data.userId === USERS.user2.id && data.status === 'away') {
            testResults.correctStatusData = true;
        }
    });

    user1Socket.on('disconnect', (reason) => {
        console.log('  ⚠️ User1 disconnected:', reason);
    });

    console.log('  Setting up status-updated listener on User2...');
    user2Socket.on('status-updated', (data) => {
        console.log('  🔔 User2 received status-updated event');
        console.log('    Data:', data);
        testResults.user2ReceivedStatusUpdate = true;
        if (data.userId === USERS.user1.id && data.status === 'busy') {
            testResults.correctStatusData = true;
        }
    });

    user2Socket.on('disconnect', (reason) => {
        console.log('  ⚠️ User2 disconnected:', reason);
    });

    console.log('  ✅ Listeners configured');
}

function emitStatusUpdate(user, newStatus) {
    const socket = user === 'user1' ? user1Socket : user2Socket;
    const userData = user === 'user1' ? USERS.user1 : USERS.user2;

    console.log(`  Emitting 'update-status' event from ${userData.username}`);
    console.log(`  New status: "${newStatus}"`);

    socket.emit('update-status', { status: newStatus }, () => {
        console.log(`  ✅ Event emitted from ${userData.username}`);
        testResults.user1StatusEmitted = true;
    });
}

function printResults() {
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│           CONNECTION STATUS                │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│ User1 Connected        ${testResults.user1Connected ? '✅' : '❌'} │`);
    console.log(`│ User2 Connected        ${testResults.user2Connected ? '✅' : '❌'} │`);
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('┌─────────────────────────────────────────────┐');
    console.log('│           EVENT PROPAGATION                │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│ Status Emitted         ${testResults.user1StatusEmitted ? '✅' : '❌'} │`);
    console.log(`│ User2 Received Update  ${testResults.user2ReceivedStatusUpdate ? '✅' : '❌'} │`);
    console.log(`│ User1 Received Update  ${testResults.user1ReceivedStatusUpdate ? '✅' : '❌'} │`);
    console.log(`│ Correct Data           ${testResults.correctStatusData ? '✅' : '❌'} │`);
    console.log('└─────────────────────────────────────────────┘\n');

    if (allTestsPassed()) {
        console.log('🎉 ALL TESTS PASSED! Status propagation is working correctly.\n');
    } else {
        console.log('⚠️  Some tests failed. Check the results above.\n');
    }
}

function allTestsPassed() {
    return Object.values(testResults).every(result => result === true);
}

// Run the test
test().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

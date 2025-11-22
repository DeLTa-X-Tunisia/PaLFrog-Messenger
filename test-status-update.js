/**
 * Test script for status propagation
 * Simulates two users updating status and checks if both receive the update
 */

const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001';
const NAMESPACE = '/webrtc';

// Mock token (in real app, would be JWT)
const tokens = {
    user1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYTI0MjE2NC0yZGM3LTQ5ZTUtODQyZS1hZTRiODYyMzVhMzIiLCJlbWFpbCI6InVzZXIxQHVzZXIuY29tIiwidXNlcm5hbWUiOiJVc2VyMSIsImlhdCI6MTczMjc4NzQ2MCwiZXhwIjoxNzMzMzkyMjYwfQ.RqS7xAl5Z3OqKsJ9yQxZL_Qh_3L5X5X5X5X5X5X5X5X', // These would need to be actual valid tokens
    user2: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZTA4YjEzZS1jMDY3LTQzN2UtOGU3OC0yYzA3MjcyM2UxNDgiLCJlbWFpbCI6InVzZXIyQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJVc2VyMiIsImlhdCI6MTczMjc4NzQ2MCwiZXhwIjoxNzMzMzkyMjYwfQ.RqS7xAl5Z3OqKsJ9yQxZL_Qh_3L5X5X5X5X5X5X5X5X'
};

let user1Socket = null;
let user2Socket = null;
let statusUpdateReceived = false;

async function test() {
    console.log('\n=== Status Update Propagation Test ===\n');

    try {
        // Connect User 1
        console.log('1. Connecting User1...');
        user1Socket = io(`${BASE_URL}${NAMESPACE}`, {
            auth: { token: tokens.user1 },
            transports: ['websocket'],
            reconnection: false
        });

        await new Promise((resolve, reject) => {
            user1Socket.on('connect', () => {
                console.log('   ✅ User1 connected');
                resolve();
            });
            user1Socket.on('connect_error', (err) => {
                console.log('   ❌ User1 connection error:', err.message);
                reject(err);
            });
        });

        // Connect User 2
        console.log('\n2. Connecting User2...');
        user2Socket = io(`${BASE_URL}${NAMESPACE}`, {
            auth: { token: tokens.user2 },
            transports: ['websocket'],
            reconnection: false
        });

        await new Promise((resolve, reject) => {
            user2Socket.on('connect', () => {
                console.log('   ✅ User2 connected');
                resolve();
            });
            user2Socket.on('connect_error', (err) => {
                console.log('   ❌ User2 connection error:', err.message);
                reject(err);
            });
        });

        // Set up listener on User2 for status updates
        console.log('\n3. Setting up status update listener on User2...');
        user2Socket.on('status-updated', (data) => {
            console.log('   🔔 User2 received status-updated:', data);
            statusUpdateReceived = true;
        });

        // User1 changes status
        console.log('\n4. User1 changing status to "busy"...');
        user1Socket.emit('update-status', { status: 'busy' });

        // Give time for event to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if User2 received the update
        console.log('\n5. Verification:');
        if (statusUpdateReceived) {
            console.log('   ✅ SUCCESS: Status update propagated to User2');
        } else {
            console.log('   ❌ FAILURE: User2 did not receive status update');
        }

        // Test receiving on User1 as well
        let user1ReceivedUpdate = false;
        user1Socket.on('status-updated', (data) => {
            if (data.username === 'User1') {
                console.log('   🔔 User1 also received own status update');
                user1ReceivedUpdate = true;
            }
        });

        console.log('\n=== Test Complete ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        // Cleanup
        if (user1Socket) user1Socket.disconnect();
        if (user2Socket) user2Socket.disconnect();
        process.exit(statusUpdateReceived ? 0 : 1);
    }
}

test();

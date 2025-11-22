# Status Propagation Bug Fix - Investigation & Resolution

## Problem Statement
When a user changed their status (Online→Busy/Away/DND), other connected users would NOT see the status change in real-time. The status selector would update the sender's local state, but the notification and contact list on other clients would not update.

## Root Cause Analysis

### The Bug
In `apps/backend/src/websocket/websocket.gateway.ts`, the `handleUpdateStatus` method was using:
```typescript
this.server.emit('status-updated', {...})
```

### Why This Was Wrong
The Socket.io method `this.server.emit()` in a NestJS WebSocket Gateway sends to the **default namespace root**, not properly through the event listeners of connected clients in the `/webrtc` namespace. This causes the event to be lost or not reach the frontend listeners.

Comparison with working code - the `user-online` event uses:
```typescript
client.broadcast.emit('user-online', {...})
```

This method:
1. Uses the `client` context (which is in the `/webrtc` namespace)
2. Sends through Socket.io's proper event system that frontend listeners receive
3. Reaches all clients in the namespace through the event listener

### The Namespace Issue
- Backend Gateway: `@WebSocketGateway({ namespace: '/webrtc' })`
- Frontend Socket.io connection: `io(...'/webrtc')`
- **Bug**: Using `this.server.emit()` bypasses proper namespace routing
- **Fix**: Use `client.broadcast.emit()` + `client.emit()` pattern

## Solution Applied

Changed `handleUpdateStatus` from:
```typescript
@SubscribeMessage('update-status')
handleUpdateStatus(client: AuthenticatedSocket, payload: { status: string }) {
    // ... validation code ...
    this.server.emit('status-updated', {
        userId: client.user.userId,
        status: payload.status,
        username: client.user.username
    });
}
```

To:
```typescript
@SubscribeMessage('update-status')
handleUpdateStatus(client: AuthenticatedSocket, payload: { status: string }) {
    // ... validation code ...
    const statusUpdateData = {
        userId: client.user.userId,
        status: payload.status,
        username: client.user.username
    };
    
    // Send to all other clients (broadcast)
    client.broadcast.emit('status-updated', statusUpdateData);
    // Send to requesting client as well
    client.emit('status-updated', statusUpdateData);
}
```

## Event Flow After Fix

1. **User changes status in UI**
   - Calls `UserStatusSelector.handleStatusChange()`
   - Updates auth store via `setStatus()`
   - Emits `update-status` event via socket

2. **Backend receives update**
   - `handleUpdateStatus()` receives the event
   - Updates `connectedUsers` Map with new status
   - Logs: `🎯 Gateway: update-status received...`

3. **Backend broadcasts to all clients**
   - `client.broadcast.emit()` sends to all EXCEPT sender
   - `client.emit()` sends to sender
   - Events go through proper Socket.io event system

4. **Frontend receives status-updated**
   - Socket listener triggers: `socket.on('status-updated', handleStatusUpdated)`
   - Logs: `🔔 Socket: status-updated received`

5. **Frontend updates store**
   - `handleStatusUpdated` calls `updateUserStatus(userId, status)`
   - Store action updates `onlineUsers` array
   - Logs: `🔷 Store: updateUserStatus called`

6. **React components re-render**
   - `ContactsList` component subscribes to `onlineUsers`
   - Zustand triggers re-render with new status
   - UI displays updated status color/label
   - Notification shows correct status

## Verification Points

The fix was verified through:
1. Code comparison with working `user-online` event (same Socket.io pattern)
2. Backend compilation successful with new code
3. Event listener properly registered on frontend (line 67 of socket.service.ts)
4. Store action correctly implemented to trigger re-renders
5. Data flow logic: client → backend → all clients → store → UI

## Files Changed
- `apps/backend/src/websocket/websocket.gateway.ts` (lines 230-254)

## Testing Instructions
1. Open the app in browser at `http://localhost:5173`
2. Log in with test credentials (e.g., user1@user.com)
3. Open browser dev console to see status logs
4. Change status in UI dropdown
5. Expected logs in browser console:
   - `✅ SocketService: Emitting update-status`
   - `✅ SocketService: update-status emitted`
   - `🔔 Socket: status-updated received`
   - `🔷 Store: updateUserStatus called`
6. Expected backend logs:
   - `🎯 Gateway: update-status received from [username]`
   - `🎯 Gateway: Broadcast sent to all clients`
7. Expected behavior:
   - Notification shows with correct status
   - Contact list updates status color immediately
   - Clicking notification opens chat with that user

## Status
✅ Fix implemented
✅ Backend recompiled
✅ Ready for testing

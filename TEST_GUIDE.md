# Guide de Test - Propagation des Statuts

## ✅ Services Actifs

- **Backend NestJS**: Port 3001
- **Frontend Vite**: Port 5173  
- **Electron App**: Fenêtre ouverte

## 🧪 Scénario de Test

### Option 1: Deux fenêtres Electron (Recommandé pour test rapide)

1. L'application Electron est déjà ouverte (Utilisateur A)
2. Ouvrez un navigateur et allez sur: `http://localhost:5173` (Utilisateur B)
3. Connectez-vous avec deux comptes différents
4. Sur l'Utilisateur A, changez votre statut:
   - Cliquez sur votre profil/avatar
   - Sélectionnez: Busy, Away, ou DND
5. Sur l'Utilisateur B, vérifiez:
   - ✅ Une notification apparaît
   - ✅ La notification a la bonne couleur (rouge/jaune/etc.)
   - ✅ Le message est correct ("X est maintenant occupé(e)")
   - ✅ Cliquer sur la notification ouvre le chat avec X
   - ✅ Dans la liste des contacts, le statut de X est mis à jour

### Option 2: Script de test automatique

Exécutez: `node test-status-propagation.js`

Ce script simule 2 utilisateurs (Alice et Bob) et vérifie que:
- ✅ Alice change son statut à "busy"
- ✅ Bob reçoit l'événement `status-updated`
- ✅ Le test passe avec succès

## 🔍 Logs de Debug

Les logs suivants apparaissent dans la console:

### Backend (Terminal Backend)
```
🎯 Gateway: Broadcasting to all clients: userId=xxx, status=busy
```

### Frontend (Console navigateur/DevTools)
```
🔔 Socket: status-updated received for user xxx
🔷 Store: updateUserStatus called for xxx new status: busy
🔷 Store: Updating user YYY from online to busy
```

## ✅ Modifications Appliquées

1. **Backend** (`websocket.gateway.ts`):
   - Mode test ajouté (authentification sans JWT)
   - Broadcast correct: `client.broadcast.emit() + client.emit()`

2. **Frontend Store** (`webrtc.store.ts`):
   - `updateUserStatus` avec fallback automatique
   - Si utilisateur absent de `onlineUsers`, il est ajouté automatiquement

3. **Types TypeScript**:
   - Propriété `status` ajoutée dans tous les types `User`

## 📝 Résultat Attendu

Quand un utilisateur change son statut, TOUS les autres utilisateurs connectés doivent:
1. Recevoir une notification en temps réel
2. Voir le statut mis à jour dans la liste des contacts
3. Pouvoir cliquer sur la notification pour ouvrir le chat

---

**Note**: Si l'application Electron se ferme automatiquement, elle a été relancée dans une fenêtre PowerShell séparée qui reste ouverte.

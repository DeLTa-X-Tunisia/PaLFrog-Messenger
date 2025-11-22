# PaLFroG Messenger

![Made with ❤️ by DeLTa-X-Tunisia](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F-by%20DeLTa--X--Tunisia-purple)

Plateforme de messagerie souveraine, Texte, Audio, Video, Cam, fluide et sécurisée, avec agents IA intégrés, WebRTC, et gestion avancée des rôles.

<img width="958" height="458" alt="image" src="https://github.com/user-attachments/assets/d3a8b6ba-f781-496e-9df8-ad9062a38a8a" />


## 🚀 Vision

PaLFroG Messenger réunit :
- **Messagerie temps réel** (texte, audio, vidéo, partage d’écran, fichiers)
- **Sécurité renforcée** (chiffrement de bout en bout, rotation de clés, gestion fine des rôles)
- **Agents IA intégrés** (assistants conversationnels, transcription, résumé, analyse de sentiment)
- **Expérience utilisateur premium** (interface responsive, support multi‑plateformes Web/Electron, notifications et analytics intégrés)
- **Interopérabilité** (connecteurs externes, API étendues, plugins partenaires)

## ✨ Fonctionnalités principales

### Communication
- Messagerie texte riche (markdown, réactions, threads)
- Appels audio et vidéo HD via WebRTC, intégration WebCam
- Tests caméra & micro intégrés (aperçu vidéo, visualisation audio)
- Partage d’écran et collaboration synchrone
- Transfert de fichiers sécurisé et rapide

### Sécurité & Gouvernance
- Chiffrement end-to-end AES-256-GCM
- Authentification multi-facteurs (2FA, OTP, WebAuthn)
- Gestion avancée des rôles & permissions (RBAC)
- Traçabilité, audit logs chiffrés, alerts de sécurité
- Conformité RGPD et options d’auto-hébergement souverain

### Intelligence Artificielle
- Agents IA conversationnels multi-langues
- Transcription en temps réel et traduction automatique
- Résumés dynamiques de conversations, détection d’intentions
- Suggestions proactives (réponses rapides, assignation de tâches)
- Modèles IA personnalisables et orchestrables

### Expérience Utilisateur
- UI/UX premium (Tailwind, animations fluides, mode sombre)
- Applications Web, Desktop (Electron) et Mobile (à venir)
- Notifications en temps réel (push, desktop, mobile)
- Modules d’analytics, gamification, support et aide intégrés

### Interopérabilité & Extensibilité
- API REST/GraphQL sécurisées
- Connecteurs externes (CRM, outils collaboratifs, SSO, etc.)
- Plugins métiers et automatisations (bots, scripts, webhooks)

## 🏗️ Architecture technique

| Couche | Technologies |
| ------ | ------------ |
| Frontend | React, Vite, TailwindCSS, Zustand, WebRTC |
| Backend | Node.js/NestJS, Prisma, PostgreSQL, Redis, WebSockets |
| Desktop | Electron (bridge Web + natif) |
| IA | Services internes & intégration LLM (OpenAI, Azure, on-premise) |
| DevOps | Docker Compose, GitHub Actions CI/CD, monitoring (Grafana/Prometheus), Sentry |

### Points clés
- Séparation claire des domaines (messagerie, sécurité, IA, analytics)
- Microservices modulaires et scalables
- Architecture orientée événements (Pub/Sub)
- Support offline, synchronisation intelligente
- Observabilité (logs centralisés, métriques, traces)

## 📦 Installation & Démarrage

```bash
git clone https://github.com/DeLTa-X-Tunisia/PaLFroG-Messenger.git
cd PaLFroG-Messenger

# Installer les dépendances
npm install

# Lancer les services (exemple)
docker-compose up -d

# Démarrer le backend
cd apps/backend
npm run dev

# Démarrer le frontend
cd ../frontend
npm run dev

# Démarrer l’app desktop (electron)
cd ../electron
npm run dev

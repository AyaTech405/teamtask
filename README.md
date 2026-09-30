# ⬡ TeamTask

Application desktop Electron de gestion de projets étudiants.  
Stack : **React 18 + Vite + PHP/SQLite + Electron**

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 18
- PHP ≥ 8.0 (ajouté au PATH)
- npm ≥ 9

### Installation
```bash
npm install
```

### Lancer en développement
```bash
npm run dev
```
> Démarre Vite (port 5173) + Electron + le serveur PHP (port 8000) en parallèle.

### Build production
```bash
npm run build        # Compile le frontend React
npm run pack:win     # .exe Windows
npm run pack:mac     # .dmg macOS
npm run pack:linux   # .AppImage Linux
```

---

## 📁 Structure

```
teamtask/
├── electron/          # Processus Electron (main.js, preload.js)
├── backend/
│   ├── api/           # auth.php, projects.php, tasks.php, messages.php
│   ├── config/        # db_connection.php
│   └── database.sql   # Schéma SQLite
├── database/          # teamtask.db (créé automatiquement)
├── src/
│   ├── api/           # client axios + fonctions API
│   ├── components/    # Layout, Sidebar, Modal, Badge, ProgressBar
│   ├── context/       # AuthContext, ToastContext
│   ├── hooks/         # useProjects, useTasks
│   ├── pages/         # Login, Dashboard, Projects, Tasks, Chat, Team
│   ├── utils/         # helpers.js, pdfExport.js
│   └── styles/        # index.css (design system complet)
└── dist/              # Build Vite (généré)
```

---

## ✨ Fonctionnalités

| Feature | Détails |
|---|---|
| **Auth** | Inscription / connexion, sessions PHP sécurisées (bcrypt + token 64 hex) |
| **Projets** | CRUD complet, couleur par projet, deadline, membres |
| **Kanban** | 3 colonnes (À faire / En cours / Terminé), déplacement rapide |
| **Tâches** | Titre, description, priorité, assignation, deadline |
| **Chat** | Messagerie par projet, polling 3s (MVP) |
| **Équipe** | Gestion des membres, ajout par email |
| **Export PDF** | Rapport complet via impression navigateur |
| **Dashboard** | Stats globales, tâches assignées, projets récents |

---

## 🔧 Variables d'environnement

Le backend PHP tourne sur `http://localhost:8000`.  
Pour changer le port, modifier `PHP_PORT` dans `electron/main.js` et `API_BASE` dans `src/api/client.js`.

---

## ⚠️ Limites MVP

- **Chat** : polling HTTP simple (→ WebSocket pour v2)
- **PHP embarqué** : PHP doit être installé sur la machine cible
- **Pas de 2FA** : authentification basique par email/password
- **Pas de notifications push** : toast UI seulement

---

## 🛠️ Notes sur cette version

Cette version corrige plusieurs bugs présents dans l'archive d'origine :

- **Routing en production cassé** : l'app utilisait `BrowserRouter`, incompatible avec le chargement via `file://` utilisé par Electron une fois le build fait (`mainWindow.loadFile`). Remplacé par `HashRouter`, seul compatible avec `file://`.
- **Export PDF silencieusement bloqué** : `setWindowOpenHandler` refusait *toutes* les nouvelles fenêtres (y compris la fenêtre d'impression utilisée par `pdfExport.js`). Il ne bloque désormais que les liens `http(s)` externes (ouverts dans le navigateur système) et laisse passer les fenêtres locales.
- **Page Profil non fonctionnelle** : « Enregistrer » (nom) et « Changer le mot de passe » étaient des maquettes qui affichaient un succès sans rien modifier en base. Deux endpoints ont été ajoutés (`auth.php?action=update_profile` et `action=change_password`) et branchés côté frontend.
- **Classes CSS manquantes** : `modal-body`, `gap-4/10/16`, `mb-4/12`, `fs-11`, `text-center`, `text-warning` étaient utilisées dans le JSX mais absentes de `index.css`.
- **Rapport PDF non échappé** : les titres/descriptions de tâches et noms/emails étaient injectés tels quels dans le HTML du rapport (`pdfExport.js`), ce qui pouvait casser la mise en page si un titre contenait `<` ou `&`. Le texte est maintenant échappé.
- **Dossiers fantômes / base de test** : l'archive contenait des dossiers vides résiduels (`{electron,src...}`) issus d'un script de scaffolding raté, ainsi qu'une `database/teamtask.db` de test (avec des comptes existants). Les deux ont été supprimés — la base se recrée proprement au premier lancement.
- **`node_modules/` et `dist/` non fournis** : le `node_modules` de l'archive d'origine était généré sous Windows (binaires natifs `win32-x64` pour Rollup/esbuild) et ne fonctionne pas tel quel sur macOS/Linux. Il a été retiré ; lancez `npm install` sur votre machine pour régénérer un `node_modules` valide pour votre plateforme, puis `npm run build` pour régénérer `dist/`.

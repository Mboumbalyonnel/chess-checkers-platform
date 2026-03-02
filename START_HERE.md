# 🎮 DÉMARRAGE IMMÉDIAT - Plateforme Chess & Checkers

## ⚡ Installation Express (5 minutes)

### 1️⃣ Prérequis Essentiels

Vérifiez que vous avez installé:
```bash
node --version    # Doit afficher v16 ou supérieur
npm --version     # Doit afficher 8 ou supérieur
mongod --version  # Doit afficher MongoDB 5 ou supérieur
```

Si manquant, installez:
- **Node.js**: https://nodejs.org/
- **MongoDB**: https://www.mongodb.com/try/download/community

### 2️⃣ Installation en Une Commande

```bash
cd chess-checkers-platform
chmod +x start.sh
./start.sh
```

**C'est tout!** 🎉

Le script va:
- ✅ Démarrer MongoDB
- ✅ Installer toutes les dépendances
- ✅ Configurer les variables d'environnement
- ✅ Lancer le backend sur http://localhost:5000
- ✅ Lancer le frontend sur http://localhost:3000

### 3️⃣ Accéder à l'Application

Ouvrez votre navigateur:
👉 **http://localhost:3000**

---

## 🎯 Premiers Pas

### Option 1: Jouer Sans Compte
1. Cliquez sur **"Commencer à Jouer"**
2. Choisissez **Échecs** ou **Dames**
3. Sélectionnez **"Contre l'IA"**
4. Choisissez la difficulté
5. **JOUEZ!** 🎮

### Option 2: Créer un Compte
1. Cliquez sur **"S'inscrire"**
2. Remplissez le formulaire
3. Vous êtes automatiquement connecté
4. Accédez au mode en ligne et aux statistiques

---

## 🛠️ Installation Manuelle (Alternative)

Si le script automatique ne fonctionne pas:

### Backend
```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Démarrer MongoDB (selon votre OS)
# Linux/Mac:
sudo systemctl start mongodb
# ou
brew services start mongodb-community

# Lancer le serveur
npm run dev
```

### Frontend (nouveau terminal)
```bash
cd frontend

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

---

## 📦 Ce Qui Est Inclus

### ✅ Frontend (React)
- 🏠 Page d'accueil moderne
- 🔐 Système d'authentification complet
- ♟️ Jeu d'échecs avec chess.js
- ⚫ Jeu de dames personnalisé
- 🎨 Interface Bootstrap responsive
- 📊 Dashboard de statistiques

### ✅ Backend (Node.js)
- 🔒 API REST sécurisée
- 🔑 Authentification JWT
- 📡 WebSocket pour jeu en ligne
- 💾 MongoDB pour persistance
- 🤖 IA avec 3 niveaux

### ✅ Documentation
- 📖 README complet
- 🚀 Guide de démarrage rapide
- 🏗️ Architecture détaillée
- ⚙️ Guide des fonctionnalités
- 🐳 Configuration Docker

---

## 🎮 Fonctionnalités Principales

### Jeux Disponibles
| Jeu | Mode IA | Mode En Ligne | Difficulté |
|-----|---------|---------------|------------|
| ♔ Échecs | ✅ | ✅ | 3 niveaux |
| ⚫ Dames | ✅ | ✅ | 3 niveaux |

### Modes de Jeu
- 🤖 **Contre l'IA**: Facile, Intermédiaire, Difficile
- 🌐 **En Ligne**: Matchmaking automatique
- 👥 **Local**: Sans connexion

### Fonctionnalités Utilisateur
- 📝 Inscription/Connexion
- 📊 Statistiques personnelles
- 📜 Historique des parties
- 🏆 Suivi des victoires/défaites

---

## 🔧 Résolution de Problèmes

### MongoDB ne démarre pas
```bash
# Linux/Ubuntu
sudo systemctl status mongodb
sudo systemctl start mongodb

# macOS
brew services list
brew services start mongodb-community

# Windows
# Démarrer le service MongoDB depuis Services
```

### Port déjà utilisé (3000 ou 5000)
```bash
# Trouver et tuer le processus
# Port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

### Dépendances manquantes
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion MongoDB
1. Vérifiez que MongoDB est démarré
2. Vérifiez l'URL dans `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/chess-checkers-db
   ```

---

## 🐳 Déploiement avec Docker (Production)

### Installation Docker
```bash
# Vérifier Docker
docker --version
docker-compose --version

# Si non installé: https://docs.docker.com/get-docker/
```

### Lancer avec Docker
```bash
# À la racine du projet
docker-compose up -d

# Vérifier les conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

**Accès après déploiement Docker:**
- Frontend: http://localhost
- Backend: http://localhost:5000
- MongoDB: localhost:27017

---

## 📊 Structure du Projet

```
chess-checkers-platform/
├── frontend/          # React Application
│   ├── src/
│   │   ├── pages/    # Composants pages
│   │   └── App.js    # Router principal
│   └── package.json
│
├── backend/           # Node.js API
│   ├── models/       # MongoDB Models
│   ├── routes/       # API Routes
│   └── server.js     # Express Server
│
└── Documentation
    ├── README.md         # Doc principale
    ├── QUICK_START.md    # Ce fichier
    ├── ARCHITECTURE.md   # Architecture
    └── FEATURES.md       # Fonctionnalités
```

---

## 🎯 Prochaines Étapes

### Pour Développeurs
1. 📖 Lisez `ARCHITECTURE.md` pour comprendre la structure
2. 🔧 Explorez le code dans `frontend/src/` et `backend/`
3. 🎨 Personnalisez les styles dans `App.css`
4. ➕ Ajoutez vos propres fonctionnalités

### Pour Utilisateurs
1. 🎮 Créez un compte
2. 🏆 Jouez quelques parties
3. 📊 Consultez vos statistiques
4. 🌐 Essayez le mode en ligne

### Pour Déploiement
1. 📝 Modifiez `.env` avec vos valeurs de production
2. 🔒 Changez `JWT_SECRET`
3. 🐳 Utilisez Docker pour le déploiement
4. 🌐 Configurez un nom de domaine

---

## 📞 Aide et Support

### Documentation
- 📖 **README.md** - Documentation complète
- ⚡ **QUICK_START.md** - Ce guide
- 🏗️ **ARCHITECTURE.md** - Architecture détaillée
- ⚙️ **FEATURES.md** - Guide des fonctionnalités

### Problèmes Courants
Consultez la section "Dépannage" dans le README.md

### Contribution
Les contributions sont bienvenues! Voir le README pour les instructions.

---

## ✨ Fonctionnalités Bonus

### Déjà Implémenté
- ✅ Animations fluides
- ✅ Design responsive
- ✅ Mode sombre/clair (selon le plateau)
- ✅ Historique des coups
- ✅ Annulation de coups (échecs)
- ✅ Détection automatique d'échec et mat
- ✅ Promotion automatique des pions
- ✅ WebSocket pour temps réel

### Idées d'Extension
- ⏱️ Chronomètre
- 💬 Chat en jeu
- 📺 Replay de parties
- 🏆 Tournois
- 🤝 Système d'amis
- 📈 Classements

---

## 🎉 Vous Êtes Prêt!

Lancez simplement:
```bash
./start.sh
```

Puis ouvrez **http://localhost:3000**

**Bon jeu! ♔⚫🎮**

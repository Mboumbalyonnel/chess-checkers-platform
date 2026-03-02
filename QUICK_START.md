# 🚀 Guide de Démarrage Rapide

## Installation en 3 étapes

### 1️⃣ Installer les prérequis

**Node.js et npm:**
```bash
# Vérifier l'installation
node --version  # Doit être >= 16
npm --version

# Si non installé, télécharger depuis https://nodejs.org/
```

**MongoDB:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Télécharger depuis https://www.mongodb.com/try/download/community
```

### 2️⃣ Démarrer l'application

**Option A - Script automatique (recommandé):**
```bash
cd chess-checkers-platform
./start.sh
```

**Option B - Démarrage manuel:**
```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

### 3️⃣ Accéder à l'application

Ouvrez votre navigateur et allez sur:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 🎮 Premiers Pas

1. **Sans compte:**
   - Cliquez sur "Commencer à Jouer"
   - Sélectionnez un jeu (Échecs ou Dames)
   - Choisissez "Contre l'IA"
   - Sélectionnez la difficulté
   - Jouez!

2. **Avec compte:**
   - Cliquez sur "S'inscrire"
   - Créez votre compte
   - Accédez aux statistiques et à l'historique
   - Jouez en ligne contre d'autres joueurs

## ⚡ Commandes Utiles

```bash
# Vérifier si MongoDB fonctionne
sudo systemctl status mongodb

# Voir les logs du backend
cd backend && npm run dev

# Build de production du frontend
cd frontend && npm run build

# Installer une nouvelle dépendance
cd backend && npm install nom-package
cd frontend && npm install nom-package

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

## 🐛 Problèmes Courants

**Port déjà utilisé:**
```bash
# Tuer le processus sur le port 5000
lsof -i :5000
kill -9 [PID]

# Tuer le processus sur le port 3000
lsof -i :3000
kill -9 [PID]
```

**MongoDB ne démarre pas:**
```bash
# Vérifier les logs
tail -f /var/log/mongodb/mongod.log

# Redémarrer MongoDB
sudo systemctl restart mongodb
```

**Erreur de dépendances:**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

## 📞 Aide

Consultez le [README.md](README.md) complet pour plus d'informations.

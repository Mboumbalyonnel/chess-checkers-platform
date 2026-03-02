#  Plateforme de Jeux d'Échecs et de Dames

Une plateforme web moderne pour jouer aux échecs et aux dames en ligne ou contre l'IA, développée avec React, Node.js, MongoDB et Socket.IO.

##  Fonctionnalités

### Jeux Disponibles
-  **Échecs**: Jeu d'échecs complet avec toutes les règles officielles
-  **Dames**: Jeu de dames classique avec promotion des pièces

### Modes de Jeu
-  **Contre l'IA**: Trois niveaux de difficulté (Facile, Intermédiaire, Difficile)
-  **En Ligne**: Jouez contre d'autres joueurs en temps réel
-  **Local**: Jouez sans connexion (deux joueurs sur le même appareil)

### Fonctionnalités Utilisateur
-  Inscription et connexion sécurisées
-  Suivi des statistiques personnelles
-  Historique des parties
-  Sauvegarde automatique des progressions

## Technologies Utilisées

### Frontend
- **React** 18.2.0 - Framework UI
- **React Router** 6.20.0 - Navigation
- **Bootstrap** 5.3.2 - Framework CSS
- **React-Bootstrap** 2.9.1 - Composants Bootstrap pour React
- **Chess.js** - Logique du jeu d'échecs
- **React-Chessboard** - Interface d'échecs
- **Socket.IO Client** - Communication temps réel
- **Axios** - Requêtes HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **Socket.IO** - WebSocket pour le jeu en temps réel
- **JWT** - Authentification
- **bcryptjs** - Hash des mots de passe

##  Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- **Node.js** (version 16 ou supérieure)
- **npm** ou **yarn**
- **MongoDB** (version 5 ou supérieure)

## Installation

### 1. Cloner le projet

```bash
git clone <https://github.com/Mboumbalyonnel/chess-checkers-platform>
cd chess-checkers-platform
```

### 2. Installer MongoDB

#### Sur Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Sur macOS (avec Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Sur Windows:
Téléchargez et installez MongoDB depuis [mongodb.com](https://www.mongodb.com/try/download/community)

### 3. Configuration du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env
```

Exemple de configuration `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chess-checkers-db
JWT_SECRET=votre_secret_jwt_super_securise
CORS_ORIGIN=http://localhost:3000
```

### 4. Configuration du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install
```

##  Lancement de l'Application

### Option 1: Lancement manuel (mode développement)

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
Le serveur backend démarre sur `http://localhost:5000`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```
L'application React démarre sur `http://localhost:3000`

### Option 2: Lancement avec script (recommandé)

Créez un fichier `start.sh` à la racine:

```bash
#!/bin/bash

# Démarrer MongoDB
echo " Démarrage de MongoDB..."
sudo systemctl start mongodb

# Démarrer le backend
echo " Démarrage du backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
echo " Démarrage du frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo " Application démarrée!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"

# Attendre
wait $BACKEND_PID $FRONTEND_PID
```

Rendre le script exécutable et l'exécuter:
```bash
chmod +x start.sh
./start.sh
```

##  Structure du Projet

```
chess-checkers-platform/
├── frontend/                    # Application React
│   ├── public/
│   │   └── index.html          # Page HTML principale
│   ├── src/
│   │   ├── pages/              # Composants de pages
│   │   │   ├── Home.js         # Page d'accueil
│   │   │   ├── Login.js        # Page de connexion
│   │   │   ├── Register.js     # Page d'inscription
│   │   │   ├── GameSelection.js # Sélection de jeu
│   │   │   ├── ChessGame.js    # Jeu d'échecs
│   │   │   └── CheckersGame.js # Jeu de dames
│   │   ├── App.js              # Composant principal
│   │   ├── App.css             # Styles principaux
│   │   └── index.js            # Point d'entrée
│   └── package.json
│
├── backend/                     # API Node.js
│   ├── models/                 # Modèles MongoDB
│   │   ├── User.js             # Modèle utilisateur
│   │   └── Game.js             # Modèle partie
│   ├── routes/                 # Routes API
│   │   ├── auth.js             # Routes d'authentification
│   │   └── game.js             # Routes de jeu
│   ├── server.js               # Serveur principal
│   ├── .env.example            # Variables d'environnement exemple
│   └── package.json
│
└── README.md                    # Ce fichier
```

##  Utilisation

### 1. Page d'Accueil
- Cliquez sur "Commencer à Jouer" pour jouer sans compte
- Cliquez sur "Se Connecter" si vous avez un compte
- Cliquez sur "S'inscrire" pour créer un compte

### 2. Sélection du Jeu
1. Choisissez entre Échecs ou Dames
2. Sélectionnez le mode de jeu (IA ou En ligne)
3. Si mode IA, choisissez la difficulté
4. Cliquez sur "Commencer la Partie"

### 3. Pendant la Partie
- **Échecs**: Cliquez et glissez les pièces pour les déplacer
- **Dames**: Cliquez sur une pièce puis sur la case de destination
- Utilisez les boutons pour:
  - Nouvelle Partie
  - Annuler (échecs uniquement)
  - Retour au menu

##  Configuration Avancée

### Modifier le Port du Backend

Dans `backend/.env`:
```env
PORT=8080  # Au lieu de 5000
```

Dans `frontend/src/pages/*.js`, modifier l'URL de l'API:
```javascript
const response = await axios.post('http://localhost:8080/api/auth/login', formData);
```

### Activer HTTPS

Pour la production, configurez un reverse proxy (nginx) avec SSL:

```nginx
server {
    listen 443 ssl;
    server_name votredomaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

##  Dépannage

### Erreur de connexion à MongoDB

```bash
# Vérifier si MongoDB est en cours d'exécution
sudo systemctl status mongodb

# Démarrer MongoDB
sudo systemctl start mongodb

# Vérifier les logs
tail -f /var/log/mongodb/mongod.log
```

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 5000
lsof -i :5000

# Tuer le processus (remplacer PID par le numéro trouvé)
kill -9 PID
```

### Erreur CORS

Assurez-vous que `CORS_ORIGIN` dans `.env` correspond à l'URL du frontend:
```env
CORS_ORIGIN=http://localhost:3000
```

##  API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (authentifié)

### Jeu

- `POST /api/game/create` - Créer une partie (authentifié)
- `GET /api/game/history` - Historique des parties (authentifié)
- `GET /api/game/stats` - Statistiques utilisateur (authentifié)
- `POST /api/game/finish/:gameId` - Terminer une partie (authentifié)
- `GET /api/game/active` - Parties actives (authentifié)

### WebSocket Events

- `joinQueue` - Rejoindre la file d'attente
- `gameFound` - Partie trouvée
- `makeMove` - Faire un mouvement
- `opponentMove` - Mouvement de l'adversaire
- `opponentLeft` - Adversaire déconnecté

##  Déploiement en Production

### 1. Build du Frontend

```bash
cd frontend
npm run build
```

### 2. Servir avec Express

Dans `backend/server.js`, ajoutez:

```javascript
const path = require('path');

// Servir les fichiers statiques du build React
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Route catch-all pour React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
```

### 3. Variables d'Environnement Production

```env
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb://votre-serveur:27017/chess-checkers-db
JWT_SECRET=un_secret_vraiment_securise_et_long
CORS_ORIGIN=https://votredomaine.com
```

### 4. Démarrer avec PM2

```bash
npm install -g pm2
cd backend
pm2 start server.js --name chess-checkers
pm2 save
pm2 startup
```

##  Contribution

Les contributions sont les bienvenues! N'hésitez pas à:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

##  Licence

Ce projet est sous licence MIT.

##  Auteur

Développé avec ❤️ pour les amateurs de jeux de stratégie

##  Remerciements

- Chess.js pour la logique d'échecs
- React-Chessboard pour l'interface d'échecs
- Bootstrap pour le design
- La communauté open-source

##  Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Envoyez un email à Lyonnelmboumba2003@gmail.com

---

**Bon jeu! ♔**

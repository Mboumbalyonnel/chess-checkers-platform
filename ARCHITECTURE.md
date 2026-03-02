# 🏗️ Architecture du Projet - Plateforme Chess & Checkers

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         React Frontend (Port 3000)                    │  │
│  │  • React Router pour navigation                       │  │
│  │  • Bootstrap pour UI/UX                               │  │
│  │  • Axios pour requêtes HTTP                           │  │
│  │  • Socket.IO Client pour temps réel                   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP/HTTPS & WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────┐
│         Node.js Backend (Port 5000)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Express.js Server                                    │  │
│  │  • API REST pour authentification                     │  │
│  │  • API REST pour gestion des jeux                     │  │
│  │  • Socket.IO pour communication temps réel            │  │
│  │  • JWT pour sécurité                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Mongoose ODM
                   │
┌──────────────────▼──────────────────────────────────────────┐
│         MongoDB (Port 27017)                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Base de Données NoSQL                                │  │
│  │  • Collection Users                                   │  │
│  │  • Collection Games                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Structure Détaillée des Fichiers

```
chess-checkers-platform/
│
├── 📄 README.md                    # Documentation principale
├── 📄 QUICK_START.md               # Guide de démarrage rapide
├── 📄 FEATURES.md                  # Documentation des fonctionnalités
├── 📄 .gitignore                   # Fichiers à ignorer par Git
├── 🐳 docker-compose.yml           # Configuration Docker multi-conteneurs
├── 🚀 start.sh                     # Script de démarrage automatique
│
├── 📁 frontend/                    # Application React
│   ├── 📁 public/
│   │   └── index.html              # Page HTML de base
│   │
│   ├── 📁 src/
│   │   ├── 📁 pages/               # Composants pages
│   │   │   ├── Home.js             # Page d'accueil
│   │   │   ├── Login.js            # Page connexion
│   │   │   ├── Register.js         # Page inscription
│   │   │   ├── GameSelection.js    # Sélection de jeu
│   │   │   ├── ChessGame.js        # Jeu d'échecs
│   │   │   └── CheckersGame.js     # Jeu de dames
│   │   │
│   │   ├── App.js                  # Composant racine avec Router
│   │   ├── App.css                 # Styles principaux
│   │   ├── index.js                # Point d'entrée React
│   │   └── index.css               # Styles globaux
│   │
│   ├── package.json                # Dépendances frontend
│   ├── 🐳 Dockerfile               # Image Docker pour production
│   └── nginx.conf                  # Config Nginx pour production
│
└── 📁 backend/                     # API Node.js
    ├── 📁 models/                  # Modèles MongoDB
    │   ├── User.js                 # Modèle Utilisateur
    │   └── Game.js                 # Modèle Partie
    │
    ├── 📁 routes/                  # Routes API
    │   ├── auth.js                 # Routes authentification
    │   └── game.js                 # Routes jeu
    │
    ├── server.js                   # Serveur Express principal
    ├── package.json                # Dépendances backend
    ├── .env.example                # Variables d'environnement exemple
    └── 🐳 Dockerfile               # Image Docker pour production
```

## 🔄 Flux de Données

### 1. Authentification
```
User Form → Frontend
    ↓ (Axios POST)
Backend API /auth/register ou /auth/login
    ↓ (Mongoose)
MongoDB User Collection
    ↓ (JWT Token)
Frontend (localStorage) ← Backend Response
```

### 2. Création de Partie
```
Game Selection → Frontend
    ↓ (Axios POST)
Backend API /game/create
    ↓ (Mongoose)
MongoDB Game Collection
    ↓
Frontend Game Component
```

### 3. Jeu en Ligne (WebSocket)
```
Player 1 Move → Frontend
    ↓ (Socket.IO emit)
Backend Socket Handler
    ↓ (Socket.IO broadcast)
Player 2 Frontend ← Backend
    ↓
Update Game Board
```

## 🎯 Composants Frontend Principaux

### 1. **App.js** - Router Principal
- Gère toutes les routes
- Configuration React Router
- Point d'entrée de l'application

### 2. **Home.js** - Page d'Accueil
- Boutons navigation (Jouer, Login, Register)
- Vérification de l'authentification
- Interface d'accueil

### 3. **Login.js / Register.js** - Authentification
- Formulaires de connexion/inscription
- Validation côté client
- Gestion des erreurs
- Redirection après succès

### 4. **GameSelection.js** - Sélection
- Choix du jeu (Échecs/Dames)
- Choix du mode (IA/En ligne)
- Sélection de la difficulté
- Sauvegarde des paramètres

### 5. **ChessGame.js** - Jeu d'Échecs
- Intégration chess.js pour la logique
- React-Chessboard pour l'affichage
- Gestion de l'IA
- Historique des coups
- Détection fin de partie

### 6. **CheckersGame.js** - Jeu de Dames
- Logique personnalisée du jeu
- Rendu du plateau en CSS Grid
- Gestion des captures
- Promotion en dames
- IA avec 3 niveaux

## 🔧 Backend API Endpoints

### Authentification (`/api/auth`)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register` | POST | ❌ | Créer un compte |
| `/login` | POST | ❌ | Se connecter |
| `/profile` | GET | ✅ | Obtenir le profil |

### Jeu (`/api/game`)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/create` | POST | ✅ | Créer une partie |
| `/history` | GET | ✅ | Historique des parties |
| `/stats` | GET | ✅ | Statistiques utilisateur |
| `/finish/:id` | POST | ✅ | Terminer une partie |
| `/active` | GET | ✅ | Parties en cours |

## 🗄️ Modèles de Données MongoDB

### User Schema
```javascript
{
  username: String (unique, min: 3),
  email: String (unique, format email),
  password: String (hashed, min: 6),
  stats: {
    chessWins: Number,
    chessLosses: Number,
    checkersWins: Number,
    checkersLosses: Number,
    gamesPlayed: Number
  },
  createdAt: Date
}
```

### Game Schema
```javascript
{
  gameType: String (chess|checkers),
  players: [{
    userId: ObjectId,
    username: String,
    color: String
  }],
  winner: ObjectId,
  status: String (waiting|ongoing|finished|abandoned),
  moves: [{
    player: String,
    move: String,
    timestamp: Date
  }],
  gameMode: String (online|ai),
  difficulty: String (easy|intermediate|hard),
  createdAt: Date,
  finishedAt: Date
}
```

## 🔐 Sécurité

### Authentification
- **bcrypt**: Hash des mots de passe (10 rounds)
- **JWT**: Tokens avec expiration 7 jours
- **Middleware**: Vérification des tokens sur routes protégées

### Validation
- **express-validator**: Validation côté serveur
- **Client-side**: Validation formulaires React
- **Sanitization**: Nettoyage des entrées

### Headers Sécurité
- CORS configuré
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## 🚀 Déploiement

### Développement
```bash
./start.sh
```

### Production avec Docker
```bash
docker-compose up -d
```

### Production manuelle
```bash
# Build frontend
cd frontend && npm run build

# Démarrer backend avec PM2
cd backend
pm2 start server.js --name chess-backend
```

## 📊 Technologies et Dépendances

### Frontend
- React 18.2.0
- React Router 6.20.0
- Bootstrap 5.3.2
- Chess.js (logique échecs)
- Socket.IO Client
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT + bcrypt
- Express-validator

### DevOps
- Docker + Docker Compose
- Nginx (production)
- PM2 (process manager)

## 🎨 Système de Design

### Couleurs
- **Primaire**: Gradient violet (#667eea → #764ba2)
- **Secondaire**: Gradient rose (#f093fb → #f5576c)
- **Succès**: Gradient bleu (#4facfe → #00f2fe)

### Typographie
- Font principale: Segoe UI
- Fallback: system fonts

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

## 🔄 WebSocket Events

### Client → Server
- `joinQueue`: Rejoindre file d'attente
- `makeMove`: Envoyer un mouvement

### Server → Client
- `gameFound`: Partie trouvée
- `waitingForOpponent`: En attente
- `opponentMove`: Mouvement adversaire
- `opponentLeft`: Adversaire déconnecté

## ⚡ Performance

### Optimisations
- Code splitting React
- Lazy loading composants
- Cache MongoDB indexes
- Compression Gzip
- Static assets caching

### Monitoring
- Logs serveur
- Error handling
- Connection pooling MongoDB
- WebSocket heartbeat

---

**Architecture conçue pour être scalable, maintenable et performante! 🚀**

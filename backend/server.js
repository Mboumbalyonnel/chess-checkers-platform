const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-checkers-db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch((err) => console.error('❌ Erreur de connexion MongoDB:', err));

// Routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const tokenRoutes = require('./routes/tokens');
const passwordRoutes = require('./routes/passwordReset'); // ✅ NOUVELLE ROUTE

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/password', passwordRoutes); // ✅ NOUVELLE ROUTE AJOUTÉE

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Chess & Checkers' });
});

// Modèle User pour la gestion des jetons
const User = require('./models/User');

// Gestion des connexions Socket.IO
const activeGames = new Map();
const waitingPlayers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion:', socket.id);

  // Rejoindre une file d'attente
  socket.on('joinQueue', async ({ gameType, userId, mode }) => {
    console.log(`Joueur ${userId} rejoint la file ${gameType} (mode: ${mode})`);

    // Mode Solo = gratuit
    if (mode === 'solo') {
      socket.emit('gameReady', { mode: 'solo', gameType });
      return;
    }

    // Mode En Ligne = 10 jetons
    const GAME_COST = 10;

    try {
      const user = await User.findById(userId);

      if (!user) {
        socket.emit('error', { message: 'Utilisateur non trouvé' });
        return;
      }

      if (user.tokens < GAME_COST) {
        socket.emit('insufficientTokens', {
          required: GAME_COST,
          current: user.tokens,
          message: `Il vous faut ${GAME_COST} jetons pour jouer en ligne`
        });
        return;
      }

      user.tokens -= GAME_COST;
      await user.save();

      console.log(`✅ ${GAME_COST} jetons déduits. Solde restant: ${user.tokens}`);

      socket.emit('tokensDeducted', {
        amount: GAME_COST,
        remaining: user.tokens
      });

      // Appariement des joueurs
      if (waitingPlayers.has(gameType)) {
        const opponent = waitingPlayers.get(gameType);
        waitingPlayers.delete(gameType);

        const gameId = `game-${Date.now()}`;
        const gameData = {
          id: gameId,
          type: gameType,
          players: [opponent, { id: userId, socketId: socket.id }],
          currentPlayer: 0,
          board: null
        };

        activeGames.set(gameId, gameData);

        io.to(opponent.socketId).emit('gameFound', { gameId, playerNumber: 1 });
        socket.emit('gameFound', { gameId, playerNumber: 2 });

        console.log(`🎮 Partie créée: ${gameId}`);
      } else {
        waitingPlayers.set(gameType, { id: userId, socketId: socket.id });
        socket.emit('waitingForOpponent');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la déduction des jetons:', error);
      socket.emit('error', { message: 'Erreur serveur' });
    }
  });

  // Mouvement de jeu
  socket.on('makeMove', ({ gameId, move }) => {
    const game = activeGames.get(gameId);
    if (game) {
      game.players.forEach(player => {
        if (player.socketId !== socket.id) {
          io.to(player.socketId).emit('opponentMove', move);
        }
      });
    }
  });

  // Fin de partie
  socket.on('gameEnded', async ({ gameId, winnerId, loserId }) => {
    const WIN_REWARD = 15;
    const game = activeGames.get(gameId);

    try {
      // ── Gagnant ──────────────────────────────────────────────────────────
      if (winnerId) {
        const winner = await User.findById(winnerId);
        if (winner) {
          winner.tokens += WIN_REWARD;
          winner.stats.gamesPlayed += 1;

          if (game?.type === 'chess') winner.stats.chessWins += 1;
          else if (game?.type === 'checkers') winner.stats.checkersWins += 1;

          await winner.save();

          console.log(`🏆 ${winnerId} a gagné ${WIN_REWARD} jetons. Total: ${winner.tokens}`);

          // Notifier le gagnant
          if (game) {
            const winnerPlayer = game.players.find(p =>
              p.id.toString() === winnerId.toString()
            );
            if (winnerPlayer) {
              io.to(winnerPlayer.socketId).emit('winReward', {
                tokens: WIN_REWARD,
                total: winner.tokens,
                message: `Victoire! +${WIN_REWARD} jetons`
              });
            }
          }
        }
      }

      // ── Perdant ───────────────────────────────────────────────────────────
      if (loserId) {
        const loser = await User.findById(loserId);
        if (loser) {
          loser.stats.gamesPlayed += 1;

          if (game?.type === 'chess') loser.stats.chessLosses += 1;
          else if (game?.type === 'checkers') loser.stats.checkersLosses += 1;

          await loser.save();
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récompense:', error);
    } finally {
      // Toujours supprimer la partie, même en cas d'erreur
      activeGames.delete(gameId);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('🔌 Déconnexion:', socket.id);

    // Retirer de la file d'attente
    waitingPlayers.forEach((player, gameType) => {
      if (player.socketId === socket.id) {
        waitingPlayers.delete(gameType);
      }
    });

    // Notifier l'abandon de partie
    activeGames.forEach((game, gameId) => {
      const isInGame = game.players.some(p => p.socketId === socket.id);
      if (isInGame) {
        game.players.forEach(p => {
          if (p.socketId !== socket.id) {
            io.to(p.socketId).emit('opponentLeft');
          }
        });
        activeGames.delete(gameId);
      }
    });
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Socket.IO activé`);
  console.log(`🪙 Système de jetons actif`);
  console.log(`🔐 Routes de réinitialisation de mot de passe actives`); // ✅ NOUVEAU LOG
});

module.exports = { app, io };
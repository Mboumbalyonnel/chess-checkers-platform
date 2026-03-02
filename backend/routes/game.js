const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

// Créer une nouvelle partie
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { gameType, gameMode, difficulty } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    const game = new Game({
      gameType,
      gameMode,
      difficulty: gameMode === 'ai' ? difficulty : null,
      players: [{
        userId: user._id,
        username: user.username,
        color: 'white'
      }],
      status: gameMode === 'online' ? 'waiting' : 'ongoing'
    });

    await game.save();

    res.status(201).json({
      message: 'Partie créée',
      game
    });
  } catch (error) {
    console.error('Erreur lors de la création de la partie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir l'historique des parties d'un utilisateur
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const games = await Game.find({
      'players.userId': userId,
      status: 'finished'
    })
    .sort({ finishedAt: -1 })
    .limit(20)
    .populate('winner', 'username');

    res.json({ games });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les statistiques d'un utilisateur
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('stats username');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ 
      username: user.username,
      stats: user.stats 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Terminer une partie
router.post('/finish/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { winner, moves } = req.body;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }

    game.status = 'finished';
    game.winner = winner;
    game.moves = moves;
    game.finishedAt = new Date();

    await game.save();

    // Mettre à jour les statistiques
    if (winner) {
      const winnerUser = await User.findById(winner);
      const loserUser = await User.findById(
        game.players.find(p => p.userId.toString() !== winner.toString()).userId
      );

      if (winnerUser) {
        if (game.gameType === 'chess') {
          winnerUser.stats.chessWins += 1;
        } else {
          winnerUser.stats.checkersWins += 1;
        }
        winnerUser.stats.gamesPlayed += 1;
        await winnerUser.save();
      }

      if (loserUser) {
        if (game.gameType === 'chess') {
          loserUser.stats.chessLosses += 1;
        } else {
          loserUser.stats.checkersLosses += 1;
        }
        loserUser.stats.gamesPlayed += 1;
        await loserUser.save();
      }
    }

    res.json({
      message: 'Partie terminée',
      game
    });
  } catch (error) {
    console.error('Erreur lors de la fin de la partie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les parties en cours
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const games = await Game.find({
      'players.userId': userId,
      status: { $in: ['waiting', 'ongoing'] }
    })
    .populate('players.userId', 'username');

    res.json({ games });
  } catch (error) {
    console.error('Erreur lors de la récupération des parties actives:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Non autorisé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_super_securise');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// ── GET /api/tokens/balance ───────────────────────────────────────────────────
// Retourne le solde de jetons de l'utilisateur connecté
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({
      tokens: user.tokens,
      lastRefill: user.lastTokenRefill
    });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/tokens/daily-refill ─────────────────────────────────────────────
// Recharge quotidienne gratuite de 50 jetons (une fois par 24h)
router.post('/daily-refill', auth, async (req, res) => {
  const DAILY_REFILL = 50;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const now = new Date();
    const lastRefill = new Date(user.lastTokenRefill);

    // Vérifier si 24h se sont écoulées
    if (now - lastRefill < ONE_DAY) {
      const hoursLeft = Math.ceil((ONE_DAY - (now - lastRefill)) / (60 * 60 * 1000));
      return res.status(403).json({
        message: `Recharge disponible dans ${hoursLeft}h`,
        hoursLeft
      });
    }

    user.tokens += DAILY_REFILL;
    user.lastTokenRefill = now;
    await user.save();

    res.json({
      success: true,
      tokensAdded: DAILY_REFILL,
      totalTokens: user.tokens
    });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Secret pour JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

// Middleware de validation
const validateRegistration = [
  body('username').trim().isLength({ min: 3 }).withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

// Route d'inscription
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg 
      });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' 
      });
    }

    // ✅ CRÉER UN NOUVEL UTILISATEUR (tokens = 100 par défaut dans le schéma)
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // ✅ LOG pour vérifier les jetons
    console.log(`✅ Utilisateur créé: ${username} avec ${user.tokens} jetons`);

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ ENVOYER LES JETONS AU FRONTEND
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tokens: user.tokens,              // ✅ AJOUTÉ: Jetons
        lastTokenRefill: user.lastTokenRefill, // ✅ AJOUTÉ: Date recharge
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('❌ Erreur d\'inscription:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'inscription' 
    });
  }
});

// Route de connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg 
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ ENVOYER LES JETONS AU FRONTEND (aussi pour login!)
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tokens: user.tokens,              // ✅ AJOUTÉ: Jetons
        lastTokenRefill: user.lastTokenRefill, // ✅ AJOUTÉ: Date recharge
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion' 
    });
  }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Route pour obtenir le profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // ✅ ENVOYER LES JETONS AUSSI ICI
    res.json({ 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tokens: user.tokens,              // ✅ AJOUTÉ: Jetons
        lastTokenRefill: user.lastTokenRefill, // ✅ AJOUTÉ: Date recharge
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
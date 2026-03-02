const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Système de jetons
  tokens: {
    type: Number,
    default: 100  // 100 jetons gratuits à l'inscription
  },
  
  // Historique de recharge quotidienne
  lastTokenRefill: {
    type: Date,
    default: Date.now
  },
  
  // Champs pour la réinitialisation de mot de passe
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined
  },
  
  stats: {
    chessWins: {
      type: Number,
      default: 0
    },
    chessLosses: {
      type: Number,
      default: 0
    },
    checkersWins: {
      type: Number,
      default: 0
    },
    checkersLosses: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
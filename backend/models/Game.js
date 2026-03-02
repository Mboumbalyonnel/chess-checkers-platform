const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['chess', 'checkers'],
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    color: String
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'ongoing', 'finished', 'abandoned'],
    default: 'waiting'
  },
  moves: [{
    player: String,
    move: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  gameMode: {
    type: String,
    enum: ['online', 'ai'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'intermediate', 'hard'],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  finishedAt: {
    type: Date,
    default: null
  }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;

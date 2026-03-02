/* eslint-disable no-restricted-globals */

import { Chess } from 'chess.js';

// Valeurs des pièces optimisées
const PIECE_VALUES = { 
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

// Tables de position stratégiques COMPLÈTES
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 27, 27, 10,  5,  5,
     0,  0,  0, 25, 25,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-25,-25, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  5,  5,  0,  0,  0,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     5, 10, 10, 10, 10, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -10,  5,  5,  5,  5,  5,  0,-10,
      0,  0,  5,  5,  5,  5,  0, -5,
     -5,  0,  5,  5,  5,  5,  0, -5,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
     20, 30, 10,  0,  0, 10, 30, 20,
     20, 20,  0,  0,  0,  0, 20, 20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
};

// Cache de positions
const transpositionTable = new Map();
const MAX_TABLE_SIZE = 500000;

function getCacheKey(chess) {
  return chess.fen().split(' ').slice(0, 4).join(' ');
}

// Trouver la position du roi
function findKingPosition(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece?.type === 'k' && piece.color === color) {
        return { rank: r, file: f };
      }
    }
  }
  return null;
}

// Évaluation AVANCÉE de position
function evaluatePosition(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();
  let totalMaterial = 0;
  let whitePieces = 0, blackPieces = 0;

  // Évaluation matérielle et positionnelle
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];
      totalMaterial += value;
      
      if (piece.color === 'w') whitePieces++;
      else blackPieces++;
      
      const pstIndex = piece.color === 'w' ? r * 8 + f : (7 - r) * 8 + f;
      const positional = PST[piece.type][pstIndex] || 0;

      score += piece.color === 'w' ? value + positional : -(value + positional);
    }
  }

  // Mobilité
  const moves = chess.moves().length;
  score += chess.turn() === 'w' ? moves * 3 : -moves * 3;

  // Contrôle du centre
  const centerSquares = [
    [3, 3], [3, 4], [4, 3], [4, 4],
    [2, 2], [2, 3], [2, 4], [2, 5],
    [5, 2], [5, 3], [5, 4], [5, 5]
  ];
  
  for (const [r, f] of centerSquares) {
    const piece = board[r][f];
    if (piece) {
      const bonus = (r === 3 || r === 4) && (f === 3 || f === 4) ? 15 : 8;
      score += piece.color === 'w' ? bonus : -bonus;
    }
  }

  // Structure de pions
  for (let f = 0; f < 8; f++) {
    let whitePawns = 0, blackPawns = 0;
    for (let r = 0; r < 8; r++) {
      const piece = board[r][f];
      if (piece?.type === 'p') {
        if (piece.color === 'w') whitePawns++;
        else blackPawns++;
      }
    }
    if (whitePawns > 1) score -= 10 * (whitePawns - 1);
    if (blackPawns > 1) score += 10 * (blackPawns - 1);
  }

  // Sécurité du roi
  if (totalMaterial > 3000) {
    const whiteKing = findKingPosition(board, 'w');
    const blackKing = findKingPosition(board, 'b');
    
    if (whiteKing && (whiteKing.file === 6 || whiteKing.file === 2)) score += 30;
    if (blackKing && (blackKing.file === 6 || blackKing.file === 2)) score -= 30;
  }

  return score;
}

// Tri optimisé des coups
function orderMoves(chess, moves) {
  const moveScores = moves.map(move => {
    let score = 0;
    
    if (move.captured) {
      score += 1000 + PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
    }
    
    if (move.promotion) score += 900;
    
    chess.move(move);
    if (chess.inCheck()) score += 50;
    chess.undo();
    
    if ((move.piece === 'n' || move.piece === 'b') && 
        (move.from[1] === '1' || move.from[1] === '8')) {
      score += 30;
    }
    
    return { move, score };
  });

  return moveScores
    .sort((a, b) => b.score - a.score)
    .map(m => m.move);
}

// Minimax avec alpha-beta
function minimax(chess, depth, alpha, beta, isMaximizing, startTime, maxTime) {
  if (Date.now() - startTime > maxTime) {
    return evaluatePosition(chess);
  }

  const key = getCacheKey(chess) + depth + (isMaximizing ? '1' : '0');
  
  if (transpositionTable.has(key)) {
    return transpositionTable.get(key);
  }

  if (depth === 0 || chess.isGameOver()) {
    const score = evaluatePosition(chess);
    if (transpositionTable.size < MAX_TABLE_SIZE) {
      transpositionTable.set(key, score);
    }
    return score;
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return evaluatePosition(chess);

  const orderedMoves = orderMoves(chess, moves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      if (Date.now() - startTime > maxTime) break;
      
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, startTime, maxTime);
      chess.undo();
      
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    
    if (transpositionTable.size < MAX_TABLE_SIZE) {
      transpositionTable.set(key, maxEval);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      if (Date.now() - startTime > maxTime) break;
      
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, startTime, maxTime);
      chess.undo();
      
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    
    if (transpositionTable.size < MAX_TABLE_SIZE) {
      transpositionTable.set(key, minEval);
    }
    return minEval;
  }
}

function getBestMove(data) {
  const { fen, difficulty } = data;
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  
  if (!moves.length) return null;

  if (transpositionTable.size > MAX_TABLE_SIZE * 0.9) {
    transpositionTable.clear();
  }

  const startTime = Date.now();
  
  // FACILE - 1 seconde
  if (difficulty === 'easy') {
    const maxTime = 1000;
    
    if (Math.random() < 0.4) {
      const badMoves = moves.filter(m => !m.captured && !m.promotion);
      if (badMoves.length > 0) {
        return badMoves[Math.floor(Math.random() * badMoves.length)].san;
      }
    }
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    const orderedMoves = orderMoves(chess, moves).slice(0, 10);
    
    for (const move of orderedMoves) {
      if (Date.now() - startTime > maxTime) break;
      
      chess.move(move);
      const score = evaluatePosition(chess);
      chess.undo();
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove.san;
  }

  // INTERMÉDIAIRE - 2 secondes
  if (difficulty === 'intermediate') {
    const maxTime = 2000;
    const depth = 4;
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    const orderedMoves = orderMoves(chess, moves).slice(0, 15);
    
    for (const move of orderedMoves) {
      if (Date.now() - startTime > maxTime) break;
      
      chess.move(move);
      const score = -minimax(chess, depth - 1, -Infinity, Infinity, false, startTime, maxTime);
      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.san;
  }

  // DIFFICILE - 4 secondes (quasi imbattable)
  const maxTime = 4000;
  let depth = 6;
  
  const moveCount = moves.length;
  if (moveCount > 35) depth = 5;
  else if (moveCount < 15) depth = 7;
  else if (moveCount < 8) depth = 8;
  
  let bestMove = moves[0];
  let bestScore = -Infinity;
  const orderedMoves = orderMoves(chess, moves);
  
  for (const move of orderedMoves) {
    if (Date.now() - startTime > maxTime) break;
    
    chess.move(move);
    const score = -minimax(chess, depth - 1, -Infinity, Infinity, false, startTime, maxTime);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove.san;
}

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  if (type === 'getBestMove') {
    const bestMove = getBestMove(payload);
    self.postMessage({ type: 'bestMove', payload: bestMove });
  }
};
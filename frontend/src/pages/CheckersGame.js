import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const BOARD_SIZE = 8;
const EMPTY = null;
const RED = 'red';
const BLACK = 'black';
const PAWN = 'pawn';
const KING = 'king';

// ─── PIECE CLASS ─────────────────────────────────────────────────────────────
class Piece {
  constructor(color, type = PAWN) {
    this.color = color;
    this.type = type;
  }

  isKing() {
    return this.type === KING;
  }

  makeKing() {
    this.type = KING;
  }

  clone() {
    return new Piece(this.color, this.type);
  }
}

// ─── ENGINE ───────────────────────────────────────────────────────────────────

const copyBoard = (board) => {
  return board.map(row => row.map(cell => (cell ? cell.clone() : null)));
};

const boardKey = (board) => {
  let key = '';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece) {
        key += '.';
      } else {
        const colorChar = piece.color === BLACK ? 'b' : 'r';
        const typeChar = piece.isKing() ? 'K' : 'P';
        key += colorChar + typeChar;
      }
    }
  }
  return key;
};

const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

// CORRECTION 1: Les pions peuvent capturer en avant ET en arrière
const getPawnMoves = (board, row, col, onlyCaptures = false) => {
  const piece = board[row][col];
  if (!piece || piece.isKing()) return [];

  const moves = [];
  // Toutes les directions diagonales pour les captures
  const allDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  // Captures dans toutes les directions
  for (const [dr, dc] of allDirections) {
    const captureRow = row + dr;
    const captureCol = col + dc;
    const landingRow = row + 2 * dr;
    const landingCol = col + 2 * dc;

    if (isValidPosition(landingRow, landingCol)) {
      const capturedPiece = board[captureRow]?.[captureCol];
      if (capturedPiece && 
          capturedPiece.color !== piece.color && 
          !board[landingRow][landingCol]) {
        moves.push({
          from: { row, col },
          to: { row: landingRow, col: landingCol },
          isCapture: true,
          capturedRow: captureRow,
          capturedCol: captureCol,
          capturedPiece
        });
      }
    }
  }

  // Mouvements simples (seulement si pas de captures obligatoires)
  if (!onlyCaptures && moves.length === 0) {
    // Pour les mouvements simples, les pions ne peuvent avancer que vers l'avant
    const forwardDir = piece.color === RED ? -1 : 1;
    const simpleDirections = [[forwardDir, -1], [forwardDir, 1]];
    
    for (const [dr, dc] of simpleDirections) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({
          from: { row, col },
          to: { row: newRow, col: newCol },
          isCapture: false
        });
      }
    }
  }

  return moves;
};

// Obtient toutes les captures pour une dame à partir d'une position
const getKingCapturesFromPosition = (board, row, col, visited = new Set()) => {
  const piece = board[row][col];
  if (!piece || !piece.isKing()) return [];

  const captures = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const posKey = `${row},${col}`;
  
  if (visited.has(posKey)) return [];
  visited.add(posKey);

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    let capturedPiece = null;
    let capturedRow = -1, capturedCol = -1;

    while (isValidPosition(r, c)) {
      if (!board[r][c]) {
        if (capturedPiece) {
          captures.push({
            from: { row, col },
            to: { row: r, col: c },
            isCapture: true,
            capturedRow,
            capturedCol,
            capturedPiece
          });
        }
        r += dr;
        c += dc;
      } else if (!capturedPiece && board[r][c].color !== piece.color) {
        capturedPiece = board[r][c];
        capturedRow = r;
        capturedCol = c;
        r += dr;
        c += dc;
      } else {
        break;
      }
    }
  }

  visited.delete(posKey);
  return captures;
};

// Obtient tous les mouvements pour une dame
const getKingMoves = (board, row, col, onlyCaptures = false) => {
  const piece = board[row][col];
  if (!piece || !piece.isKing()) return [];

  const moves = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    let foundCapture = false;

    while (isValidPosition(r, c)) {
      if (!board[r][c]) {
        if (!foundCapture && !onlyCaptures) {
          moves.push({
            from: { row, col },
            to: { row: r, col: c },
            isCapture: false
          });
        }
        r += dr;
        c += dc;
      } else if (board[r][c].color !== piece.color && !foundCapture) {
        foundCapture = true;
        const landingRow = r + dr;
        const landingCol = c + dc;
        
        if (isValidPosition(landingRow, landingCol) && !board[landingRow][landingCol]) {
          moves.push({
            from: { row, col },
            to: { row: landingRow, col: landingCol },
            isCapture: true,
            capturedRow: r,
            capturedCol: c,
            capturedPiece: board[r][c]
          });
        }
        break;
      } else {
        break;
      }
    }
  }

  return moves;
};

// Obtient tous les mouvements pour une pièce
const getMovesForPiece = (board, row, col, onlyCaptures = false) => {
  const piece = board[row][col];
  if (!piece) return [];

  let moves = piece.isKing() 
    ? getKingMoves(board, row, col, onlyCaptures)
    : getPawnMoves(board, row, col, onlyCaptures);

  return moves;
};

// Vérifie si une capture est disponible pour une couleur
const hasCaptures = (board, color) => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getMovesForPiece(board, r, c, true);
        if (moves.some(m => m.isCapture)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Obtient tous les mouvements valides pour une couleur
const getAllMoves = (board, color, onlyCaptures = false) => {
  const allMoves = [];
  const captures = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getMovesForPiece(board, r, c, onlyCaptures);
        for (const move of moves) {
          if (move.isCapture) {
            captures.push(move);
          } else if (!onlyCaptures) {
            allMoves.push(move);
          }
        }
      }
    }
  }

  // Les captures sont obligatoires
  return captures.length > 0 ? captures : allMoves;
};

// Applique un mouvement sur le plateau
const applyMove = (board, move) => {
  const newBoard = copyBoard(board);
  const piece = newBoard[move.from.row][move.from.col];
  
  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;

  if (move.isCapture) {
    newBoard[move.capturedRow][move.capturedCol] = null;
  }

  return newBoard;
};

// Obtient les captures supplémentaires après un mouvement
const getAdditionalCaptures = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = piece.isKing()
    ? getKingCapturesFromPosition(board, row, col)
    : getPawnMoves(board, row, col, true);

  return moves.filter(m => m.isCapture);
};

// Évaluation avancée du plateau
const evaluateBoard = (board, color) => {
  let score = 0;
  let redCount = 0, blackCount = 0;
  let redKings = 0, blackKings = 0;
  
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      if (piece.color === BLACK) {
        blackCount++;
        if (piece.isKing()) blackKings++;
      } else {
        redCount++;
        if (piece.isKing()) redKings++;
      }

      // Valeur de base
      const baseValue = piece.isKing() ? 3 : 1;
      const multiplier = piece.color === BLACK ? 1 : -1;

      // Bonus de position
      let positionBonus = 0;
      
      // Les pions avancés valent plus
      if (!piece.isKing()) {
        if (piece.color === BLACK) {
          positionBonus += r * 0.2; // Plus on est proche de la ligne de promotion, mieux c'est
        } else {
          positionBonus += (7 - r) * 0.2;
        }
      } else {
        // Les dames sont plus fortes au centre
        const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        positionBonus += (7 - centerDist) * 0.1;
      }

      // Cases centrales valorisées
      if (c >= 2 && c <= 5) {
        positionBonus += 0.15;
      }

      // Protection des pions (éviter les isolations)
      let protectionBonus = 0;
      if (!piece.isKing()) {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
          const adjR = r + dr, adjC = c + dc;
          if (isValidPosition(adjR, adjC) && board[adjR]?.[adjC]?.color === piece.color) {
            protectionBonus += 0.1;
            break;
          }
        }
      }

      score += (baseValue + positionBonus + protectionBonus) * multiplier;
    }
  }

  // Bonus/Malus basé sur le rapport de force
  const totalPieces = redCount + blackCount;
  if (totalPieces > 0) {
    const advantage = (blackCount + blackKings * 2) - (redCount + redKings * 2);
    score += advantage * 0.5;
  }

  return score;
};

// Minimax avec alpha-beta pruning et table de transposition
const minimax = (board, depth, alpha, beta, maximizingPlayer, tt, colorToMove = null) => {
  const color = maximizingPlayer ? BLACK : RED;
  const key = boardKey(board) + (maximizingPlayer ? '1' : '0') + depth;
  const cached = tt.get(key);
  
  if (cached !== undefined && cached.depth >= depth) {
    return cached.score;
  }

  if (depth === 0) {
    const score = evaluateBoard(board, color);
    tt.set(key, { score, depth: 0 });
    return score;
  }

  const moves = getAllMoves(board, color);
  
  if (moves.length === 0) {
    // Aucun mouvement disponible : le joueur perd
    const score = maximizingPlayer ? -1000 : 1000;
    tt.set(key, { score, depth });
    return score;
  }

  // Trier les moves pour un meilleur pruning (captures d'abord)
  moves.sort((a, b) => {
    if (a.isCapture && !b.isCapture) return -1;
    if (!a.isCapture && b.isCapture) return 1;
    return 0;
  });

  if (maximizingPlayer) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      
      // Gérer les captures multiples
      if (move.isCapture) {
        let currentBoard = newBoard;
        let currentRow = move.to.row;
        let currentCol = move.to.col;
        let additionalCaptures = getAdditionalCaptures(currentBoard, currentRow, currentCol);
        
        while (additionalCaptures.length > 0) {
          const nextCapture = additionalCaptures[0];
          const captureMove = {
            from: { row: currentRow, col: currentCol },
            to: nextCapture.to,
            isCapture: true,
            capturedRow: nextCapture.capturedRow,
            capturedCol: nextCapture.capturedCol
          };
          currentBoard = applyMove(currentBoard, captureMove);
          currentRow = nextCapture.to.row;
          currentCol = nextCapture.to.col;
          additionalCaptures = getAdditionalCaptures(currentBoard, currentRow, currentCol);
        }
        
        const score = minimax(currentBoard, depth - 1, alpha, beta, false, tt);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
      } else {
        const score = minimax(newBoard, depth - 1, alpha, beta, false, tt);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
      }
      
      if (beta <= alpha) break;
    }
    tt.set(key, { score: maxScore, depth });
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      
      // Gérer les captures multiples
      if (move.isCapture) {
        let currentBoard = newBoard;
        let currentRow = move.to.row;
        let currentCol = move.to.col;
        let additionalCaptures = getAdditionalCaptures(currentBoard, currentRow, currentCol);
        
        while (additionalCaptures.length > 0) {
          const nextCapture = additionalCaptures[0];
          const captureMove = {
            from: { row: currentRow, col: currentCol },
            to: nextCapture.to,
            isCapture: true,
            capturedRow: nextCapture.capturedRow,
            capturedCol: nextCapture.capturedCol
          };
          currentBoard = applyMove(currentBoard, captureMove);
          currentRow = nextCapture.to.row;
          currentCol = nextCapture.to.col;
          additionalCaptures = getAdditionalCaptures(currentBoard, currentRow, currentCol);
        }
        
        const score = minimax(currentBoard, depth - 1, alpha, beta, true, tt);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
      } else {
        const score = minimax(newBoard, depth - 1, alpha, beta, true, tt);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
      }
      
      if (beta <= alpha) break;
    }
    tt.set(key, { score: minScore, depth });
    return minScore;
  }
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function CheckersGame() {
  const navigate = useNavigate();
  const [gameSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gameSettings') || '{}'); } catch { return {}; }
  });

  const isOnline = gameSettings?.mode === 'online';

  const socketRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState('connecting');
  const [myColor, setMyColor] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [onlineMessage, setOnlineMessage] = useState('Connexion au serveur...');
  const [winReward, setWinReward] = useState(null);

  const initBoard = () => {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = new Piece(BLACK, PAWN);
        }
      }
    }

    for (let r = 5; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = new Piece(RED, PAWN);
        }
      }
    }

    return board;
  };

  const [board, setBoard] = useState(initBoard);
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(RED);
  const [gameStatus, setGameStatus] = useState('En cours');
  const [captured, setCaptured] = useState({ red: 0, black: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [newKings, setNewKings] = useState([]);
  const [mustContinueFrom, setMustContinueFrom] = useState(null);
  const boardRef = useRef(board);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Socket.io (identique à avant)
  useEffect(() => {
    if (!isOnline) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    if (!userId) {
      navigate('/login');
      return;
    }

    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setOnlineMessage("Recherche d'un adversaire...");
      socket.emit('joinQueue', { gameType: 'checkers', userId, mode: 'online' });
    });

    socket.on('waitingForOpponent', () => {
      setOnlineStatus('waiting');
      setOnlineMessage("En attente d'un adversaire...");
    });

    socket.on('insufficientTokens', ({ required, current }) => {
      setOnlineStatus('ended');
      setOnlineMessage(`Jetons insuffisants — Requis : ${required}, Disponible : ${current}`);
    });

    socket.on('gameFound', ({ gameId: gId, playerNumber }) => {
      setGameId(gId);
      const color = playerNumber === 1 ? RED : BLACK;
      setMyColor(color);
      setOnlineStatus('playing');
      setOnlineMessage(color === RED ? 'Vous jouez les Rouges' : 'Vous jouez les Noirs');
    });

    socket.on('opponentMove', (moveData) => {
      if (moveData.boardSnapshot) {
        const newBoard = moveData.boardSnapshot.map(row =>
          row.map(cell =>
            cell ? new Piece(cell.color, cell.type) : null
          )
        );
        setBoard(newBoard);
        setCurrentPlayer(moveData.nextPlayer);
        setLastMove({ from: moveData.from, to: moveData.to });
        setMoveCount(p => p + 1);
        if (moveData.capturedCount > 0) {
          setCaptured(p => ({
            ...p,
            [moveData.color === RED ? 'red' : 'black']: p[moveData.color === RED ? 'red' : 'black'] + moveData.capturedCount
          }));
        }
      }
    });

    socket.on('opponentLeft', () => {
      setOnlineStatus('ended');
      setOnlineMessage('Votre adversaire a abandonné la partie.');
    });

    socket.on('winReward', ({ tokens, total }) => {
      setWinReward({ tokens, total });
      setTimeout(() => setWinReward(null), 5000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOnline, navigate]);

  const checkWin = useCallback((board, justMoved) => {
    const opponent = justMoved === RED ? BLACK : RED;
    const opponentMoves = getAllMoves(board, opponent);
    
    if (opponentMoves.length === 0) {
      setGameStatus(`${justMoved === RED ? 'Rouges' : 'Noirs'} gagnent !`);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!isOnline || !gameId || gameStatus === 'En cours' || onlineStatus !== 'playing') return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    const socket = socketRef.current;

    if (!socket || !userId) return;

    const iWon = gameStatus.includes(myColor === RED ? 'Rouges' : 'Noirs');
    socket.emit('gameEnded', {
      gameId,
      winnerId: iWon ? userId : null,
      loserId: iWon ? null : userId
    });
    setOnlineStatus('ended');
  }, [gameStatus, isOnline, gameId, onlineStatus, myColor]);

  // Gestion des clics (identique mais avec les nouvelles fonctions)
  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'En cours') return;
    if (gameSettings?.mode === 'ai' && currentPlayer !== RED) return;
    if (isOnline && (onlineStatus !== 'playing' || currentPlayer !== myColor)) return;
    if (isThinking) return;

    if (mustContinueFrom) {
      if (mustContinueFrom.row === row && mustContinueFrom.col === col) {
        const additionalCaptures = getAdditionalCaptures(board, row, col);
        if (additionalCaptures.length > 0) {
          setSelected({ row, col });
          setValidMoves(additionalCaptures);
        }
        return;
      }
      
      if (selected && selected.row === mustContinueFrom.row && selected.col === mustContinueFrom.col) {
        const move = validMoves.find(m => m.to.row === row && m.to.col === col);
        
        if (move) {
          const newBoard = applyMove(board, move);
          
          setBoard(newBoard);
          setLastMove({ from: selected, to: { row, col } });
          setMoveCount(p => p + 1);
          
          if (move.isCapture) {
            setCaptured(p => ({
              ...p,
              [currentPlayer === RED ? 'red' : 'black']: p[currentPlayer === RED ? 'red' : 'black'] + 1
            }));
          }

          const furtherCaptures = getAdditionalCaptures(newBoard, row, col);
          
          if (furtherCaptures.length > 0) {
            setSelected({ row, col });
            setValidMoves(furtherCaptures);
            setMustContinueFrom({ row, col });
            return;
          }

          const movedPiece = newBoard[row][col];
          if (movedPiece && !movedPiece.isKing()) {
            if ((movedPiece.color === RED && row === 0) || 
                (movedPiece.color === BLACK && row === 7)) {
              movedPiece.makeKing();
              const key = `${row}-${col}`;
              setNewKings(p => [...p, key]);
              setTimeout(() => setNewKings(p => p.filter(k => k !== key)), 2000);
            }
          }

          setSelected(null);
          setValidMoves([]);
          setMustContinueFrom(null);

          const won = checkWin(newBoard, currentPlayer);
          const nextPlayer = currentPlayer === RED ? BLACK : RED;

          if (isOnline && socketRef.current && gameId) {
            socketRef.current.emit('makeMove', {
              gameId,
              move: {
                from: selected,
                to: { row, col },
                color: currentPlayer,
                capturedCount: move.isCapture ? 1 : 0,
                boardSnapshot: newBoard.map(row => 
                  row.map(cell => cell ? { color: cell.color, type: cell.type } : null)
                ),
                nextPlayer: won ? null : nextPlayer
              }
            });
          }

          if (!won) {
            setCurrentPlayer(nextPlayer);
          }
          return;
        }
      }
      return;
    }

    if (selected && validMoves.some(m => m.to.row === row && m.to.col === col)) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      const newBoard = applyMove(board, move);
      
      setBoard(newBoard);
      setLastMove({ from: selected, to: { row, col } });
      setMoveCount(p => p + 1);

      if (move.isCapture) {
        setCaptured(p => ({
          ...p,
          [currentPlayer === RED ? 'red' : 'black']: p[currentPlayer === RED ? 'red' : 'black'] + 1
        }));
      }

      if (move.isCapture) {
        const furtherCaptures = getAdditionalCaptures(newBoard, row, col);
        
        if (furtherCaptures.length > 0) {
          setSelected({ row, col });
          setValidMoves(furtherCaptures);
          setMustContinueFrom({ row, col });
          return;
        }
      }

      const movedPiece = newBoard[row][col];
      if (movedPiece && !movedPiece.isKing()) {
        if ((movedPiece.color === RED && row === 0) || 
            (movedPiece.color === BLACK && row === 7)) {
          movedPiece.makeKing();
          const key = `${row}-${col}`;
          setNewKings(p => [...p, key]);
          setTimeout(() => setNewKings(p => p.filter(k => k !== key)), 2000);
        }
      }

      setSelected(null);
      setValidMoves([]);

      const won = checkWin(newBoard, currentPlayer);
      const nextPlayer = currentPlayer === RED ? BLACK : RED;

      if (isOnline && socketRef.current && gameId) {
        socketRef.current.emit('makeMove', {
          gameId,
          move: {
            from: selected,
            to: { row, col },
            color: currentPlayer,
            capturedCount: move.isCapture ? 1 : 0,
            boardSnapshot: newBoard.map(row => 
              row.map(cell => cell ? { color: cell.color, type: cell.type } : null)
            ),
            nextPlayer: won ? null : nextPlayer
          }
        });
      }

      if (!won) {
        setCurrentPlayer(nextPlayer);
      }
      return;
    }

    const piece = board[row][col];
    if (piece && piece.color === currentPlayer) {
      const capturesExist = hasCaptures(board, currentPlayer);
      const moves = getMovesForPiece(board, row, col, capturesExist);
      
      if (moves.length > 0) {
        setSelected({ row, col });
        setValidMoves(moves);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  }, [board, selected, validMoves, currentPlayer, gameStatus, gameSettings, isOnline, onlineStatus, myColor, isThinking, mustContinueFrom, checkWin, gameId]);

  // CORRECTION 2: IA avec niveaux de difficulté progressifs
  useEffect(() => {
    if (gameSettings?.mode !== 'ai' || currentPlayer !== BLACK || isThinking || gameStatus !== 'En cours') {
      return;
    }

    setIsThinking(true);

    setTimeout(() => {
      const currentBoard = boardRef.current;
      const moves = getAllMoves(currentBoard, BLACK);

      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

      let bestMove = null;
      const tt = new Map();

      // NIVEAU FACILE (Débutant) - Erreurs volontaires
      if (gameSettings.difficulty === 'easy') {
        // 40% de chances de faire un mauvais coup
        if (Math.random() < 0.4) {
          // Prendre un mauvais coup (non-capture si possible)
          const badMoves = moves.filter(m => !m.isCapture);
          if (badMoves.length > 0) {
            bestMove = badMoves[Math.floor(Math.random() * badMoves.length)];
          } else {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          }
        } else {
          // Sinon, jouer aléatoirement mais avec priorité aux captures
          const captures = moves.filter(m => m.isCapture);
          if (captures.length > 0) {
            bestMove = captures[Math.floor(Math.random() * captures.length)];
          } else {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          }
        }
      }
      // NIVEAU INTERMÉDIAIRE (Bon joueur de club)
      else if (gameSettings.difficulty === 'intermediate') {
        // Profondeur 3 avec évaluation basique
        let bestScore = -Infinity;
        for (const move of moves) {
          const newBoard = applyMove(currentBoard, move);
          
          // Simuler les captures multiples
          let finalBoard = newBoard;
          if (move.isCapture) {
            let currentRow = move.to.row;
            let currentCol = move.to.col;
            let additionalCaptures = getAdditionalCaptures(finalBoard, currentRow, currentCol);
            
            while (additionalCaptures.length > 0) {
              const nextCapture = additionalCaptures[0];
              const captureMove = {
                from: { row: currentRow, col: currentCol },
                to: nextCapture.to,
                isCapture: true,
                capturedRow: nextCapture.capturedRow,
                capturedCol: nextCapture.capturedCol
              };
              finalBoard = applyMove(finalBoard, captureMove);
              currentRow = nextCapture.to.row;
              currentCol = nextCapture.to.col;
              additionalCaptures = getAdditionalCaptures(finalBoard, currentRow, currentCol);
            }
          }
          
          // Évaluation rapide
          const score = evaluateBoard(finalBoard, BLACK);
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
      // NIVEAU DIFFICILE (Expert - quasi imbattable)
      else {
        // Profondeur 7 avec minimav complet
        const depth = 7;
        let bestScore = -Infinity;
        
        // Trier les moves pour optimiser
        moves.sort((a, b) => {
          if (a.isCapture && !b.isCapture) return -1;
          if (!a.isCapture && b.isCapture) return 1;
          return 0;
        });
        
        for (const move of moves) {
          const newBoard = applyMove(currentBoard, move);
          
          // Gérer les captures multiples
          let finalBoard = newBoard;
          if (move.isCapture) {
            let currentRow = move.to.row;
            let currentCol = move.to.col;
            let additionalCaptures = getAdditionalCaptures(finalBoard, currentRow, currentCol);
            
            while (additionalCaptures.length > 0) {
              const nextCapture = additionalCaptures[0];
              const captureMove = {
                from: { row: currentRow, col: currentCol },
                to: nextCapture.to,
                isCapture: true,
                capturedRow: nextCapture.capturedRow,
                capturedCol: nextCapture.capturedCol
              };
              finalBoard = applyMove(finalBoard, captureMove);
              currentRow = nextCapture.to.row;
              currentCol = nextCapture.to.col;
              additionalCaptures = getAdditionalCaptures(finalBoard, currentRow, currentCol);
            }
          }
          
          const score = minimax(finalBoard, depth - 1, -Infinity, Infinity, false, tt);
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }

      if (bestMove) {
        // Appliquer le mouvement avec toutes ses captures
        let newBoard = applyMove(currentBoard, bestMove);
        let currentRow = bestMove.to.row;
        let currentCol = bestMove.to.col;
        let totalCaptured = bestMove.isCapture ? 1 : 0;
        let lastPos = { row: currentRow, col: currentCol };
        let moveSequence = [bestMove];

        if (bestMove.isCapture) {
          let additionalCaptures = getAdditionalCaptures(newBoard, currentRow, currentCol);
          
          while (additionalCaptures.length > 0) {
            const nextCapture = additionalCaptures[0];
            const captureMove = {
              from: { row: currentRow, col: currentCol },
              to: nextCapture.to,
              isCapture: true,
              capturedRow: nextCapture.capturedRow,
              capturedCol: nextCapture.capturedCol,
              capturedPiece: nextCapture.capturedPiece
            };
            
            newBoard = applyMove(newBoard, captureMove);
            moveSequence.push(captureMove);
            
            totalCaptured++;
            currentRow = nextCapture.to.row;
            currentCol = nextCapture.to.col;
            lastPos = { row: currentRow, col: currentCol };
            
            additionalCaptures = getAdditionalCaptures(newBoard, currentRow, currentCol);
          }
        }

        // Vérifier la promotion
        const finalPiece = newBoard[lastPos.row][lastPos.col];
        if (finalPiece && !finalPiece.isKing() &&
            ((finalPiece.color === BLACK && lastPos.row === 7) ||
             (finalPiece.color === RED && lastPos.row === 0))) {
          finalPiece.makeKing();
          const key = `${lastPos.row}-${lastPos.col}`;
          setNewKings(p => [...p, key]);
          setTimeout(() => setNewKings(p => p.filter(k => k !== key)), 2000);
        }

        setBoard(newBoard);
        setMoveCount(p => p + 1);
        setLastMove({ from: bestMove.from, to: lastPos });

        if (totalCaptured > 0) {
          setCaptured(p => ({ ...p, black: p.black + totalCaptured }));
        }

        if (!checkWin(newBoard, BLACK)) {
          setCurrentPlayer(RED);
        }
      }

      setIsThinking(false);
    }, gameSettings.difficulty === 'hard' ? 500 : 200); // Délai plus long pour le niveau difficile
  }, [currentPlayer, gameSettings, isThinking, gameStatus, checkWin]);

  const resetGame = () => {
    if (isOnline) return;
    setBoard(initBoard());
    setSelected(null);
    setValidMoves([]);
    setCurrentPlayer(RED);
    setGameStatus('En cours');
    setCaptured({ red: 0, black: 0 });
    setMoveCount(0);
    setLastMove(null);
    setNewKings([]);
    setMustContinueFrom(null);
  };

  const isOver = gameStatus !== 'En cours';
  const diffLabel = { easy: 'Débutant', intermediate: 'Intermédiaire', hard: 'Expert (Imbattable)' };

  let redCount = 0, blackCount = 0;
  board.forEach(row => {
    row.forEach(cell => {
      if (cell?.color === RED) redCount++;
      if (cell?.color === BLACK) blackCount++;
    });
  });

  return (
    <div className="ck-root container-fluid px-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .ck-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 60% 50% at 25% 20%, rgba(180,130,70,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(160,100,50,0.05) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.005) 40px, rgba(255,255,255,0.005) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.005) 40px, rgba(255,255,255,0.005) 41px);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
          padding: 2rem 1rem;
        }

        .ck-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .ck-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .ck-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 900;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 40%, #f5e6c8 70%, #a06820 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 16px rgba(180,130,60,0.3));
        }

        .ck-title-ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 0.5rem 0 0.75rem;
        }

        .ck-orn-line {
          flex: 1;
          max-width: 120px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(180,130,60,0.5), transparent);
        }

        .ck-orn-diamond {
          width: 8px;
          height: 8px;
          background: #c9914d;
          transform: rotate(45deg);
          box-shadow: 0 0 8px rgba(201,145,77,0.6);
        }

        .ck-subtitle {
          font-style: italic;
          font-size: 1.1rem;
          color: rgba(240,232,216,0.6);
          letter-spacing: 0.05em;
        }

        .ck-online-banner {
          text-align: center;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(201,145,77,0.3);
          background: rgba(201,145,77,0.1);
          color: #f0e8d8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .ck-online-banner.waiting {
          animation: bannerPulse 1.8s ease-in-out infinite;
        }

        .ck-online-banner.playing {
          border-color: rgba(74,222,128,0.4);
          background: rgba(74,222,128,0.08);
          color: #86efac;
        }

        .ck-online-banner.ended {
          border-color: rgba(239,68,68,0.35);
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
        }

        @keyframes bannerPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .ck-my-turn-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.85rem;
          border-radius: 100px;
          background: rgba(74,222,128,0.15);
          border: 1px solid rgba(74,222,128,0.3);
          color: #86efac;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
        }

        .ck-my-turn-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          animation: dotPulse 1.2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .ck-win-reward {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #c9914d, #a06820);
          color: #1a0f05;
          padding: 1rem 2.5rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          box-shadow: 0 8px 32px rgba(201,145,77,0.5);
          z-index: 9999;
          animation: rewardPop 0.5s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes rewardPop {
          from {
            transform: translateX(-50%) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }

        .ck-sidebar {
          background: rgba(25,18,10,0.5);
          backdrop-filter: blur(30px);
          border-radius: 20px;
          border: 1px solid rgba(180,130,60,0.15);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          position: sticky;
          top: 1rem;
          max-height: 90vh;
          overflow-y: auto;
        }

        .ck-sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .ck-sidebar::-webkit-scrollbar-thumb {
          background: rgba(201,145,77,0.25);
          border-radius: 100px;
        }

        .ck-section {
          padding: 1.25rem 0;
          border-bottom: 1px solid rgba(180,130,60,0.08);
        }

        .ck-section:first-child {
          padding-top: 0;
        }

        .ck-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .ck-section-label {
          font-family: 'Cinzel', serif;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.65);
          margin-bottom: 0.75rem;
        }

        .ck-status {
          text-align: center;
          padding: 0.65rem 1rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          background: rgba(201,145,77,0.15);
          border: 1px solid rgba(201,145,77,0.3);
          color: #f0e8d8;
        }

        .ck-status.over {
          background: rgba(201,145,77,0.25);
          border-color: #c9914d;
          color: #f5e6c8;
          animation: statusGlow 2s ease-in-out infinite;
        }

        @keyframes statusGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(201,145,77,0.2); }
          50% { box-shadow: 0 0 24px rgba(201,145,77,0.5); }
        }

        .ck-turn {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: rgba(10,7,4,0.3);
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(180,130,60,0.1);
        }

        .ck-turn-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1);
          position: relative;
        }

        .ck-turn-dot::before {
          content: '';
          position: absolute;
          top: 20%;
          left: 20%;
          width: 28%;
          height: 28%;
          background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
          border-radius: 50%;
        }

        .ck-turn-dot.red {
          background: radial-gradient(circle at 35% 35%, #ff8585 0%, #c92a2a 100%);
          border: 2px solid #a61e1e;
        }

        .ck-turn-dot.black-piece {
          background: radial-gradient(circle at 35% 35%, #5a5a5a 0%, #1a1a1a 100%);
          border: 2px solid #0a0a0a;
        }

        .ck-turn-name {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #f0e8d8;
        }

        .ck-turn-hint {
          font-size: 0.75rem;
          font-style: italic;
          color: rgba(240,232,216,0.35);
          margin-left: auto;
        }

        .ck-counts {
          display: flex;
          gap: 0.75rem;
        }

        .ck-count-card {
          flex: 1;
          background: rgba(10,7,4,0.3);
          border-radius: 12px;
          padding: 0.75rem;
          border: 1px solid rgba(180,130,60,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .ck-count-piece {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }

        .ck-count-piece.red {
          background: radial-gradient(circle at 35% 35%, #ff8585, #c92a2a);
          border: 2px solid #a61e1e;
        }

        .ck-count-piece.dark {
          background: radial-gradient(circle at 35% 35%, #5a5a5a, #1a1a1a);
          border: 2px solid #0a0a0a;
        }

        .ck-count-num {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #c9914d;
        }

        .ck-count-cap {
          font-size: 0.7rem;
          font-style: italic;
          color: rgba(240,232,216,0.35);
        }

        .ck-move-count {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }

        .ck-mc-num {
          font-family: 'Cinzel', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #c9914d;
        }

        .ck-mc-lbl {
          font-size: 0.85rem;
          color: rgba(240,232,216,0.5);
        }

        .ck-btns {
          width: 100%;
        }

        .ck-btn {
          padding: 0.7rem 1rem;
          border-radius: 100px;
          border: 1px solid rgba(180,130,60,0.2);
          background: rgba(40,28,18,0.4);
          color: rgba(240,232,216,0.85);
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          width: 100%;
        }

        .ck-btn:hover:not(:disabled) {
          background: rgba(60,42,24,0.6);
          border-color: rgba(201,145,77,0.45);
          box-shadow: 0 4px 20px rgba(201,145,77,0.15);
          transform: translateY(-1px);
          color: #f0e8d8;
        }

        .ck-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .ck-btn.gold {
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          color: #1a0f05;
          border-color: transparent;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(201,145,77,0.25);
        }

        .ck-btn.gold:hover:not(:disabled) {
          box-shadow: 0 8px 28px rgba(201,145,77,0.4);
          background: linear-gradient(135deg, #d9a55d 0%, #b07830 100%);
        }

        .ck-board-area {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ck-board-wrap {
          background: rgba(40,28,18,0.4);
          border-radius: 20px;
          padding: 1.5rem;
          border: 1px solid rgba(180,130,60,0.15);
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
          position: relative;
          max-width: 620px;
          margin: 0 auto;
          width: 100%;
        }

        .ck-board-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          background: rgba(10,7,4,0.88);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .ck-overlay-title {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #f0e8d8;
          letter-spacing: 0.1em;
          text-align: center;
          padding: 0 1rem;
        }

        .ck-overlay-sub {
          font-style: italic;
          color: rgba(240,232,216,0.5);
          font-size: 0.9rem;
        }

        .ck-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(201,145,77,0.2);
          border-top-color: #c9914d;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ck-thinking {
          position: absolute;
          inset: 0;
          z-index: 100;
          background: rgba(10,7,4,0.75);
          backdrop-filter: blur(6px);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ck-thinking-pill {
          background: rgba(201,145,77,0.18);
          border: 1px solid rgba(201,145,77,0.35);
          border-radius: 100px;
          padding: 0.9rem 2rem;
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.12em;
          color: #f0e8d8;
          animation: pillPulse 1.4s ease-in-out infinite;
        }

        @keyframes pillPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .ck-board {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          grid-template-rows: repeat(8, 1fr);
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(201,145,77,0.1);
        }

        .ck-sq {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ck-sq.light {
          background: #f2e4cc;
        }

        .ck-sq.dark {
          background: #7a5c38;
        }

        .ck-sq.dark:hover {
          background: #8a6a44;
        }

        .ck-sq.selected {
          background: #b8935f !important;
          box-shadow: inset 0 0 24px rgba(201,145,77,0.5);
        }

        .ck-sq.last-from {
          background: rgba(201,145,77,0.2) !important;
        }

        .ck-sq.last-to {
          background: rgba(201,145,77,0.35) !important;
        }

        .ck-sq.king-flash {
          animation: kingFlash 2s ease-out;
        }

        @keyframes kingFlash {
          0% { box-shadow: inset 0 0 60px rgba(255,215,0,0.8); }
          100% { box-shadow: none; }
        }

        .ck-sq.valid-move::after {
          content: '';
          position: absolute;
          width: 30%;
          height: 30%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,145,77,0.7) 0%, rgba(201,145,77,0.3) 70%);
          box-shadow: 0 0 16px rgba(201,145,77,0.5);
          animation: moveDot 1.8s ease-in-out infinite;
        }

        @keyframes moveDot {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.25); opacity: 1; }
        }

        .ck-piece {
          width: 78%;
          height: 78%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.45), inset 0 -3px 10px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.1);
        }

        .ck-piece::before {
          content: '';
          position: absolute;
          top: 14%;
          left: 14%;
          width: 28%;
          height: 28%;
          background: radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%);
          border-radius: 50%;
        }

        .ck-sq:hover .ck-piece {
          transform: scale(1.08);
        }

        .ck-sq.selected .ck-piece {
          transform: scale(1.12);
        }

        .ck-piece.red {
          background: radial-gradient(circle at 35% 35%, #ff8585 0%, #c92a2a 100%);
          border: 3px solid #8b1a1a;
        }

        .ck-piece.dark-piece {
          background: radial-gradient(circle at 35% 35%, #5a5a5a 0%, #181818 100%);
          border: 3px solid #080808;
        }

        .ck-piece.king {
          border-width: 4px;
          box-shadow: 0 8px 28px rgba(255,215,0,0.25), 0 0 24px rgba(255,215,0,0.15), inset 0 -3px 10px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.12);
        }

        .ck-crown {
          font-size: 1.4em;
          line-height: 1;
          color: #ffd700;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7));
          animation: crownShine 3s ease-in-out infinite;
        }

        @keyframes crownShine {
          0%, 100% { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7)); }
          50% { filter: drop-shadow(0 2px 10px rgba(255,215,0,0.5)) drop-shadow(0 0 12px rgba(255,215,0,0.3)); }
        }

        .ck-capture-hint {
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #c9914d;
          padding: 0.6rem;
          animation: hintPulse 1.5s ease-in-out infinite;
        }

        @keyframes hintPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>

      {winReward && (
        <div className="ck-win-reward">
          Victoire ! +{winReward.tokens} jetons — Total : {winReward.total}
        </div>
      )}

      <div className="ck-container">
        <div className="ck-header">
          <h1 className="ck-title">Dames</h1>
          <div className="ck-title-ornament">
            <div className="ck-orn-line" />
            <div className="ck-orn-diamond" />
            <div className="ck-orn-line" />
          </div>
          <p className="ck-subtitle">
            {isOnline
              ? `Mode En Ligne · ${myColor === RED ? 'Vous jouez les Rouges' : myColor === BLACK ? 'Vous jouez les Noirs' : 'Recherche...'}`
              : gameSettings?.mode === 'ai'
              ? `Intelligence Artificielle · ${diffLabel[gameSettings.difficulty] || 'Intermédiaire'}`
              : 'Mode Deux Joueurs'}
          </p>
        </div>

        {isOnline && (
          <div className={`ck-online-banner ${onlineStatus}`}>
            <span>{onlineMessage}</span>
            {onlineStatus === 'playing' && currentPlayer === myColor && (
              <span className="ck-my-turn-badge">
                <span className="ck-my-turn-dot" /> Votre tour
              </span>
            )}
          </div>
        )}

        <div className="row g-3 align-items-start">
          <div className="col-12 col-lg-3">
            <div className="ck-sidebar">
              <div className="ck-section">
                <div className="ck-section-label">Statut</div>
                <div className={`ck-status ${isOver ? 'over' : ''}`}>{gameStatus}</div>
              </div>
              <div className="ck-section">
                <div className="ck-section-label">Tour</div>
                <div className="ck-turn">
                  <div className={`ck-turn-dot ${currentPlayer === RED ? 'red' : 'black-piece'}`} />
                  <span className="ck-turn-name">{currentPlayer === RED ? 'Rouges' : 'Noirs'}</span>
                  {isThinking && <span className="ck-turn-hint">réfléchit…</span>}
                </div>
              </div>
              <div className="ck-section">
                <div className="ck-section-label">Pièces restantes</div>
                <div className="ck-counts">
                  <div className="ck-count-card">
                    <div className="ck-count-piece red" />
                    <div className="ck-count-num">{redCount}</div>
                    <div className="ck-count-cap">{captured.black} cap.</div>
                  </div>
                  <div className="ck-count-card">
                    <div className="ck-count-piece dark" />
                    <div className="ck-count-num">{blackCount}</div>
                    <div className="ck-count-cap">{captured.red} cap.</div>
                  </div>
                </div>
              </div>
              <div className="ck-section">
                <div className="ck-section-label">Coups joués</div>
                <div className="ck-move-count">
                  <span className="ck-mc-num">{moveCount}</span>
                  <span className="ck-mc-lbl">coups</span>
                </div>
              </div>
              <div className="ck-section ck-btns">
                <div className="row g-2">
                  {!isOnline && (
                    <div className="col-12">
                      <button className="ck-btn" onClick={resetGame} disabled={isThinking}>
                        ↺ Nouvelle partie
                      </button>
                    </div>
                  )}
                  <div className="col-12">
                    <button className="ck-btn gold" onClick={() => navigate('/game-selection')}>
                      Changer de jeu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-9">
            <div className="ck-board-area">
              <div className="ck-board-wrap">
                {isOnline && onlineStatus !== 'playing' && (
                  <div className="ck-board-overlay">
                    {onlineStatus === 'waiting' && <div className="ck-spinner" />}
                    <div className="ck-overlay-title">{onlineMessage}</div>
                    {onlineStatus === 'waiting' && (
                      <div className="ck-overlay-sub">La partie démarrera automatiquement</div>
                    )}
                    {onlineStatus === 'ended' && (
                      <button
                        className="ck-btn gold"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => navigate('/game-selection')}
                      >
                        Retour aux jeux
                      </button>
                    )}
                  </div>
                )}

                {isThinking && (
                  <div className="ck-thinking">
                    <div className="ck-thinking-pill">L'IA réfléchit…</div>
                  </div>
                )}

                <div className="ck-board">
                  {board.map((row, ri) =>
                    row.map((cell, ci) => {
                      const isLight = (ri + ci) % 2 === 0;
                      const isSel = selected?.row === ri && selected?.col === ci;
                      const isValid = validMoves.some(m => m.to.row === ri && m.to.col === ci);
                      const isLastFrom = lastMove?.from.row === ri && lastMove?.from.col === ci;
                      const isLastTo = lastMove?.to.row === ri && lastMove?.to.col === ci;
                      const isKingFlash = newKings.includes(`${ri}-${ci}`);

                      return (
                        <div
                          key={`${ri}-${ci}`}
                          className={[
                            'ck-sq',
                            isLight ? 'light' : 'dark',
                            isSel ? 'selected' : '',
                            isValid ? 'valid-move' : '',
                            isLastFrom ? 'last-from' : '',
                            isLastTo ? 'last-to' : '',
                            isKingFlash ? 'king-flash' : '',
                          ].join(' ')}
                          onClick={() => handleSquareClick(ri, ci)}
                        >
                          {cell && (
                            <div
                              className={[
                                'ck-piece',
                                cell.color === RED ? 'red' : 'dark-piece',
                                cell.isKing() ? 'king' : '',
                              ].join(' ')}
                            >
                              {cell.isKing() && <span className="ck-crown">♚</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {validMoves.some(m => m.isCapture) && !isOver && (
                <div className="ck-capture-hint">Capture obligatoire</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckersGame;
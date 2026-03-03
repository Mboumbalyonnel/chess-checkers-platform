import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PIECE_SYMBOLS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

// Délais minimaux visibles par niveau (ms)
const THINK_DELAY = {
  easy:         400,
  intermediate: 900,
  hard:        1800,
};

function findKingSquare(chess, color) {
  const board = chess.board();
  const files = 'abcdefgh';
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (sq && sq.type === 'k' && sq.color === color) return files[f] + (8 - r);
    }
  return null;
}

function buildCapturedFromHistory(moveHistory) {
  const temp = new Chess();
  const captured = { white: [], black: [] };
  for (const san of moveHistory) {
    const result = temp.move(san);
    if (result?.captured) captured[result.color === 'w' ? 'white' : 'black'].push(result.captured);
  }
  return captured;
}

function buildPGN(moveHistory) {
  const chess = new Chess();
  for (const san of moveHistory) chess.move(san);
  return chess.pgn();
}

function useBoardWidth() {
  const [width, setWidth] = useState(() => {
    if (window.innerWidth < 576) return window.innerWidth - 32;
    return Math.min(580, window.innerWidth - 80);
  });
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 576) setWidth(window.innerWidth - 32);
      else setWidth(Math.min(580, window.innerWidth - 80));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function getPieceValue(type) {
  return { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[type] || 0;
}

// ─── COMPOSANT ───────────────────────────────────────────────────────────────

function ChessGame() {
  const navigate = useNavigate();
  const boardWidth = useBoardWidth();

  const [gameSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gameSettings') || '{}'); } catch { return {}; }
  });

  const isOnline = gameSettings?.mode === 'online';
  const difficulty = gameSettings?.difficulty || 'intermediate';
  const diffLabel = { easy: 'Débutant', intermediate: 'Intermédiaire', hard: 'Expert' };

  const workerRef = useRef(null);
  const pendingMoveRef = useRef(null);
  const thinkStartRef = useRef(null);

  const socketRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState('connecting');
  const [myColor, setMyColor] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [onlineMessage, setOnlineMessage] = useState('Connexion au serveur...');
  const [winReward, setWinReward] = useState(null);

  const [game, setGame] = useState(() => new Chess());
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const [moveHistory, setMoveHistory] = useState([]);
  const moveHistoryRef = useRef(moveHistory);
  useEffect(() => { moveHistoryRef.current = moveHistory; }, [moveHistory]);

  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingDots, setThinkingDots] = useState('');
  const [lastMove, setLastMove] = useState(null);
  const [checkSquare, setCheckSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const historyRef = useRef(null);

  const INITIAL_TIME = (gameSettings?.timerMinutes || 10) * 60;
  const [timers, setTimers] = useState({ w: INITIAL_TIME, b: INITIAL_TIME });

  const gameOverRef = useRef(false);
  const gameTurnRef = useRef('w');
  const timerRef = useRef(null);
  const dotsRef = useRef(null);

  gameOverRef.current = game.isGameOver();
  gameTurnRef.current = game.turn();

  // Animation points de réflexion
  useEffect(() => {
    if (isThinking) {
      let count = 0;
      dotsRef.current = setInterval(() => {
        count = (count + 1) % 4;
        setThinkingDots('.'.repeat(count));
      }, 400);
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current);
      setThinkingDots('');
    }
    return () => { if (dotsRef.current) clearInterval(dotsRef.current); };
  }, [isThinking]);

  const applyAIMove = useCallback((bestMoveSan) => {
    const currentGame = gameRef.current;
    const nextGame = new Chess(currentGame.fen());
    const result = nextGame.move(bestMoveSan);
    if (result) {
      const newHistory = [...moveHistoryRef.current, result.san];
      setGame(nextGame);
      setMoveHistory(newHistory);
      setCapturedPieces(buildCapturedFromHistory(newHistory));
      setLastMove({ from: result.from, to: result.to });
      setCheckSquare(nextGame.inCheck() ? findKingSquare(nextGame, nextGame.turn()) : null);
    }
    setIsThinking(false);
    pendingMoveRef.current = null;
    thinkStartRef.current = null;
  }, []);

  // Init Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./chessWorker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'bestMove' && payload) {
        const elapsed = Date.now() - (thinkStartRef.current || Date.now());
        const minDelay = THINK_DELAY[difficulty] || 900;
        const remaining = Math.max(0, minDelay - elapsed);
        if (remaining > 0) {
          pendingMoveRef.current = payload;
          setTimeout(() => { if (pendingMoveRef.current) applyAIMove(pendingMoveRef.current); }, remaining);
        } else {
          applyAIMove(payload);
        }
      }
    };
    return () => { if (workerRef.current) workerRef.current.terminate(); };
  }, [difficulty, applyAIMove]);

  // Socket.io
  useEffect(() => {
    if (!isOnline) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    if (!userId) { navigate('/login'); return; }
    const socket = io(API_URL, { transports: ['websocket'] });
socketRef.current = socket;
    socket.on('connect', () => {
      setOnlineMessage("Recherche d'un adversaire...");
      socket.emit('joinQueue', { gameType: 'chess', userId, mode: 'online' });
    });
    socket.on('waitingForOpponent', () => { setOnlineStatus('waiting'); setOnlineMessage("En attente d'un adversaire..."); });
    socket.on('insufficientTokens', ({ required, current }) => { setOnlineStatus('ended'); setOnlineMessage(`Jetons insuffisants — Requis : ${required}, Disponible : ${current}`); });
    socket.on('gameFound', ({ gameId: gId, playerNumber }) => {
      setGameId(gId);
      const color = playerNumber === 1 ? 'w' : 'b';
      setMyColor(color); setIsBoardFlipped(color === 'b');
      setOnlineStatus('playing');
      setOnlineMessage(color === 'w' ? 'Vous jouez les Blancs' : 'Vous jouez les Noirs');
    });
    socket.on('opponentMove', (san) => {
      setGame(prev => {
        const next = new Chess(prev.fen());
        const result = next.move(san);
        if (!result) return prev;
        setMoveHistory(h => { const newH = [...h, result.san]; setCapturedPieces(buildCapturedFromHistory(newH)); return newH; });
        setLastMove({ from: result.from, to: result.to });
        setCheckSquare(next.inCheck() ? findKingSquare(next, next.turn()) : null);
        return next;
      });
    });
    socket.on('opponentLeft', () => { setOnlineStatus('ended'); setOnlineMessage('Votre adversaire a abandonné la partie.'); });
    socket.on('winReward', ({ tokens, total }) => { setWinReward({ tokens, total }); setTimeout(() => setWinReward(null), 5000); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isOnline, navigate]);

  // Fin partie online
  useEffect(() => {
    if (!isOnline || !gameId || !game.isGameOver() || onlineStatus !== 'playing') return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    const socket = socketRef.current;
    if (!socket || !userId) return;
    let winnerId = null, loserId = null;
    if (game.isCheckmate()) {
      const loserColor = game.turn();
      if (loserColor !== myColor) winnerId = userId;
      else loserId = userId;
    }
    socket.emit('gameEnded', { gameId, winnerId, loserId });
    setOnlineStatus('ended');
  }, [game, isOnline, gameId, onlineStatus, myColor]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (gameOverRef.current) return;
      const t = gameTurnRef.current;
      setTimers(prev => { if (prev[t] <= 0) return prev; return { ...prev, [t]: prev[t] - 1 }; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const requestAIMove = useCallback(() => {
    if (!workerRef.current || isThinking) return;
    setIsThinking(true);
    thinkStartRef.current = Date.now();
    workerRef.current.postMessage({ type: 'getBestMove', payload: { fen: gameRef.current.fen(), difficulty } });
  }, [difficulty, isThinking]);

  useEffect(() => {
    if (gameSettings?.mode === 'ai' && !game.isGameOver() && game.turn() === 'b' && !isThinking) {
      const t = setTimeout(requestAIMove, 80);
      return () => clearTimeout(t);
    }
  }, [game, gameSettings?.mode, isThinking, requestAIMove]);

  const applyMove = useCallback((chess, moveObj) => {
    try {
      const copy = new Chess(chess.fen());
      const result = copy.move(moveObj);
      if (!result) return null;
      return { newGame: copy, result };
    } catch { return null; }
  }, []);

  const onDrop = (sourceSquare, targetSquare) => {
    const currentGame = gameRef.current;
    if (currentGame.isGameOver()) return false;
    if (gameSettings?.mode === 'ai' && (isThinking || currentGame.turn() !== 'w')) return false;
    if (isOnline && (onlineStatus !== 'playing' || currentGame.turn() !== myColor)) return false;
    const moves = currentGame.moves({ square: sourceSquare, verbose: true });
    const move = moves.find(m => m.to === targetSquare);
    if (!move) return false;
    const res = applyMove(currentGame, move);
    if (!res) return false;
    const newHistory = [...moveHistory, res.result.san];
    setGame(res.newGame); setMoveHistory(newHistory);
    setCapturedPieces(buildCapturedFromHistory(newHistory));
    setLastMove({ from: res.result.from, to: res.result.to });
    setSelectedSquare(null); setLegalMoves([]);
    setCheckSquare(res.newGame.inCheck() ? findKingSquare(res.newGame, res.newGame.turn()) : null);
    if (isOnline && socketRef.current && gameId) socketRef.current.emit('makeMove', { gameId, move: res.result.san });
    return true;
  };

  const onSquareClick = (square) => {
    const currentGame = gameRef.current;
    if (isThinking) return;
    if (isOnline && (onlineStatus !== 'playing' || currentGame.turn() !== myColor)) return;
    if (selectedSquare === square) { setSelectedSquare(null); setLegalMoves([]); return; }
    const piece = currentGame.get(square);
    if (piece && piece.color === currentGame.turn()) {
      setSelectedSquare(square);
      setLegalMoves(currentGame.moves({ square, verbose: true }).map(m => m.to));
    } else if (selectedSquare) {
      onDrop(selectedSquare, square);
    }
  };

  const undoMove = () => {
    if (isOnline || isThinking) return;
    const undoCount = gameSettings?.mode === 'ai' ? 2 : 1;
    const newHistory = moveHistory.slice(0, -undoCount);
    const newGame = new Chess();
    for (const san of newHistory) newGame.move(san);
    setGame(newGame); setMoveHistory(newHistory);
    setCapturedPieces(buildCapturedFromHistory(newHistory));
    setLastMove(null); setCheckSquare(null); setSelectedSquare(null); setLegalMoves([]);
  };

  const resetGame = () => {
    if (isOnline) return;
    setGame(new Chess()); setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setLastMove(null); setCheckSquare(null);
    setSelectedSquare(null); setLegalMoves([]);
    setTimers({ w: INITIAL_TIME, b: INITIAL_TIME });
    setIsThinking(false); pendingMoveRef.current = null;
  };

  const exportPGN = () => {
    const pgn = buildPGN(moveHistory);
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'partie.pgn'; a.click();
    URL.revokeObjectURL(url);
  };

  const customSquareStyles = () => {
    const styles = {};
    if (lastMove) {
      styles[lastMove.from] = { background: 'rgba(212,163,115,0.22)' };
      styles[lastMove.to]   = { background: 'rgba(212,163,115,0.38)' };
    }
    if (checkSquare) styles[checkSquare] = { background: 'radial-gradient(circle, rgba(239,68,68,0.55) 0%, transparent 75%)' };
    if (selectedSquare) styles[selectedSquare] = { background: 'rgba(99,179,237,0.45)' };
    legalMoves.forEach(sq => { styles[sq] = { background: 'radial-gradient(circle, rgba(212,163,115,0.6) 22%, transparent 23%)' }; });
    return styles;
  };

  const materialAdv = (() => {
    const wVal = capturedPieces.white.reduce((s, p) => s + getPieceValue(p), 0);
    const bVal = capturedPieces.black.reduce((s, p) => s + getPieceValue(p), 0);
    const diff = wVal - bVal;
    if (diff > 0) return { color: 'Blancs', value: diff };
    if (diff < 0) return { color: 'Noirs', value: Math.abs(diff) };
    return null;
  })();

  useEffect(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, [moveHistory]);

  const fmt = (secs) => {
    const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
    const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getStatus = () => {
    if (game.isCheckmate()) return `Échec et Mat ! ${game.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent !`;
    if (game.isDraw()) return 'Match Nul';
    if (game.isStalemate()) return 'Pat – Match Nul';
    if (game.inCheck()) return 'Échec !';
    return `Trait aux ${game.turn() === 'w' ? 'Blancs' : 'Noirs'}`;
  };

  const status = getStatus();
  const isCheck = status === 'Échec !';
  const isOver = game.isGameOver();

  const thinkingLabel = {
    easy: `Réflexion${thinkingDots}`,
    intermediate: `Calcul${thinkingDots}`,
    hard: `Analyse profonde${thinkingDots}`,
  };

  return (
    <div className="cg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cg-root {
          min-height: 100vh; background: #100d0a;
          background-image:
            radial-gradient(ellipse 60% 50% at 25% 20%, rgba(180,130,70,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(160,100,50,0.05) 0%, transparent 60%);
          font-family: 'Crimson Pro', Georgia, serif;
          padding: 2rem 1rem; color: #f0e8d8;
        }
        .cg-container { max-width: 1400px; margin: 0 auto; }
        .cg-header { text-align: center; margin-bottom: 2rem; }
        .cg-title {
          font-family: 'Cinzel', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .cg-subtitle { font-style: italic; font-size: 1rem; color: rgba(240,232,216,0.6); }
        .cg-diff-badge {
          display: inline-block; margin-top: 0.4rem; padding: 0.15rem 0.75rem;
          border-radius: 100px; font-family: 'Cinzel', serif; font-size: 0.6rem;
          letter-spacing: 0.12em; text-transform: uppercase;
        }
        .cg-diff-badge.easy        { background: rgba(74,222,128,0.15); color: #86efac; border: 1px solid rgba(74,222,128,0.25); }
        .cg-diff-badge.intermediate{ background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
        .cg-diff-badge.hard        { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
        .cg-online-banner {
          text-align: center; padding: 0.5rem 1rem; border-radius: 100px;
          font-family: 'Cinzel', serif; font-size: 0.75rem; margin-bottom: 1rem;
          border: 1px solid rgba(201,145,77,0.3); background: rgba(201,145,77,0.1);
        }
        .cg-my-turn-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.2rem 0.6rem; border-radius: 100px;
          background: rgba(74,222,128,0.15); color: #86efac; font-size: 0.65rem; margin-left: 0.5rem;
        }
        .cg-win-reward {
          position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #c9914d, #a06820); color: #1a0f05;
          padding: 0.75rem 2rem; border-radius: 100px;
          font-family: 'Cinzel', serif; font-weight: 700; z-index: 9999;
          animation: slideDown 0.4s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .cg-timer {
          background: rgba(30,22,14,0.6); border-radius: 8px; padding: 0.4rem 0.8rem;
          text-align: center; border: 1px solid rgba(180,130,60,0.08); transition: border-color 0.3s;
        }
        .cg-timer.active { border-color: rgba(201,145,77,0.3); }
        .cg-timer.active .cg-timer-value { color: #c9914d; }
        .cg-timer.danger .cg-timer-value { color: #ef4444; animation: pulse 1s infinite; }
        .cg-timer-label {
          font-family: 'Cinzel', serif; font-size: 0.5rem; text-transform: uppercase;
          letter-spacing: 0.15em; color: rgba(240,232,216,0.35); margin-bottom: 2px;
        }
        .cg-timer-value { font-family: 'Cinzel', serif; font-size: 1.3rem; font-weight: 700; transition: color 0.3s; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .cg-board-wrap {
          background: rgba(40,28,18,0.4); border-radius: 16px; padding: 1rem;
          border: 1px solid rgba(180,130,60,0.15); position: relative;
        }
        .cg-thinking {
          position: absolute; inset: 0; z-index: 100; background: rgba(10,7,4,0.78);
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 0.75rem;
        }
        .cg-thinking-pill {
          background: rgba(201,145,77,0.18); border: 1px solid rgba(201,145,77,0.35);
          border-radius: 100px; padding: 0.5rem 1.5rem;
          font-family: 'Cinzel', serif; font-size: 0.8rem; min-width: 200px; text-align: center;
        }
        .cg-thinking-bar { width: 120px; height: 3px; background: rgba(255,255,255,0.05); border-radius: 100px; overflow: hidden; }
        .cg-thinking-fill {
          height: 100%; background: linear-gradient(90deg, #c9914d, #f5e6c8, #c9914d);
          background-size: 200% 100%; animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .cg-sidebar {
          background: rgba(25,18,10,0.5); backdrop-filter: blur(20px);
          border-radius: 16px; border: 1px solid rgba(180,130,60,0.15);
          padding: 1.25rem; position: sticky; top: 1rem;
        }
        .cg-section { padding: 0.9rem 0; border-bottom: 1px solid rgba(180,130,60,0.08); }
        .cg-section:last-child { border-bottom: none; }
        .cg-section-label {
          font-family: 'Cinzel', serif; font-size: 0.6rem; text-transform: uppercase;
          color: rgba(201,145,77,0.65); margin-bottom: 0.5rem;
        }
        .cg-status {
          text-align: center; padding: 0.5rem; border-radius: 100px;
          font-family: 'Cinzel', serif; font-size: 0.75rem; background: rgba(201,145,77,0.15);
        }
        .cg-status.check { background: rgba(239,68,68,0.2); color: #fca5a5; }
        .cg-status.over  { background: rgba(74,222,128,0.15); color: #86efac; }
        .cg-captured { display: flex; flex-wrap: wrap; gap: 2px; min-height: 24px; }
        .cg-cap-piece { font-size: 1.2rem; opacity: 0.7; }
        .cg-material-adv { font-family: 'Cinzel', serif; font-size: 0.7rem; color: #c9914d; margin-top: 0.25rem; }
        .cg-history {
          max-height: 140px; overflow-y: auto; background: rgba(10,7,4,0.3);
          border-radius: 8px; padding: 0.4rem;
          scrollbar-width: thin; scrollbar-color: rgba(201,145,77,0.2) transparent;
        }
        .cg-move-row {
          display: grid; grid-template-columns: 25px 1fr 1fr; gap: 0.3rem;
          padding: 0.15rem 0.3rem; font-size: 0.8rem; border-radius: 4px; transition: background 0.15s;
        }
        .cg-move-row:hover { background: rgba(201,145,77,0.06); }
        .cg-move-num { color: rgba(201,145,77,0.5); }
        .cg-btn {
          padding: 0.5rem 0.8rem; border-radius: 100px;
          border: 1px solid rgba(180,130,60,0.2); background: rgba(40,28,18,0.4);
          color: rgba(240,232,216,0.85); font-family: 'Cinzel', serif;
          font-size: 0.62rem; text-transform: uppercase; cursor: pointer; width: 100%;
          transition: all 0.25s ease;
        }
        .cg-btn:hover:not(:disabled) { border-color: rgba(201,145,77,0.35); background: rgba(60,42,22,0.5); }
        .cg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cg-btn.gold {
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          color: #1a0f05; font-weight: 700; border: none;
        }
        .cg-btn.gold:hover { box-shadow: 0 4px 16px rgba(201,145,77,0.35); }
      `}</style>

      {winReward && <div className="cg-win-reward">🏆 Victoire ! +{winReward.tokens} jetons</div>}

      <div className="cg-container">
        <div className="cg-header">
          <h1 className="cg-title">Échecs</h1>
          <p className="cg-subtitle">
            {isOnline
              ? `Mode En Ligne · ${myColor === 'w' ? 'Vous jouez les Blancs' : 'Vous jouez les Noirs'}`
              : gameSettings?.mode === 'ai'
              ? `IA · ${diffLabel[difficulty]}`
              : 'Mode Deux Joueurs'}
          </p>
          {gameSettings?.mode === 'ai' && (
            <span className={`cg-diff-badge ${difficulty}`}>{diffLabel[difficulty]}</span>
          )}
        </div>

        {isOnline && (
          <div className={`cg-online-banner ${onlineStatus}`}>
            <span>{onlineMessage}</span>
            {onlineStatus === 'playing' && game.turn() === myColor && (
              <span className="cg-my-turn-badge">● Votre tour</span>
            )}
          </div>
        )}

        <div className="container-fluid px-0">
          <div className="row g-3">

            <div className="col-12 col-lg-3">
              <div className="cg-sidebar">
                <div className="cg-section">
                  <div className="cg-section-label">Statut</div>
                  <div className={`cg-status ${isCheck ? 'check' : ''} ${isOver ? 'over' : ''}`}>{status}</div>
                </div>
                <div className="cg-section">
                  <div className="cg-section-label">Pièces capturées</div>
                  <div className="cg-captured">
                    {capturedPieces.white.map((p, i) => <span key={`w${i}`} className="cg-cap-piece">{PIECE_SYMBOLS[p]}</span>)}
                  </div>
                  <div className="cg-captured" style={{ marginTop: '4px' }}>
                    {capturedPieces.black.map((p, i) => <span key={`b${i}`} className="cg-cap-piece">{PIECE_SYMBOLS[p]}</span>)}
                  </div>
                  {materialAdv && <div className="cg-material-adv">{materialAdv.color} +{materialAdv.value}</div>}
                </div>
                <div className="cg-section">
                  <div className="cg-section-label">Historique — {moveHistory.length} coup{moveHistory.length !== 1 ? 's' : ''}</div>
                  <div className="cg-history" ref={historyRef}>
                    {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                      <div key={i} className="cg-move-row">
                        <span className="cg-move-num">{i + 1}.</span>
                        <span>{moveHistory[i * 2]}</span>
                        <span>{moveHistory[i * 2 + 1] || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cg-section">
                  <div className="row g-2">
                    {!isOnline && (
                      <>
                        <div className="col-6">
                          <button className="cg-btn" onClick={undoMove} disabled={moveHistory.length === 0 || isThinking}>↩ Annuler</button>
                        </div>
                        <div className="col-6">
                          <button className="cg-btn" onClick={resetGame}>↺ Nouvelle</button>
                        </div>
                        <div className="col-12">
                          <button className="cg-btn" onClick={exportPGN} disabled={moveHistory.length === 0}>↓ Exporter PGN</button>
                        </div>
                      </>
                    )}
                    <div className="col-12">
                      <button className="cg-btn gold" onClick={() => navigate('/game-selection')}>Menu Principal</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-9">
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <div className={`cg-timer ${game.turn() === 'b' && !isOver ? 'active' : ''} ${timers.b <= 30 ? 'danger' : ''}`}>
                    <div className="cg-timer-label">Noirs</div>
                    <div className="cg-timer-value">{fmt(timers.b)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`cg-timer ${game.turn() === 'w' && !isOver ? 'active' : ''} ${timers.w <= 30 ? 'danger' : ''}`}>
                    <div className="cg-timer-label">Blancs</div>
                    <div className="cg-timer-value">{fmt(timers.w)}</div>
                  </div>
                </div>
              </div>
              <div className="cg-board-wrap">
                {isThinking && (
                  <div className="cg-thinking">
                    <div className="cg-thinking-pill">{thinkingLabel[difficulty] || `Réflexion${thinkingDots}`}</div>
                    <div className="cg-thinking-bar"><div className="cg-thinking-fill" /></div>
                  </div>
                )}
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  onSquareClick={onSquareClick}
                  boardWidth={boardWidth}
                  boardOrientation={isBoardFlipped ? 'black' : 'white'}
                  customSquareStyles={customSquareStyles()}
                  customDarkSquareStyle={{ backgroundColor: '#7a5c38' }}
                  customLightSquareStyle={{ backgroundColor: '#f2e4cc' }}
                  animationDuration={150}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessGame;
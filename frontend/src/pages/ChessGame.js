import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';

// HELPERS
const PIECE_SYMBOLS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

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
  const [width, setWidth] = useState(() => Math.min(580, window.innerWidth - 80));
  useEffect(() => {
    const handler = () => setWidth(Math.min(580, window.innerWidth - 80));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function getPieceValue(type) { 
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return values[type] || 0; 
}

// COMPOSANT
function ChessGame() {
  const navigate = useNavigate();
  const boardWidth = useBoardWidth();

  const [gameSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gameSettings') || '{}'); } catch { return {}; }
  });

  const isOnline = gameSettings?.mode === 'online';

  // Web Worker
  const workerRef = useRef(null);

  // État online
  const socketRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState('connecting');
  const [myColor, setMyColor] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [onlineMessage, setOnlineMessage] = useState('Connexion au serveur...');
  const [winReward, setWinReward] = useState(null);

  // État jeu
  const [game, setGame] = useState(() => new Chess());
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const [moveHistory, setMoveHistory] = useState([]);
  const moveHistoryRef = useRef(moveHistory);
  useEffect(() => { moveHistoryRef.current = moveHistory; }, [moveHistory]);

  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [checkSquare, setCheckSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const historyRef = useRef(null);

  const INITIAL_TIME = (gameSettings?.timerMinutes || 10) * 60;
  const [timers, setTimers] = useState({ w: INITIAL_TIME, b: INITIAL_TIME });

  const isThinkingRef = useRef(false);
  const gameOverRef = useRef(false);
  const gameTurnRef = useRef('w');
  const timerRef = useRef(null);

  isThinkingRef.current = isThinking;
  gameOverRef.current = game.isGameOver();
  gameTurnRef.current = game.turn();

  // Initialisation Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./chessWorker.js', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'bestMove' && payload) {
        applyAIMove(payload);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Socket.io
  useEffect(() => {
    if (!isOnline) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    if (!userId) { navigate('/login'); return; }

    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setOnlineMessage("Recherche d'un adversaire...");
      socket.emit('joinQueue', { gameType: 'chess', userId, mode: 'online' });
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
      const color = playerNumber === 1 ? 'w' : 'b';
      setMyColor(color);
      setIsBoardFlipped(color === 'b');
      setOnlineStatus('playing');
      setOnlineMessage(color === 'w' ? 'Vous jouez les Blancs' : 'Vous jouez les Noirs');
    });

    socket.on('opponentMove', (san) => {
      setGame(prev => {
        const next = new Chess(prev.fen());
        const result = next.move(san);
        if (!result) return prev;
        setMoveHistory(h => {
          const newH = [...h, result.san];
          setCapturedPieces(buildCapturedFromHistory(newH));
          return newH;
        });
        setLastMove({ from: result.from, to: result.to });
        setCheckSquare(next.inCheck() ? findKingSquare(next, next.turn()) : null);
        return next;
      });
    });

    socket.on('opponentLeft', () => {
      setOnlineStatus('ended');
      setOnlineMessage('Votre adversaire a abandonné la partie.');
    });

    socket.on('winReward', ({ tokens, total }) => {
      setWinReward({ tokens, total });
      setTimeout(() => setWinReward(null), 5000);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isOnline, navigate]);

  // Fin de partie online
  useEffect(() => {
    if (!isOnline || !gameId || !game.isGameOver() || onlineStatus !== 'playing') return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    const socket = socketRef.current;
    if (!socket || !userId) return;

    let winnerId = null, loserId = null;
    if (game.isCheckmate()) {
      const loserColor = game.turn();
      if (loserColor !== myColor) { winnerId = userId; }
      else { loserId = userId; }
    }
    socket.emit('gameEnded', { gameId, winnerId, loserId });
    setOnlineStatus('ended');
  }, [game, isOnline, gameId, onlineStatus, myColor]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (gameOverRef.current) return;
      
      const currentTurn = gameTurnRef.current;
      
      setTimers(prev => {
        if (prev[currentTurn] <= 0) return prev;
        return { ...prev, [currentTurn]: prev[currentTurn] - 1 };
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Appliquer coup IA
  const applyAIMove = useCallback((bestMove) => {
    const currentGame = gameRef.current;
    const fen = currentGame.fen();
    const nextGame = new Chess(fen);
    const result = nextGame.move(bestMove);
    
    if (result) {
      const newHistory = [...moveHistoryRef.current, result.san];
      setGame(nextGame);
      setMoveHistory(newHistory);
      setCapturedPieces(buildCapturedFromHistory(newHistory));
      setLastMove({ from: result.from, to: result.to });
      setCheckSquare(nextGame.inCheck() ? findKingSquare(nextGame, nextGame.turn()) : null);
    }
    setIsThinking(false);
  }, []);

  // Demander coup IA
  const requestAIMove = useCallback(() => {
    if (!workerRef.current || isThinking) return;
    
    setIsThinking(true);
    const currentGame = gameRef.current;
    
    workerRef.current.postMessage({
      type: 'getBestMove',
      payload: {
        fen: currentGame.fen(),
        difficulty: gameSettings.difficulty || 'intermediate'
      }
    });
  }, [gameSettings.difficulty, isThinking]);

  // Surveiller tour IA avec délais 1-4s
  useEffect(() => {
    if (
      gameSettings?.mode === 'ai' &&
      !game.isGameOver() &&
      game.turn() === 'b' &&
      !isThinking
    ) {
      // Délai AVANT de lancer le calcul (1-4s selon difficulté)
      let thinkTime = 1000;
      
      if (gameSettings.difficulty === 'easy') {
        thinkTime = 1000; // 1s avant calcul + 1s calcul = 2s total
      } else if (gameSettings.difficulty === 'intermediate') {
        thinkTime = 1500; // 1.5s avant + 2s calcul = 3.5s total
      } else {
        thinkTime = 2000; // 2s avant + 4s calcul = 6s total
      }
      
      const timeout = setTimeout(requestAIMove, thinkTime);
      return () => clearTimeout(timeout);
    }
  }, [game, gameSettings?.mode, gameSettings?.difficulty, isThinking, requestAIMove]);

  // Coup humain
  const onDrop = (sourceSquare, targetSquare) => {
    const currentGame = gameRef.current;
    if (currentGame.isGameOver()) return false;

    if (gameSettings?.mode === 'ai') {
      if (isThinking || currentGame.turn() !== 'w') return false;
    }

    if (isOnline) {
      if (onlineStatus !== 'playing') return false;
      if (currentGame.turn() !== myColor) return false;
    }

    const moves = currentGame.moves({ square: sourceSquare, verbose: true });
    const move = moves.find(m => m.to === targetSquare);
    if (!move) return false;

    const res = applyMove(currentGame, move);
    if (!res) return false;

    const newHistory = [...moveHistory, res.result.san];
    setGame(res.newGame);
    setMoveHistory(newHistory);
    setCapturedPieces(buildCapturedFromHistory(newHistory));
    setLastMove({ from: res.result.from, to: res.result.to });
    setSelectedSquare(null);
    setLegalMoves([]);
    setCheckSquare(res.newGame.inCheck() ? findKingSquare(res.newGame, res.newGame.turn()) : null);

    if (isOnline && socketRef.current && gameId) {
      socketRef.current.emit('makeMove', { gameId, move: res.result.san });
    }

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

  const applyMove = useCallback((chess, moveObj) => {
    try {
      const copy = new Chess(chess.fen());
      const result = copy.move(moveObj);
      if (!result) return null;
      return { newGame: copy, result };
    } catch { return null; }
  }, []);

  const undoMove = () => {
    if (isOnline) return;
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
      styles[lastMove.to] = { background: 'rgba(212,163,115,0.38)' };
    }
    if (checkSquare) {
      styles[checkSquare] = {
        background: 'radial-gradient(circle, rgba(239,68,68,0.55) 0%, transparent 75%)',
      };
    }
    if (selectedSquare) {
      styles[selectedSquare] = { background: 'rgba(99,179,237,0.45)' };
    }
    legalMoves.forEach(sq => {
      styles[sq] = { background: 'radial-gradient(circle, rgba(212,163,115,0.6) 22%, transparent 23%)' };
    });
    return styles;
  };

  const materialAdv = (() => {
    const wVal = capturedPieces.white.reduce((s, p) => s + getPieceValue(p), 0);
    const bVal = capturedPieces.black.reduce((s, p) => s + getPieceValue(p), 0);
    const diff = wVal - bVal;
    if (diff > 0) return { color: 'Blancs', value: diff.toFixed(1) };
    if (diff < 0) return { color: 'Noirs', value: Math.abs(diff).toFixed(1) };
    return null;
  })();

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [moveHistory]);

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
  const diffLabel = { 
    easy: 'Débutant (2s)', 
    intermediate: 'Intermédiaire (3.5s)', 
    hard: 'Expert (6s)' 
  };

  return (
    <div className="cg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cg-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 60% 50% at 25% 20%, rgba(180,130,70,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(160,100,50,0.05) 0%, transparent 60%);
          font-family: 'Crimson Pro', Georgia, serif;
          padding: 2rem 1rem;
          color: #f0e8d8;
        }
        .cg-container { max-width: 1400px; margin: 0 auto; }

        .cg-header { text-align: center; margin-bottom: 2rem; }
        .cg-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cg-subtitle {
          font-style: italic;
          font-size: 1rem;
          color: rgba(240,232,216,0.6);
        }

        .cg-online-banner {
          text-align: center;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(201,145,77,0.3);
          background: rgba(201,145,77,0.1);
        }

        .cg-my-turn-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          background: rgba(74,222,128,0.15);
          color: #86efac;
          font-size: 0.65rem;
        }

        .cg-win-reward {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #c9914d, #a06820);
          color: #1a0f05;
          padding: 0.75rem 2rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-weight: 700;
          z-index: 9999;
        }

        .cg-timer {
          background: rgba(30,22,14,0.6);
          border-radius: 8px;
          padding: 0.4rem 0.8rem;
          text-align: center;
        }
        .cg-timer.active .cg-timer-value {
          color: #c9914d;
        }
        .cg-timer.danger .cg-timer-value {
          color: #ef4444;
        }
        .cg-timer-value {
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .cg-board-wrap {
          background: rgba(40,28,18,0.4);
          border-radius: 16px;
          padding: 1rem;
          border: 1px solid rgba(180,130,60,0.15);
          position: relative;
        }

        .cg-thinking {
          position: absolute;
          inset: 0;
          z-index: 100;
          background: rgba(10,7,4,0.75);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cg-thinking-pill {
          background: rgba(201,145,77,0.18);
          border: 1px solid rgba(201,145,77,0.35);
          border-radius: 100px;
          padding: 0.5rem 1.5rem;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
        }

        .cg-sidebar {
          background: rgba(25,18,10,0.5);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(180,130,60,0.15);
          padding: 1.25rem;
          position: sticky;
          top: 1rem;
        }

        .cg-section {
          padding: 1rem 0;
          border-bottom: 1px solid rgba(180,130,60,0.08);
        }
        .cg-section:last-child {
          border-bottom: none;
        }
        .cg-section-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          text-transform: uppercase;
          color: rgba(201,145,77,0.65);
          margin-bottom: 0.5rem;
        }

        .cg-status {
          text-align: center;
          padding: 0.5rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          background: rgba(201,145,77,0.15);
        }
        .cg-status.check {
          background: rgba(239,68,68,0.2);
          color: #fca5a5;
        }

        .cg-captured {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          min-height: 28px;
        }
        .cg-cap-piece {
          font-size: 1.3rem;
          opacity: 0.7;
        }

        .cg-history {
          max-height: 150px;
          overflow-y: auto;
          background: rgba(10,7,4,0.3);
          border-radius: 8px;
          padding: 0.4rem;
        }
        .cg-move-row {
          display: grid;
          grid-template-columns: 25px 1fr 1fr;
          gap: 0.3rem;
          padding: 0.2rem 0.3rem;
          font-size: 0.8rem;
        }

        .cg-btn {
          padding: 0.5rem 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(180,130,60,0.2);
          background: rgba(40,28,18,0.4);
          color: rgba(240,232,216,0.85);
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          text-transform: uppercase;
          cursor: pointer;
          width: 100%;
        }
        .cg-btn.gold {
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          color: #1a0f05;
          font-weight: 700;
        }
      `}</style>

      {winReward && (
        <div className="cg-win-reward">
          Victoire ! +{winReward.tokens} jetons
        </div>
      )}

      <div className="cg-container">
        <div className="cg-header">
          <h1 className="cg-title">Échecs</h1>
          <p className="cg-subtitle">
            {isOnline
              ? `Mode En Ligne · ${myColor === 'w' ? 'Vous jouez les Blancs' : 'Vous jouez les Noirs'}`
              : gameSettings?.mode === 'ai'
              ? `IA · ${diffLabel[gameSettings.difficulty] || 'Intermédiaire (3.5s)'}`
              : 'Mode Deux Joueurs'}
          </p>
        </div>

        {isOnline && (
          <div className={`cg-online-banner ${onlineStatus}`}>
            <span>{onlineMessage}</span>
            {onlineStatus === 'playing' && game.turn() === myColor && (
              <span className="cg-my-turn-badge">Votre tour</span>
            )}
          </div>
        )}

        <div className="container-fluid px-0">
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <div className="cg-sidebar">
                <div className="cg-section">
                  <div className="cg-section-label">Statut</div>
                  <div className={`cg-status ${isCheck ? 'check' : ''}`}>{status}</div>
                </div>
                <div className="cg-section">
                  <div className="cg-section-label">Coups</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{moveHistory.length}</div>
                </div>
                <div className="cg-section">
                  <div className="cg-section-label">Capturées Blancs</div>
                  <div className="cg-captured">
                    {capturedPieces.white.length === 0 
                      ? <span style={{opacity:0.4}}>aucune</span>
                      : capturedPieces.white.map((p, i) => <span key={i} className="cg-cap-piece">{PIECE_SYMBOLS[p]}</span>)}
                  </div>
                </div>
                <div className="cg-section">
                  <div className="cg-section-label">Capturées Noirs</div>
                  <div className="cg-captured">
                    {capturedPieces.black.length === 0
                      ? <span style={{opacity:0.4}}>aucune</span>
                      : capturedPieces.black.map((p, i) => <span key={i} className="cg-cap-piece">{PIECE_SYMBOLS[p]}</span>)}
                  </div>
                </div>
                {materialAdv && (
                  <div className="cg-section">
                    <div className="cg-section-label">Avantage</div>
                    <div>{materialAdv.color} +{materialAdv.value}</div>
                  </div>
                )}
                <div className="cg-section">
                  <div className="cg-section-label">Historique</div>
                  <div className="cg-history" ref={historyRef}>
                    {moveHistory.length === 0 ? (
                      <span style={{opacity:0.4, fontSize:'0.75rem'}}>Aucun coup</span>
                    ) : (
                      Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                        <div key={i} className="cg-move-row">
                          <span>{i + 1}.</span>
                          <span>{moveHistory[i * 2]}</span>
                          <span>{moveHistory[i * 2 + 1] || ''}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="cg-section">
                  <div className="row g-2">
                    {!isOnline && (
                      <>
                        <div className="col-6">
                          <button className="cg-btn" onClick={undoMove} disabled={moveHistory.length === 0}>Annuler</button>
                        </div>
                        <div className="col-6">
                          <button className="cg-btn" onClick={resetGame}>Nouvelle</button>
                        </div>
                      </>
                    )}
                    <div className="col-12">
                      <button className="cg-btn gold" onClick={() => navigate('/game-selection')}>Menu</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-8">
              <div className="cg-board-section">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <div className={`cg-timer ${game.turn() === 'b' && !isOver ? 'active' : ''} ${timers.b <= 30 ? 'danger' : ''}`}>
                      <div style={{fontSize:'0.7rem',opacity:0.6}}>Noirs</div>
                      <div className="cg-timer-value">{fmt(timers.b)}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className={`cg-timer ${game.turn() === 'w' && !isOver ? 'active' : ''} ${timers.w <= 30 ? 'danger' : ''}`}>
                      <div style={{fontSize:'0.7rem',opacity:0.6}}>Blancs</div>
                      <div className="cg-timer-value">{fmt(timers.w)}</div>
                    </div>
                  </div>
                </div>

                <div className="cg-board-wrap">
                  {isThinking && (
                    <div className="cg-thinking">
                      <div className="cg-thinking-pill">IA réfléchit…</div>
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
    </div>
  );
}

export default ChessGame;
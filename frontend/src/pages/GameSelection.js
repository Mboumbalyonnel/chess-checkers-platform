import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ AJOUT DE useSearchParams
import axios from 'axios';

function GameSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ NOUVEAU: Pour détecter le mode invité
  
  // ✅ NOUVEAU: Détecter si c'est un invité
  const isGuest = searchParams.get('mode') === 'guest';
  const isLoggedIn = !!localStorage.getItem('token');
  
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // ✅ MODIFIÉ: Charger jetons seulement si connecté et pas invité
    const fetchTokens = async () => {
      if (isLoggedIn && !isGuest) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/tokens/balance', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTokens(response.data.tokens);
        } catch (error) {
          console.error('Erreur chargement jetons:', error);
        }
      }
    };
    fetchTokens();
  }, [isLoggedIn, isGuest]); // ✅ AJOUT des dépendances

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setGameMode(null);
    setDifficulty(null);
  };

  const handleModeSelect = (mode) => {
    // ✅ NOUVEAU: Bloquer le mode online pour les invités
    if (mode === 'online' && isGuest) {
      alert('❌ Fonctionnalité réservée aux membres!\n\n✅ Inscrivez-vous GRATUITEMENT pour:\n• Jouer en ligne contre de vrais joueurs\n• Gagner des jetons\n• Suivre vos statistiques\n• Participer au classement');
      return;
    }
    
    setGameMode(mode);
    if (mode === 'online') setDifficulty(null);
  };

  const handleStartGame = async () => {
    const GAME_COST = 10;
    
    if (!selectedGame || !gameMode) return;
    if (gameMode === 'ai' && !difficulty) return;

    // ✅ NOUVEAU: Gestion spéciale pour les invités
    if (isGuest) {
      // Les invités ne peuvent jouer qu'en mode solo
      if (gameMode === 'ai') {
        localStorage.setItem('gameSettings', JSON.stringify({ 
          mode: gameMode, 
          difficulty,
          isGuest: true 
        }));
        navigate(selectedGame === 'chess' ? '/chess' : '/checkers');
        return;
      } else {
        alert('Le mode en ligne est réservé aux membres inscrits.');
        return;
      }
    }

    // ✅ MODIFIÉ: Vérification des jetons pour les utilisateurs connectés
    if (gameMode === 'online') {
      if (!isLoggedIn) {
        alert('Vous devez être connecté pour jouer en ligne.');
        navigate('/login');
        return;
      }

      if (tokens < GAME_COST) {
        alert(`Jetons insuffisants. Il vous faut ${GAME_COST} jetons pour jouer en ligne. Vous en avez ${tokens}.`);
        return;
      }
    }

    localStorage.setItem('gameSettings', JSON.stringify({ 
      mode: gameMode, 
      difficulty,
      isGuest: false 
    }));
    navigate(selectedGame === 'chess' ? '/chess' : '/checkers');
  };

  const canStart = selectedGame && gameMode && (gameMode === 'online' || difficulty);

  return (
    <div className="gs-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gs-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 70% 60% at 15% 10%, rgba(180,130,70,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 50% 70% at 85% 90%, rgba(140,90,40,0.06) 0%, transparent 55%),
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
          padding: 3rem 1.5rem;
        }

        .gs-container {
          max-width: 960px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .gs-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ✅ NOUVEAU: Bannière pour invités */
        .gs-guest-banner {
          background: linear-gradient(135deg, rgba(201,145,77,0.15), rgba(201,145,77,0.08));
          border: 2px solid rgba(201,145,77,0.3);
          border-radius: 24px;
          padding: 2rem;
          margin-bottom: 2.5rem;
          text-align: center;
          animation: bannerFade 0.5s ease;
        }
        @keyframes bannerFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gs-guest-banner-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }
        .gs-guest-banner-title {
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #c9914d;
          margin-bottom: 0.75rem;
        }
        .gs-guest-banner-text {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .gs-guest-banner-btn {
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          color: #1a0f05;
          border: none;
          padding: 0.9rem 2rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(201,145,77,0.3);
        }
        .gs-guest-banner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(201,145,77,0.4);
        }

        /* ── Header ── */
        .gs-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .gs-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.7);
          margin-bottom: 1.5rem;
        }
        .gs-eyebrow-line {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,145,77,0.5));
        }
        .gs-eyebrow-line.right {
          background: linear-gradient(90deg, rgba(201,145,77,0.5), transparent);
        }
        .gs-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 900;
          letter-spacing: 0.04em;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 40%, #f5e6c8 75%, #a06820 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 20px rgba(180,130,60,0.25));
          margin-bottom: 0.75rem;
          line-height: 1.1;
        }
        .gs-subtitle {
          font-style: italic;
          font-size: 1.1rem;
          color: rgba(240,232,216,0.55);
          letter-spacing: 0.03em;
          margin-bottom: 2.5rem;
        }

        /* Token balance */
        .gs-balance {
          display: inline-flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(30,22,14,0.6);
          border: 1px solid rgba(201,145,77,0.2);
          border-radius: 100px;
          padding: 0.75rem 2rem;
          margin-bottom: 3rem;
        }
        .gs-balance-label {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.6);
        }
        .gs-balance-value {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #c9914d;
        }
        .gs-balance-divider {
          width: 1px; height: 24px;
          background: rgba(201,145,77,0.2);
        }
        .gs-balance-hint {
          font-size: 0.8rem;
          color: rgba(240,232,216,0.4);
          font-style: italic;
        }

        /* Progress steps */
        .gs-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }
        .gs-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.4s ease;
        }
        .gs-step-num {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(201,145,77,0.2);
          background: rgba(20,14,8,0.6);
          color: rgba(240,232,216,0.3);
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .gs-step.active .gs-step-num {
          border-color: #c9914d;
          background: rgba(201,145,77,0.15);
          color: #c9914d;
          box-shadow: 0 0 20px rgba(201,145,77,0.25);
        }
        .gs-step.done .gs-step-num {
          border-color: rgba(201,145,77,0.4);
          background: rgba(201,145,77,0.1);
          color: rgba(201,145,77,0.7);
        }
        .gs-step-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.3);
          transition: color 0.4s;
        }
        .gs-step.active .gs-step-label,
        .gs-step.done .gs-step-label {
          color: rgba(201,145,77,0.7);
        }
        .gs-step-connector {
          width: 60px; height: 1px;
          background: rgba(201,145,77,0.15);
          margin-bottom: 20px;
        }

        /* ── Section ── */
        .gs-section {
          margin-bottom: 3rem;
          animation: sectionIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gs-section-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.75rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(201,145,77,0.1);
        }
        .gs-section-bar {
          width: 3px; height: 32px;
          background: linear-gradient(180deg, #c9914d, #a06820);
          border-radius: 100px;
          box-shadow: 0 0 12px rgba(201,145,77,0.3);
          flex-shrink: 0;
        }
        .gs-section-title {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #f0e8d8;
          margin-bottom: 0.15rem;
        }
        .gs-section-sub {
          font-size: 0.85rem;
          font-style: italic;
          color: rgba(240,232,216,0.45);
        }

        /* ── Game cards ── */
        .gs-game-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 600px) { .gs-game-grid { grid-template-columns: 1fr; } }

        .gs-game-card {
          position: relative;
          background: rgba(25,18,10,0.5);
          border: 1px solid rgba(201,145,77,0.12);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          text-align: center;
        }
        .gs-game-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(201,145,77,0.08) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .gs-game-card:hover::before, .gs-game-card.active::before { opacity: 1; }
        .gs-game-card:hover {
          border-color: rgba(201,145,77,0.28);
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,145,77,0.08);
        }
        .gs-game-card.active {
          border-color: rgba(201,145,77,0.5);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(201,145,77,0.12), inset 0 1px 0 rgba(201,145,77,0.1);
          transform: translateY(-2px);
        }

        .gs-game-icon {
          width: 72px; height: 72px;
          margin: 0 auto 1.5rem;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,145,77,0.08);
          border: 1px solid rgba(201,145,77,0.15);
          border-radius: 16px;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s;
        }
        .gs-game-card:hover .gs-game-icon,
        .gs-game-card.active .gs-game-icon {
          transform: scale(1.1) rotate(-3deg);
          box-shadow: 0 8px 24px rgba(201,145,77,0.2);
        }
        .gs-game-svg { width: 40px; height: 40px; }

        .gs-game-name {
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #f0e8d8;
          margin-bottom: 0.5rem;
        }
        .gs-game-desc {
          font-size: 0.88rem;
          font-style: italic;
          color: rgba(240,232,216,0.45);
          line-height: 1.5;
        }

        .gs-check {
          position: absolute;
          top: 1.1rem; right: 1.1rem;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9914d, #a06820);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem;
          color: #1a0f05;
          font-weight: 900;
          box-shadow: 0 4px 12px rgba(201,145,77,0.4);
          animation: popIn 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes popIn {
          from { transform: scale(0) rotate(-20deg); }
          to   { transform: scale(1) rotate(0deg); }
        }

        /* ── Mode cards ── */
        .gs-mode-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 600px) { .gs-mode-grid { grid-template-columns: 1fr; } }

        .gs-mode-card {
          position: relative;
          background: rgba(25,18,10,0.5);
          border: 1px solid rgba(201,145,77,0.12);
          border-radius: 18px;
          padding: 2rem 1.75rem;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .gs-mode-card:hover {
          border-color: rgba(201,145,77,0.28);
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }
        .gs-mode-card.active {
          border-color: rgba(201,145,77,0.5);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 24px rgba(201,145,77,0.1);
        }
        .gs-mode-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .gs-mode-card.disabled:hover {
          transform: none;
          border-color: rgba(201,145,77,0.12);
        }
        .gs-mode-title {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #f0e8d8;
        }
        .gs-mode-desc {
          font-size: 0.85rem;
          font-style: italic;
          color: rgba(240,232,216,0.45);
          line-height: 1.5;
        }
        .gs-mode-tag {
          display: inline-block;
          align-self: flex-start;
          padding: 0.3rem 0.9rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .gs-mode-tag.free {
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.25);
          color: #86efac;
        }
        .gs-mode-tag.paid {
          background: rgba(201,145,77,0.12);
          border: 1px solid rgba(201,145,77,0.25);
          color: #c9914d;
        }
        .gs-mode-tag.members-only {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
        }

        /* ── Difficulty cards ── */
        .gs-diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 600px) { .gs-diff-grid { grid-template-columns: 1fr; } }

        .gs-diff-card {
          position: relative;
          background: rgba(25,18,10,0.5);
          border: 1px solid rgba(201,145,77,0.12);
          border-radius: 16px;
          padding: 1.75rem 1.25rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .gs-diff-card:hover {
          border-color: rgba(201,145,77,0.28);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }
        .gs-diff-card.active {
          border-color: rgba(201,145,77,0.5);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 20px rgba(201,145,77,0.1);
        }
        .gs-diff-orb {
          width: 48px; height: 48px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          position: relative;
        }
        .gs-diff-orb::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          opacity: 0.5;
          filter: blur(8px);
          transform: scale(1.2);
        }
        .gs-diff-orb.easy { background: radial-gradient(135deg, #4ade80, #16a34a); }
        .gs-diff-orb.easy::after { background: #4ade80; }
        .gs-diff-orb.intermediate { background: radial-gradient(135deg, #c9914d, #a06820); }
        .gs-diff-orb.intermediate::after { background: #c9914d; }
        .gs-diff-orb.hard { background: radial-gradient(135deg, #f87171, #dc2626); }
        .gs-diff-orb.hard::after { background: #f87171; }

        .gs-diff-name {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #f0e8d8;
          margin-bottom: 0.4rem;
        }
        .gs-diff-desc {
          font-size: 0.8rem;
          font-style: italic;
          color: rgba(240,232,216,0.4);
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .gs-diff-pips {
          display: flex; justify-content: center; gap: 5px;
        }
        .gs-pip {
          width: 24px; height: 3px;
          border-radius: 100px;
          background: rgba(201,145,77,0.15);
          transition: background 0.3s;
        }
        .gs-pip.on { background: linear-gradient(90deg, #c9914d, #f5e6c8); }

        /* ── Actions ── */
        .gs-actions {
          margin-top: 3.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(201,145,77,0.1);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .gs-btn-start {
          width: 100%;
          padding: 1.1rem 2rem;
          border-radius: 100px;
          border: none;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          background: rgba(40,28,18,0.6);
          color: rgba(240,232,216,0.3);
          border: 1px solid rgba(201,145,77,0.1);
        }
        .gs-btn-start.ready {
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          color: #1a0f05;
          border-color: transparent;
          box-shadow: 0 8px 28px rgba(201,145,77,0.3);
        }
        .gs-btn-start.ready:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(201,145,77,0.45);
        }
        .gs-btn-start.ready:active { transform: translateY(0); }
        .gs-btn-start-shine {
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.6s ease;
        }
        .gs-btn-start.ready:hover .gs-btn-start-shine { left: 150%; }

        .gs-btn-back {
          width: 100%;
          padding: 0.9rem 2rem;
          border-radius: 100px;
          border: 1px solid rgba(201,145,77,0.15);
          background: transparent;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.5);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .gs-btn-back:hover {
          border-color: rgba(201,145,77,0.3);
          color: rgba(240,232,216,0.8);
          background: rgba(201,145,77,0.05);
        }

        /* Info box pour invités/connectés */
        .gs-info-box {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(30,22,14,0.4);
          border: 1px solid rgba(201,145,77,0.15);
          border-radius: 16px;
          text-align: center;
          font-size: 0.9rem;
        }
        .gs-info-box.guest {
          border-color: rgba(201,145,77,0.3);
        }
        .gs-info-box strong {
          color: #c9914d;
          font-weight: 700;
        }
        .gs-info-box small {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: rgba(240,232,216,0.4);
          font-style: italic;
        }
      `}</style>

      <div className={`gs-container ${mounted ? 'visible' : ''}`}>

        {/* ✅ NOUVEAU: Bannière pour invités */}
        {isGuest && (
          <div className="gs-guest-banner">
            <div className="gs-guest-banner-icon">👋</div>
            <div className="gs-guest-banner-title">Mode Invité</div>
            <div className="gs-guest-banner-text">
              Vous jouez en mode invité. Le mode en ligne est réservé aux membres.
            </div>
            <button
              className="gs-guest-banner-btn"
              onClick={() => navigate('/register')}
            >
              S'inscrire Gratuitement
            </button>
          </div>
        )}

        {/* Header */}
        <div className="gs-header">
          <div className="gs-eyebrow">
            <span className="gs-eyebrow-line" />
            Configuration de Partie
            <span className="gs-eyebrow-line right" />
          </div>
          <h1 className="gs-title">Choisissez Votre Combat</h1>
          <p className="gs-subtitle">Personnalisez votre expérience avant d'entrer en jeu</p>

          {/* Balance - Modifié pour ne pas s'afficher pour les invités */}
          {!isGuest && (
            <div className="gs-balance">
              <span className="gs-balance-label">Solde</span>
              <div className="gs-balance-divider" />
              <span className="gs-balance-value">{tokens}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(201,145,77,0.5)' }}>jetons</span>
              <div className="gs-balance-divider" />
              <span className="gs-balance-hint">Solo gratuit · En ligne: 10 jetons</span>
            </div>
          )}

          {/* Steps */}
          <div className="gs-steps">
            <div className={`gs-step ${selectedGame ? 'done' : 'active'}`}>
              <div className="gs-step-num">1</div>
              <div className="gs-step-label">Jeu</div>
            </div>
            <div className="gs-step-connector" />
            <div className={`gs-step ${gameMode ? 'done' : selectedGame ? 'active' : ''}`}>
              <div className="gs-step-num">2</div>
              <div className="gs-step-label">Mode</div>
            </div>
            <div className="gs-step-connector" />
            <div className={`gs-step ${canStart ? 'done' : gameMode === 'ai' ? 'active' : ''}`}>
              <div className="gs-step-num">3</div>
              <div className="gs-step-label">Niveau</div>
            </div>
          </div>
        </div>

        {/* Game selection */}
        <div className="gs-section">
          <div className="gs-section-head">
            <div className="gs-section-bar" />
            <div>
              <div className="gs-section-title">Sélectionnez le Jeu</div>
              <div className="gs-section-sub">Choisissez votre discipline stratégique</div>
            </div>
          </div>
          <div className="gs-game-grid">
            {/* Chess */}
            <div
              className={`gs-game-card ${selectedGame === 'chess' ? 'active' : ''}`}
              onClick={() => handleGameSelect('chess')}
            >
              <div className="gs-game-icon">
                <svg className="gs-game-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4 L21 11 L18 13 L19.5 18 L16 22 L16 32 L14 40 L14 44 L34 44 L34 40 L32 32 L32 22 L28.5 18 L30 13 L27 11 Z" fill="url(#cg1)" />
                  <ellipse cx="24" cy="5.5" rx="4" ry="3" fill="url(#cg1)" />
                  <rect x="12" y="44" width="24" height="4" rx="2" fill="url(#cg1)" />
                  <line x1="21" y1="5" x2="21" y2="1" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="27" y1="5" x2="27" y2="1" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="24" y1="1" x2="19" y2="1" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="24" y1="1" x2="29" y2="1" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f5e6c8" />
                      <stop offset="100%" stopColor="#c9914d" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="gs-game-name">Échecs</div>
              <div className="gs-game-desc">Le test ultime de réflexion stratégique et de prouesse tactique</div>
              {selectedGame === 'chess' && <div className="gs-check">✓</div>}
            </div>

            {/* Checkers */}
            <div
              className={`gs-game-card ${selectedGame === 'checkers' ? 'active' : ''}`}
              onClick={() => handleGameSelect('checkers')}
            >
              <div className="gs-game-icon">
                <svg className="gs-game-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="42" height="42" rx="5" stroke="url(#cg2)" strokeWidth="2.5" fill="none" />
                  <line x1="3" y1="13.5" x2="45" y2="13.5" stroke="url(#cg2)" strokeWidth="1.2" />
                  <line x1="3" y1="24" x2="45" y2="24" stroke="url(#cg2)" strokeWidth="1.2" />
                  <line x1="3" y1="34.5" x2="45" y2="34.5" stroke="url(#cg2)" strokeWidth="1.2" />
                  <line x1="13.5" y1="3" x2="13.5" y2="45" stroke="url(#cg2)" strokeWidth="1.2" />
                  <line x1="24" y1="3" x2="24" y2="45" stroke="url(#cg2)" strokeWidth="1.2" />
                  <line x1="34.5" y1="3" x2="34.5" y2="45" stroke="url(#cg2)" strokeWidth="1.2" />
                  <circle cx="8.75" cy="8.75" r="4" fill="url(#cg2)" />
                  <circle cx="19.25" cy="19.25" r="4" fill="url(#cg2)" />
                  <circle cx="29.75" cy="29.75" r="4" fill="url(#cg2)" />
                  <circle cx="39.25" cy="39.25" r="4" fill="url(#cg2)" />
                  <defs>
                    <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f5e6c8" />
                      <stop offset="100%" stopColor="#c9914d" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="gs-game-name">Dames</div>
              <div className="gs-game-desc">Jeu de plateau classique alliant simplicité élégante et stratégie profonde</div>
              {selectedGame === 'checkers' && <div className="gs-check">✓</div>}
            </div>
          </div>
        </div>

        {/* Mode selection - MODIFIÉ: avec désactivation conditionnelle pour invités */}
        {selectedGame && (
          <div className="gs-section">
            <div className="gs-section-head">
              <div className="gs-section-bar" />
              <div>
                <div className="gs-section-title">Choisissez le Mode</div>
                <div className="gs-section-sub">Sélectionnez votre type d'adversaire</div>
              </div>
            </div>
            <div className="gs-mode-grid">
              <div
                className={`gs-mode-card ${gameMode === 'ai' ? 'active' : ''}`}
                onClick={() => handleModeSelect('ai')}
              >
                <div className="gs-mode-title">Mode Solo</div>
                <div className="gs-mode-desc">Affrontez notre intelligence artificielle — trois niveaux de difficulté disponibles</div>
                <div className="gs-mode-tag free">GRATUIT</div>
                {gameMode === 'ai' && <div className="gs-check">✓</div>}
              </div>
              
              {/* MODE ONLINE - Désactivé pour les invités */}
              <div
                className={`gs-mode-card ${gameMode === 'online' ? 'active' : ''} ${isGuest ? 'disabled' : ''}`}
                onClick={() => handleModeSelect('online')}
                style={isGuest ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <div className="gs-mode-title">Match en Ligne</div>
                <div className="gs-mode-desc">Affrontez des joueurs réels du monde entier en temps réel</div>
                {isGuest ? (
                  <div className="gs-mode-tag members-only">MEMBRES UNIQUEMENT</div>
                ) : (
                  <div className="gs-mode-tag paid">10 jetons / partie</div>
                )}
                {gameMode === 'online' && !isGuest && <div className="gs-check">✓</div>}
              </div>
            </div>
          </div>
        )}

        {/* Difficulty */}
        {selectedGame && gameMode === 'ai' && (
          <div className="gs-section">
            <div className="gs-section-head">
              <div className="gs-section-bar" />
              <div>
                <div className="gs-section-title">Sélectionnez le Niveau</div>
                <div className="gs-section-sub">Ajustez le défi selon vos compétences</div>
              </div>
            </div>
            <div className="gs-diff-grid">
              {[
                { key: 'easy',         label: 'Débutant',      desc: 'Idéal pour apprendre les bases', orb: 'easy',         pips: [true, false, false] },
                { key: 'intermediate', label: 'Intermédiaire', desc: 'Équilibre entre défi et plaisir', orb: 'intermediate', pips: [true, true,  false] },
                { key: 'hard',         label: 'Expert',        desc: 'Test ultime de vos capacités',   orb: 'hard',         pips: [true, true,  true ] },
              ].map(({ key, label, desc, orb, pips }) => (
                <div
                  key={key}
                  className={`gs-diff-card ${difficulty === key ? 'active' : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  <div className={`gs-diff-orb ${orb}`} />
                  <div className="gs-diff-name">{label}</div>
                  <div className="gs-diff-desc">{desc}</div>
                  <div className="gs-diff-pips">
                    {pips.map((on, i) => <div key={i} className={`gs-pip ${on ? 'on' : ''}`} />)}
                  </div>
                  {difficulty === key && <div className="gs-check">✓</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="gs-actions">
          <button
            className={`gs-btn-start ${canStart ? 'ready' : ''}`}
            onClick={handleStartGame}
            disabled={!canStart}
          >
            <span className="gs-btn-start-shine" />
            {canStart ? 'Commencer la Partie' : 'Complétez la Configuration'}
          </button>
          <button className="gs-btn-back" onClick={() => navigate('/')}>
            Retour à l'Accueil
          </button>
        </div>

        {/* Info box pour invités/connectés */}
        {isGuest && (
          <div className="gs-info-box guest">
            <p>ℹ️ <strong>Mode Invité</strong> — Solo IA uniquement</p>
            <small>Inscrivez-vous pour débloquer le mode en ligne, gagner des jetons et suivre vos statistiques!</small>
          </div>
        )}
        
        {isLoggedIn && !isGuest && (
          <div className="gs-info-box">
            <p>💰 <strong>Solde: {tokens} jetons</strong></p>
            <small>Mode Solo illimité • Partie en ligne: 10 jetons • Victoire: +15 jetons</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameSelection;
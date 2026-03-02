import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ État pour la modale

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  const handlePlayWithAccount = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      setShowAuthModal(true); // ✅ Afficher la modale au lieu de l'alert
    } else {
      navigate('/game-selection');
    }
  };

  return (
    <div className="h-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .h-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180,130,70,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 10% 80%, rgba(140,90,40,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 90% 70%, rgba(160,110,50,0.05) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .h-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 3rem;
          border-bottom: 1px solid rgba(201,145,77,0.08);
          position: relative;
          z-index: 10;
        }
        .h-nav-logo {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #c9914d;
          text-transform: uppercase;
        }
        .h-nav-logo span {
          color: rgba(240,232,216,0.4);
          font-weight: 400;
          margin-left: 0.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
        }
        .h-nav-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .h-nav-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 600;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          border: 1px solid rgba(201,145,77,0.2);
          background: transparent;
          color: rgba(240,232,216,0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }
        .h-nav-btn:hover {
          border-color: rgba(201,145,77,0.4);
          color: #f0e8d8;
          background: rgba(201,145,77,0.06);
        }
        .h-nav-btn.ghost {
          border-color: rgba(240,232,216,0.12);
          color: rgba(240,232,216,0.45);
        }
        .h-nav-btn.ghost:hover {
          border-color: rgba(240,232,216,0.25);
          color: rgba(240,232,216,0.7);
          background: rgba(255,255,255,0.03);
        }

        .h-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 5rem 2rem 4rem;
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .h-hero.visible { opacity: 1; transform: translateY(0); }

        .h-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Cinzel', serif;
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.65);
          margin-bottom: 2rem;
        }
        .h-eyebrow-line {
          width: 36px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,145,77,0.5));
        }
        .h-eyebrow-line.r {
          background: linear-gradient(90deg, rgba(201,145,77,0.5), transparent);
        }

        .h-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 900;
          letter-spacing: 0.02em;
          line-height: 1.05;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 35%, #f5e6c8 65%, #a06820 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 24px rgba(180,130,60,0.22));
          margin-bottom: 0.5rem;
        }
        .h-title-sub {
          font-family: 'Cinzel', serif;
          font-size: clamp(1rem, 2.5vw, 1.6rem);
          font-weight: 400;
          letter-spacing: 0.18em;
          color: rgba(201,145,77,0.55);
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }

        .h-ornament {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .h-orn-line {
          flex: 1; max-width: 100px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,145,77,0.3));
        }
        .h-orn-line.r {
          background: linear-gradient(90deg, rgba(201,145,77,0.3), transparent);
        }
        .h-orn-diamond {
          width: 7px; height: 7px;
          background: #c9914d;
          transform: rotate(45deg);
          box-shadow: 0 0 10px rgba(201,145,77,0.5);
        }

        .h-tagline {
          font-size: 1.15rem;
          font-style: italic;
          color: rgba(240,232,216,0.5);
          letter-spacing: 0.03em;
          margin-bottom: 3.5rem;
          max-width: 480px;
        }

        .h-cta {
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          width: 100%;
        }

        .h-cta-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .h-cta-btn {
          display: inline-block;
          position: relative;
          overflow: hidden;
          padding: 1.15rem 3.5rem;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1a0f05;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(201,145,77,0.35), 0 0 0 1px rgba(201,145,77,0.15);
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          text-decoration: none;
          min-width: 240px;
        }
        .h-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(201,145,77,0.5), 0 0 0 1px rgba(201,145,77,0.2);
        }
        .h-cta-btn:active { transform: translateY(-1px); }
        .h-cta-shine {
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        .h-cta-btn:hover .h-cta-shine { left: 150%; }

        .h-cta-btn.secondary {
          background: transparent;
          border: 1px solid rgba(201,145,77,0.3);
          color: #c9914d;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem 2.5rem;
        }
        .h-cta-btn.secondary:hover {
          background: rgba(201,145,77,0.05);
          border-color: rgba(201,145,77,0.5);
          color: #f5e6c8;
          transform: translateY(-2px);
        }
        .h-cta-btn.secondary span {
          font-size: 0.7rem;
          opacity: 0.6;
          font-style: italic;
          letter-spacing: 0.05em;
        }

        .h-cta-hint {
          font-size: 0.9rem;
          color: rgba(240,232,216,0.5);
          font-style: italic;
          margin-top: 1rem;
        }

        /* ✅ NOUVEAU: Styles pour la modale d'authentification */
        .h-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modalFadeIn 0.3s ease;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .h-modal {
          background: #1a150f;
          border: 2px solid rgba(201,145,77,0.3);
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 440px;
          width: 90%;
          position: relative;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,145,77,0.2);
          animation: modalSlideUp 0.4s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .h-modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: rgba(240,232,216,0.3);
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s;
        }
        .h-modal-close:hover {
          color: rgba(240,232,216,0.7);
        }

        .h-modal-title {
          font-family: 'Cinzel', serif;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #f5e6c8, #c9914d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .h-modal-subtitle {
          font-size: 1rem;
          color: rgba(240,232,216,0.5);
          font-style: italic;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(201,145,77,0.15);
          padding-bottom: 1.25rem;
        }

        .h-modal-list {
          list-style: none;
          margin-bottom: 2rem;
        }

        .h-modal-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0;
          color: rgba(240,232,216,0.8);
          font-size: 1rem;
          border-bottom: 1px solid rgba(201,145,77,0.06);
        }

        .h-modal-list li:last-child {
          border-bottom: none;
        }

        .h-modal-bullet {
          width: 6px;
          height: 6px;
          background: #c9914d;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(201,145,77,0.4);
        }

        .h-modal-badge {
          background: rgba(201,145,77,0.1);
          border: 1px solid rgba(201,145,77,0.2);
          border-radius: 100px;
          padding: 0.25rem 1rem;
          font-size: 0.7rem;
          font-family: 'Cinzel', serif;
          color: #c9914d;
          margin-left: 0.5rem;
          letter-spacing: 0.05em;
        }

        .h-modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .h-modal-btn {
          flex: 1;
          padding: 1rem;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          text-decoration: none;
        }

        .h-modal-btn.primary {
          background: linear-gradient(135deg, #c9914d, #a06820);
          border: none;
          color: #1a0f05;
          box-shadow: 0 4px 16px rgba(201,145,77,0.3);
        }
        .h-modal-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201,145,77,0.4);
        }

        .h-modal-btn.secondary {
          background: transparent;
          border: 1px solid rgba(201,145,77,0.3);
          color: rgba(240,232,216,0.7);
        }
        .h-modal-btn.secondary:hover {
          border-color: rgba(201,145,77,0.5);
          color: #f0e8d8;
          background: rgba(201,145,77,0.05);
        }

        .h-modal-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(240,232,216,0.4);
        }
        .h-modal-footer a {
          color: #c9914d;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .h-modal-footer a:hover {
          color: #f5e6c8;
        }

        .h-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(201,145,77,0.08);
          border: 1px solid rgba(201,145,77,0.08);
          border-radius: 20px;
          overflow: hidden;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.8s 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .h-features.visible { opacity: 1; transform: translateY(0); }

        @media (max-width: 768px) {
          .h-features { grid-template-columns: 1fr 1fr; }
          .h-nav { padding: 1.25rem 1.5rem; }
          .h-title { font-size: 2.5rem; }
          .h-cta-buttons { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .h-features { grid-template-columns: 1fr; }
        }

        .h-feature {
          background: rgba(16,11,7,0.8);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: background 0.3s ease;
          cursor: default;
        }
        .h-feature:hover { background: rgba(25,18,10,0.9); }

        .h-feature-icon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,145,77,0.08);
          border: 1px solid rgba(201,145,77,0.15);
          border-radius: 10px;
          margin-bottom: 0.25rem;
          transition: all 0.3s ease;
        }
        .h-feature:hover .h-feature-icon {
          background: rgba(201,145,77,0.13);
          border-color: rgba(201,145,77,0.28);
          box-shadow: 0 4px 16px rgba(201,145,77,0.12);
        }
        .h-feature-icon svg { width: 20px; height: 20px; }

        .h-feature-name {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #f0e8d8;
        }
        .h-feature-desc {
          font-size: 0.83rem;
          font-style: italic;
          color: rgba(240,232,216,0.4);
          line-height: 1.5;
        }

        .h-footer {
          text-align: center;
          padding: 1.75rem 2rem;
          border-top: 1px solid rgba(201,145,77,0.07);
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.2);
        }
      `}</style>

      {/* ✅ NOUVELLE: Modale d'authentification */}
      {showAuthModal && (
        <div className="h-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="h-modal" onClick={(e) => e.stopPropagation()}>
            <button className="h-modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            
            <div className="h-modal-title">Connexion Requise</div>
            <div className="h-modal-subtitle">
              Connectez-vous pour accéder à toutes les fonctionnalités
            </div>

            <ul className="h-modal-list">
              <li>
                <span className="h-modal-bullet" />
                Mode Solo GRATUIT & ILLIMITÉ
                <span className="h-modal-badge">∞</span>
              </li>
              <li>
                <span className="h-modal-bullet" />
                Mode En Ligne
                <span className="h-modal-badge">10 jetons</span>
              </li>
              <li>
                <span className="h-modal-bullet" />
                Système de Jetons
                <span className="h-modal-badge">100 offerts</span>
              </li>
              <li>
                <span className="h-modal-bullet" />
                Statistiques & Historique
              </li>
            </ul>

            <div className="h-modal-actions">
              <button 
                className="h-modal-btn primary" 
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login');
                }}
              >
                Se Connecter
              </button>
              <button 
                className="h-modal-btn secondary" 
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/register');
                }}
              >
                Créer un Compte
              </button>
            </div>

            <div className="h-modal-footer">
              <Link to="/game-selection?mode=guest" onClick={() => setShowAuthModal(false)}>
                Continuer en mode invité →
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="h-nav">
        <div className="h-nav-logo">
          Strategie
          <span>Elite</span>
        </div>
        <div className="h-nav-actions">
          {isLoggedIn ? (
            <button className="h-nav-btn ghost" onClick={handleLogout}>
              Deconnexion
            </button>
          ) : (
            <>
              <button className="h-nav-btn ghost" onClick={() => navigate('/login')}>
                Connexion
              </button>
              <button className="h-nav-btn" onClick={() => navigate('/register')}>
                Creer un compte
              </button>
            </>
          )}
        </div>
      </nav>

      <div className={`h-hero ${mounted ? 'visible' : ''}`}>
        <div className="h-eyebrow">
          <span className="h-eyebrow-line" />
          Echecs · Dames · Strategie
          <span className="h-eyebrow-line r" />
        </div>

        <h1 className="h-title">Jeux de<br />Strategie Elite</h1>
        <div className="h-title-sub">Maitrisez l'art du jeu</div>

        <div className="h-ornament">
          <div className="h-orn-line" />
          <div className="h-orn-diamond" />
          <div className="h-orn-line r" />
        </div>

        <p className="h-tagline">
          Affrontez une intelligence artificielle de haut niveau ou mesurez-vous a des joueurs du monde entier.
        </p>

        <div className="h-cta">
          <div className="h-cta-buttons">
            <button className="h-cta-btn" onClick={handlePlayWithAccount}>
              <span className="h-cta-shine" />
              Jouer avec compte
            </button>

            <Link to="/game-selection?mode=guest" className="h-cta-btn secondary">
              Jouer Sans Compte
              <span>(Solo IA uniquement)</span>
            </Link>
          </div>

          <p className="h-cta-hint">
            Inscription gratuite • 100 jetons offerts • Mode Solo illimite
          </p>
        </div>

        <div className={`h-features ${mounted ? 'visible' : ''}`}>
          {[
            {
              name: 'Echecs Classiques',
              desc: 'Le jeu legendaire avec IA avancee et mode multijoueur',
              icon: (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L10.5 6.5L9 7.5L9.75 10L8 12L8 17L7 21H17L16 17L16 12L14.25 10L15 7.5L13.5 6.5Z" fill="url(#fi1)" />
                  <rect x="6" y="21" width="12" height="2" rx="1" fill="url(#fi1)" />
                  <defs><linearGradient id="fi1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6c8"/><stop offset="100%" stopColor="#c9914d"/></linearGradient></defs>
                </svg>
              ),
            },
            {
              name: 'Jeu de Dames',
              desc: 'Strategie pure, trois niveaux de difficulte',
              icon: (
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="3" stroke="url(#fi2)" strokeWidth="1.5" fill="none"/>
                  <circle cx="7" cy="7" r="2.5" fill="url(#fi2)"/>
                  <circle cx="17" cy="17" r="2.5" fill="url(#fi2)"/>
                  <defs><linearGradient id="fi2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6c8"/><stop offset="100%" stopColor="#c9914d"/></linearGradient></defs>
                </svg>
              ),
            },
            {
              name: 'Mode En Ligne',
              desc: 'Affrontez des joueurs du monde entier en temps reel',
              icon: (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="url(#fi3)" strokeWidth="1.5" fill="none"/>
                  <path d="M12 3 Q7 7, 7 12 Q7 17, 12 21" stroke="url(#fi3)" strokeWidth="1.2" fill="none"/>
                  <path d="M12 3 Q17 7, 17 12 Q17 17, 12 21" stroke="url(#fi3)" strokeWidth="1.2" fill="none"/>
                  <line x1="3" y1="12" x2="21" y2="12" stroke="url(#fi3)" strokeWidth="1.2"/>
                  <defs><linearGradient id="fi3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6c8"/><stop offset="100%" stopColor="#c9914d"/></linearGradient></defs>
                </svg>
              ),
            },
            {
              name: 'Mode Solo',
              desc: 'Intelligence artificielle adaptee a votre niveau',
              icon: (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="url(#fi4)" strokeWidth="1.5" fill="none"/>
                  <path d="M4 20 C4 16, 8 14, 12 14 C16 14, 20 16, 20 20" stroke="url(#fi4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <defs><linearGradient id="fi4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6c8"/><stop offset="100%" stopColor="#c9914d"/></linearGradient></defs>
                </svg>
              ),
            },
          ].map(({ name, desc, icon }) => (
            <div className="h-feature" key={name}>
              <div className="h-feature-icon">{icon}</div>
              <div className="h-feature-name">{name}</div>
              <div className="h-feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="h-footer">
        © 2026 Jeux de Strategie Elite — Tous droits reserves
      </footer>
    </div>
  );
}

export default Home;
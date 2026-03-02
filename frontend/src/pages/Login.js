import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/game-selection');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ln-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ln-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 70% 60% at 50% -5%, rgba(180,130,70,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 90%, rgba(140,90,40,0.05) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
        }

        /* Card */
        .ln-card {
          width: 100%;
          background: rgba(20,14,8,0.7);
          border: 1px solid rgba(201,145,77,0.14);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .ln-card.visible { opacity: 1; transform: translateY(0); }

        /* Header */
        .ln-header { text-align: center; margin-bottom: 2.5rem; }

        .ln-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.6);
          margin-bottom: 1.25rem;
        }
        .ln-eyebrow-line {
          width: 28px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,145,77,0.45));
        }
        .ln-eyebrow-line.r {
          background: linear-gradient(90deg, rgba(201,145,77,0.45), transparent);
        }

        .ln-title {
          font-family: 'Cinzel', serif;
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 45%, #f5e6c8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 12px rgba(180,130,60,0.2));
          margin-bottom: 0.4rem;
        }

        .ln-ornament {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 0.6rem 0 0.75rem;
          justify-content: center;
        }
        .ln-orn-line {
          width: 32px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,145,77,0.3));
        }
        .ln-orn-line.r { background: linear-gradient(90deg, rgba(201,145,77,0.3), transparent); }
        .ln-orn-diamond {
          width: 5px; height: 5px;
          background: #c9914d;
          transform: rotate(45deg);
          box-shadow: 0 0 8px rgba(201,145,77,0.5);
        }

        .ln-subtitle {
          font-style: italic;
          font-size: 0.9rem;
          color: rgba(240,232,216,0.4);
          letter-spacing: 0.02em;
        }

        /* Error */
        .ln-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.88rem;
          color: #fca5a5;
          font-style: italic;
        }

        /* Form */
        .ln-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .ln-field { display: flex; flex-direction: column; gap: 0.45rem; }

        .ln-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.65);
        }

        .ln-input {
          width: 100%;
          background: rgba(10,7,4,0.5);
          border: 1px solid rgba(201,145,77,0.15);
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1rem;
          color: #f0e8d8;
          outline: none;
          transition: all 0.3s ease;
        }
        .ln-input::placeholder { color: rgba(240,232,216,0.2); font-style: italic; }
        .ln-input:focus {
          border-color: rgba(201,145,77,0.45);
          background: rgba(20,14,8,0.7);
          box-shadow: 0 0 0 3px rgba(201,145,77,0.08);
        }

        /* Buttons */
        .ln-actions { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem; }

        .ln-btn-submit {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 100px;
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1a0f05;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 6px 24px rgba(201,145,77,0.28);
        }
        .ln-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(201,145,77,0.42);
        }
        .ln-btn-submit:active:not(:disabled) { transform: translateY(0); }
        .ln-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .ln-btn-shine {
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        .ln-btn-submit:hover:not(:disabled) .ln-btn-shine { left: 150%; }

        .ln-forgot-password {
          text-align: right;
          margin-top: -0.5rem;
          margin-bottom: 0.5rem;
        }
        .ln-forgot-link {
          background: none; border: none;
          color: #c9914d; cursor: pointer;
          font-size: 0.85rem; font-style: italic;
          font-family: 'Crimson Pro', Georgia, serif;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
          padding: 0.25rem 0.5rem; border-radius: 4px;
        }
        .ln-forgot-link:hover {
          color: #f5e6c8;
          background: rgba(201,145,77,0.08);
          text-decoration: underline;
        }

        .ln-btn-back {
          width: 100%; padding: 0.85rem;
          border: 1px solid rgba(201,145,77,0.15);
          border-radius: 100px; background: transparent;
          font-family: 'Cinzel', serif; font-size: 0.7rem;
          font-weight: 600; letter-spacing: 0.15em;
          text-transform: uppercase; color: rgba(240,232,216,0.45);
          cursor: pointer; transition: all 0.3s ease;
          text-decoration: none; display: block; text-align: center;
        }
        .ln-btn-back:hover {
          border-color: rgba(201,145,77,0.3);
          color: rgba(240,232,216,0.75);
          background: rgba(201,145,77,0.05);
        }

        /* Footer */
        .ln-footer {
          text-align: center; margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid rgba(201,145,77,0.08);
          font-size: 0.88rem; font-style: italic;
          color: rgba(240,232,216,0.38);
        }
        .ln-footer a { color: #c9914d; text-decoration: none; font-weight: 600; font-style: normal; transition: color 0.2s; }
        .ln-footer a:hover { color: #f5e6c8; }

        /* Loading dots */
        .ln-dots { display: inline-flex; gap: 4px; vertical-align: middle; }
        .ln-dot { width: 4px; height: 4px; border-radius: 50%; background: #1a0f05; animation: dotPulse 1.2s ease-in-out infinite; }
        .ln-dot:nth-child(2) { animation-delay: 0.2s; }
        .ln-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Bootstrap simplifié pour le centrage responsive */}
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-sm-10 col-md-6 col-lg-4">
            <div className={`ln-card ${mounted ? 'visible' : ''}`}>
              
              {/* Header */}
              <div className="ln-header">
                <div className="ln-eyebrow">
                  <span className="ln-eyebrow-line" />
                  Authentification
                  <span className="ln-eyebrow-line r" />
                </div>
                <h1 className="ln-title">Connexion</h1>
                <div className="ln-ornament">
                  <div className="ln-orn-line" />
                  <div className="ln-orn-diamond" />
                  <div className="ln-orn-line r" />
                </div>
                <p className="ln-subtitle">Connectez-vous pour accéder à vos parties</p>
              </div>

              {/* Error */}
              {error && <div className="ln-error">{error}</div>}

              {/* Form */}
              <form className="ln-form" onSubmit={handleSubmit}>
                <div className="ln-field">
                  <label className="ln-label">Adresse e-mail</label>
                  <input
                    className="ln-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="ln-field">
                  <label className="ln-label">Mot de passe</label>
                  <input
                    className="ln-input"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="ln-forgot-password">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="ln-forgot-link"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <div className="ln-actions">
                  <button type="submit" className="ln-btn-submit" disabled={loading}>
                    <span className="ln-btn-shine" />
                    {loading
                      ? <><span>Connexion</span><span className="ln-dots"><span className="ln-dot"/><span className="ln-dot"/><span className="ln-dot"/></span></>
                      : 'Se Connecter'
                    }
                  </button>
                  <Link to="/" className="ln-btn-back">Retour à l'accueil</Link>
                </div>
              </form>

              {/* Footer */}
              <div className="ln-footer">
                Pas encore de compte ?{' '}
                <Link to="/register">Créer un compte</Link>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Login;
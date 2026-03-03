import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';


function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
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

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
const response = await axios.post(`${API_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/game-selection');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rg-root container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-sm-10 col-md-6 col-lg-4">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

            .rg-root {
              min-height: 100vh;
              background: #100d0a;
              background-image:
                radial-gradient(ellipse 70% 60% at 50% -5%, rgba(180,130,70,0.08) 0%, transparent 60%),
                radial-gradient(ellipse 40% 40% at 90% 90%, rgba(140,90,40,0.05) 0%, transparent 50%),
                repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px),
                repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.004) 60px, rgba(255,255,255,0.004) 61px);
              font-family: 'Crimson Pro', Georgia, serif;
              color: #f0e8d8;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2rem 1.5rem;
            }

            /* Card */
            .rg-card {
              width: 100%;
              max-width: 440px;
              background: rgba(20,14,8,0.7);
              border: 1px solid rgba(201,145,77,0.14);
              border-radius: 24px;
              padding: 3rem 2.5rem;
              box-shadow: 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
              opacity: 0;
              transform: translateY(24px);
              transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
            }
            .rg-card.visible { opacity: 1; transform: translateY(0); }

            /* Header */
            .rg-header { text-align: center; margin-bottom: 2.5rem; }

            .rg-eyebrow {
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
            .rg-eyebrow-line {
              width: 28px; height: 1px;
              background: linear-gradient(90deg, transparent, rgba(201,145,77,0.45));
            }
            .rg-eyebrow-line.r {
              background: linear-gradient(90deg, rgba(201,145,77,0.45), transparent);
            }

            .rg-title {
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

            .rg-ornament {
              display: flex; align-items: center; gap: 0.75rem;
              margin: 0.6rem 0 0.75rem;
              justify-content: center;
            }
            .rg-orn-line {
              width: 32px; height: 1px;
              background: linear-gradient(90deg, transparent, rgba(201,145,77,0.3));
            }
            .rg-orn-line.r { background: linear-gradient(90deg, rgba(201,145,77,0.3), transparent); }
            .rg-orn-diamond {
              width: 5px; height: 5px;
              background: #c9914d;
              transform: rotate(45deg);
              box-shadow: 0 0 8px rgba(201,145,77,0.5);
            }

            .rg-subtitle {
              font-style: italic;
              font-size: 0.9rem;
              color: rgba(240,232,216,0.4);
              letter-spacing: 0.02em;
            }

            /* Error */
            .rg-error {
              background: rgba(239,68,68,0.1) !important;
              border: 1px solid rgba(239,68,68,0.25) !important;
              border-radius: 10px !important;
              padding: 0.75rem 1rem !important;
              margin-bottom: 1.5rem !important;
              font-size: 0.88rem !important;
              color: #fca5a5 !important;
              font-style: italic;
              font-family: 'Crimson Pro', Georgia, serif;
            }

            /* Override Bootstrap form elements */
            .rg-root .form-label {
              font-family: 'Cinzel', serif;
              font-size: 0.6rem;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: rgba(201,145,77,0.65);
              margin-bottom: 0.45rem;
            }

            .rg-root .form-control {
              background: rgba(10,7,4,0.5) !important;
              border: 1px solid rgba(201,145,77,0.15) !important;
              border-radius: 10px !important;
              padding: 0.85rem 1.1rem !important;
              font-family: 'Crimson Pro', Georgia, serif !important;
              font-size: 1rem !important;
              color: #f0e8d8 !important;
              outline: none !important;
              transition: all 0.3s ease !important;
              box-shadow: none !important;
            }
            .rg-root .form-control::placeholder {
              color: rgba(240,232,216,0.2) !important;
              font-style: italic;
            }
            .rg-root .form-control:focus {
              border-color: rgba(201,145,77,0.45) !important;
              background: rgba(20,14,8,0.7) !important;
              box-shadow: 0 0 0 3px rgba(201,145,77,0.08) !important;
              color: #f0e8d8 !important;
            }

            /* Submit button */
            .rg-btn-submit {
              width: 100%;
              padding: 1rem !important;
              border: none !important;
              border-radius: 100px !important;
              background: linear-gradient(135deg, #c9914d 0%, #a06820 100%) !important;
              font-family: 'Cinzel', serif !important;
              font-size: 0.75rem !important;
              font-weight: 700 !important;
              letter-spacing: 0.18em !important;
              text-transform: uppercase !important;
              color: #1a0f05 !important;
              cursor: pointer;
              position: relative;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.16,1,0.3,1) !important;
              box-shadow: 0 6px 24px rgba(201,145,77,0.28) !important;
            }
            .rg-btn-submit:hover:not(:disabled) {
              transform: translateY(-2px) !important;
              box-shadow: 0 10px 36px rgba(201,145,77,0.42) !important;
            }
            .rg-btn-submit:active:not(:disabled) { transform: translateY(0) !important; }
            .rg-btn-submit:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }

            .rg-btn-shine {
              position: absolute;
              top: 0; left: -100%; width: 60%; height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.6s ease;
              pointer-events: none;
            }
            .rg-btn-submit:hover:not(:disabled) .rg-btn-shine { left: 150%; }

            .rg-btn-back {
              width: 100%;
              padding: 0.85rem !important;
              border: 1px solid rgba(201,145,77,0.15) !important;
              border-radius: 100px !important;
              background: transparent !important;
              font-family: 'Cinzel', serif !important;
              font-size: 0.7rem !important;
              font-weight: 600 !important;
              letter-spacing: 0.15em !important;
              text-transform: uppercase !important;
              color: rgba(240,232,216,0.45) !important;
              cursor: pointer;
              transition: all 0.3s ease !important;
              text-decoration: none !important;
              display: block;
              text-align: center;
              box-shadow: none !important;
            }
            .rg-btn-back:hover {
              border-color: rgba(201,145,77,0.3) !important;
              color: rgba(240,232,216,0.75) !important;
              background: rgba(201,145,77,0.05) !important;
            }

            /* Footer link */
            .rg-footer {
              text-align: center;
              margin-top: 2rem;
              padding-top: 1.5rem;
              border-top: 1px solid rgba(201,145,77,0.08);
              font-size: 0.88rem;
              font-style: italic;
              color: rgba(240,232,216,0.38);
            }
            .rg-footer a {
              color: #c9914d;
              text-decoration: none;
              font-weight: 600;
              font-style: normal;
              transition: color 0.2s;
            }
            .rg-footer a:hover { color: #f5e6c8; }

            /* Loading dots */
            .rg-dots { display: inline-flex; gap: 4px; vertical-align: middle; margin-left: 4px; }
            .rg-dot {
              width: 4px; height: 4px;
              border-radius: 50%;
              background: #1a0f05;
              animation: rgDotPulse 1.2s ease-in-out infinite;
            }
            .rg-dot:nth-child(2) { animation-delay: 0.2s; }
            .rg-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes rgDotPulse {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }

            .rg-root .mb-3, .rg-root .mb-4 { margin-bottom: 1.1rem !important; }
            .rg-root .d-grid { display: flex !important; flex-direction: column !important; gap: 0.6rem !important; }
          `}</style>

          <div className={`rg-card ${mounted ? 'visible' : ''}`}>
            {/* Header */}
            <div className="rg-header">
              <div className="rg-eyebrow">
                <span className="rg-eyebrow-line" />
                Créer un compte
                <span className="rg-eyebrow-line r" />
              </div>
              <h1 className="rg-title">Inscription</h1>
              <div className="rg-ornament">
                <div className="rg-orn-line" />
                <div className="rg-orn-diamond" />
                <div className="rg-orn-line r" />
              </div>
              <p className="rg-subtitle">Rejoignez la communauté et commencez à jouer</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rg-error">{error}</div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nom d'utilisateur</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Votre pseudo"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Adresse e-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="d-grid">
                <button
                  type="submit"
                  className="rg-btn-submit"
                  disabled={loading}
                >
                  <span className="rg-btn-shine" />
                  {loading
                    ? <><span>Inscription</span><span className="rg-dots"><span className="rg-dot"/><span className="rg-dot"/><span className="rg-dot"/></span></>
                    : "S'inscrire"
                  }
                </button>

                <Link to="/" className="rg-btn-back">
                  Retour à l'accueil
                </Link>
              </div>
            </form>

            {/* Footer */}
            <div className="rg-footer">
              Déjà un compte ?{' '}
              <Link to="/login">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
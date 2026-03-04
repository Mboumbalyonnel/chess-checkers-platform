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
    <div className="rg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 70% 60% at 50% -5%, rgba(180,130,70,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 90% 90%, rgba(140,90,40,0.05) 0%, transparent 50%);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .rg-card {
          width: 100%;
          max-width: 420px;
          background: rgba(20,14,8,0.85);
          border: 1px solid rgba(201,145,77,0.2);
          border-radius: 20px;
          padding: 2rem 1.5rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .rg-card.visible { opacity: 1; transform: translateY(0); }

        @media (min-width: 576px) {
          .rg-card { padding: 2.5rem 2rem; }
        }

        .rg-header { text-align: center; margin-bottom: 2rem; }

        .rg-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.7);
          margin-bottom: 1rem;
        }

        .rg-title {
          font-family: 'Cinzel', serif;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #f5e6c8 0%, #c9914d 50%, #f5e6c8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .rg-subtitle {
          font-style: italic;
          font-size: 0.9rem;
          color: rgba(240,232,216,0.5);
          margin-top: 0.5rem;
        }

        .rg-error {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          color: #fca5a5;
          text-align: center;
        }

        .rg-form { display: flex; flex-direction: column; gap: 1rem; }

        .rg-field { display: flex; flex-direction: column; }

        .rg-label {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(201,145,77,0.8);
          margin-bottom: 0.4rem;
        }

        .rg-input {
          width: 100%;
          background: rgba(10,7,4,0.6);
          border: 1px solid rgba(201,145,77,0.2);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1rem;
          color: #f0e8d8;
          outline: none;
          transition: all 0.3s ease;
        }
        .rg-input::placeholder { color: rgba(240,232,216,0.3); font-style: italic; }
        .rg-input:focus {
          border-color: rgba(201,145,77,0.5);
          background: rgba(20,14,8,0.8);
          box-shadow: 0 0 0 3px rgba(201,145,77,0.1);
        }

        .rg-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }

        .rg-btn-submit {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 50px;
          background: linear-gradient(135deg, #c9914d 0%, #a06820 100%);
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #1a0f05;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(201,145,77,0.3);
        }
        .rg-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(201,145,77,0.4);
        }
        .rg-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .rg-btn-back {
          width: 100%;
          padding: 0.85rem;
          border: 1px solid rgba(201,145,77,0.2);
          border-radius: 50px;
          background: transparent;
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.6);
          cursor: pointer;
          text-decoration: none;
          display: block;
          text-align: center;
          transition: all 0.3s ease;
        }
        .rg-btn-back:hover {
          border-color: rgba(201,145,77,0.4);
          color: rgba(240,232,216,0.9);
          background: rgba(201,145,77,0.05);
        }

        .rg-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(201,145,77,0.1);
          font-size: 0.85rem;
          font-style: italic;
          color: rgba(240,232,216,0.5);
        }
        .rg-footer a {
          color: #c9914d;
          text-decoration: none;
          font-weight: 600;
          font-style: normal;
        }
        .rg-footer a:hover { color: #f5e6c8; }

        .rg-dots { display: inline-flex; gap: 4px; margin-left: 6px; }
        .rg-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #1a0f05;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .rg-dot:nth-child(2) { animation-delay: 0.2s; }
        .rg-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>

      <div className={`rg-card ${mounted ? 'visible' : ''}`}>
        <div className="rg-header">
          <div className="rg-eyebrow">Créer un compte</div>
          <h1 className="rg-title">Inscription</h1>
          <p className="rg-subtitle">Rejoignez la communauté et commencez à jouer</p>
        </div>

        {error && <div className="rg-error">{error}</div>}

        <form className="rg-form" onSubmit={handleSubmit}>
          <div className="rg-field">
            <label className="rg-label">Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="rg-input"
              placeholder="Votre pseudo"
              required
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Adresse e-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="rg-input"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="rg-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Confirmer le mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="rg-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="rg-actions">
            <button type="submit" className="rg-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  Inscription
                  <span className="rg-dots">
                    <span className="rg-dot"></span>
                    <span className="rg-dot"></span>
                    <span className="rg-dot"></span>
                  </span>
                </>
              ) : "S'inscrire"}
            </button>

            <Link to="/" className="rg-btn-back">
              Retour à l'accueil
            </Link>
          </div>
        </form>

        <div className="rg-footer">
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
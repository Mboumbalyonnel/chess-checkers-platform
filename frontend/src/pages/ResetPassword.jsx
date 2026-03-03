import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './ResetPassword.css';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [verifying, setVerifying]   = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  // Vérifier le token dès le chargement
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }
    axios.get(`${API_URL}/api/password/verify-token?token=${token}`)
      .then(res => { setTokenValid(res.data.valid); })
      .catch(() => { setTokenValid(false); })
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/password/reset`, {
        token: token,
        newPassword: password
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-root container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-sm-10 col-md-6 col-lg-4">

          <div className="rp-card">
            <div className="rp-eyebrow">
              <div className="rp-eyebrow-line" />
              <span className="rp-eyebrow-text">Chess & Dames</span>
              <div className="rp-eyebrow-line" />
            </div>

            <h1 className="rp-title">Nouveau mot de passe</h1>
            <p className="rp-subtitle">Choisissez un nouveau mot de passe sécurisé.</p>

            {verifying ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="rp-spinner" />
                <p style={{ color: 'rgba(240,232,216,0.4)', fontStyle: 'italic' }}>
                  Vérification du lien...
                </p>
              </div>

            ) : !tokenValid ? (
              <>
                <div className="rp-state invalid">
                  <div className="rp-state-icon">✕</div>
                  <div className="rp-state-title">Lien invalide ou expiré</div>
                  <div className="rp-state-text">
                    Ce lien de réinitialisation n'est plus valide. Faites une nouvelle demande.
                  </div>
                </div>
                <button className="rp-btn" onClick={() => navigate('/forgot-password')}>
                  Nouvelle demande
                </button>
              </>

            ) : done ? (
              <>
                <div className="rp-state success">
                  <div className="rp-state-icon">✓</div>
                  <div className="rp-state-title">Mot de passe mis à jour !</div>
                  <div className="rp-state-text">
                    Votre mot de passe a été réinitialisé avec succès.
                  </div>
                </div>
                <p className="rp-redirect">Redirection vers la connexion...</p>
              </>

            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="rp-error">{error}</div>}

                <div className="rp-field">
                  <label className="rp-label">Nouveau mot de passe</label>
                  <input
                    className="rp-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="rp-field">
                  <label className="rp-label">Confirmer le mot de passe</label>
                  <input
                    className="rp-input"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>

                <button className="rp-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="rp-dots">
                      <span className="rp-dot" />
                      <span className="rp-dot" />
                      <span className="rp-dot" />
                    </span>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>

                <button
                  type="button"
                  className="rp-back"
                  onClick={() => navigate('/login')}
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
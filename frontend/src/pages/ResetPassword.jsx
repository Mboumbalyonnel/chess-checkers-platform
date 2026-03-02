import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [verifying, setVerifying]       = useState(true);
  const [tokenValid, setTokenValid]     = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState('');

  // Vérifier le token dès le chargement
  useEffect(() => {
    if (!token) { setVerifying(false); setTokenValid(false); return; }
    axios.get(`http://localhost:5000/api/password/verify-token?token=${token}`)
      .then(res => { setTokenValid(res.data.valid); })
      .catch(() => { setTokenValid(false); })
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6)  { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/password/reset', { token, password });
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
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            .rp-root {
              min-height: 100vh;
              background: #100d0a;
              background-image:
                radial-gradient(ellipse 60% 50% at 30% 30%, rgba(180,130,70,0.07) 0%, transparent 60%),
                radial-gradient(ellipse 50% 60% at 75% 75%, rgba(160,100,50,0.05) 0%, transparent 60%);
              display: flex; align-items: center; justify-content: center;
              font-family: 'Crimson Pro', Georgia, serif;
              color: #f0e8d8; padding: 2rem 1rem;
            }

            .rp-card {
              width: 100%; max-width: 420px;
              background: rgba(20,14,8,0.7);
              backdrop-filter: blur(30px);
              border-radius: 24px;
              border: 1px solid rgba(201,145,77,0.14);
              padding: 2.5rem 2rem;
              box-shadow: 0 24px 64px rgba(0,0,0,0.5);
              animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1);
            }
            @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

            .rp-eyebrow { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem; }
            .rp-eyebrow-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(201,145,77,0.35),transparent); }
            .rp-eyebrow-text { font-family:'Cinzel',serif; font-size:0.58rem; letter-spacing:0.25em; text-transform:uppercase; color:rgba(201,145,77,0.6); white-space:nowrap; }

            .rp-title { font-family:'Cinzel',serif; font-size:1.6rem; font-weight:900; letter-spacing:0.06em; text-align:center; margin-bottom:0.5rem; background:linear-gradient(135deg,#f5e6c8 0%,#c9914d 40%,#f5e6c8 70%,#a06820 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            .rp-subtitle { text-align:center; font-style:italic; font-size:0.95rem; color:rgba(240,232,216,0.45); margin-bottom:2rem; }

            /* États */
            .rp-state { text-align:center; padding:1.5rem; border-radius:14px; margin-bottom:1.5rem; }
            .rp-state.invalid { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); }
            .rp-state.success { background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.25); }
            .rp-state-icon  { font-size:2.5rem; margin-bottom:0.75rem; }
            .rp-state-title { font-family:'Cinzel',serif; font-size:1rem; margin-bottom:0.5rem; }
            .rp-state.invalid .rp-state-title { color:#fca5a5; }
            .rp-state.success .rp-state-title { color:#86efac; }
            .rp-state-text { font-size:0.9rem; color:rgba(240,232,216,0.5); line-height:1.5; }

            .rp-spinner { width:36px; height:36px; border:3px solid rgba(201,145,77,0.2); border-top-color:#c9914d; border-radius:50%; animation:spin 0.9s linear infinite; margin:0 auto 1rem; }
            @keyframes spin { to{transform:rotate(360deg)} }

            .rp-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.9rem; font-style:italic; color:#fca5a5; }

            .rp-field { margin-bottom:1.25rem; }
            .rp-label { display:block; font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(201,145,77,0.7); margin-bottom:0.5rem; }
            .rp-input { width:100%; padding:0.85rem 1rem; border-radius:12px; background:rgba(10,7,4,0.5); border:1px solid rgba(201,145,77,0.18); color:#f0e8d8; font-family:'Crimson Pro',Georgia,serif; font-size:1rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
            .rp-input:focus { border-color:rgba(201,145,77,0.5); box-shadow:0 0 0 3px rgba(201,145,77,0.1); }
            .rp-input::placeholder { color:rgba(240,232,216,0.25); }

            .rp-btn { width:100%; padding:0.9rem; border-radius:100px; border:none; cursor:pointer; background:linear-gradient(135deg,#c9914d 0%,#a06820 100%); color:#1a0f05; font-family:'Cinzel',serif; font-size:0.78rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; box-shadow:0 4px 16px rgba(201,145,77,0.3); transition:all 0.3s cubic-bezier(0.16,1,0.3,1); }
            .rp-btn:hover:not(:disabled) { box-shadow:0 8px 28px rgba(201,145,77,0.45); transform:translateY(-1px); }
            .rp-btn:disabled { opacity:0.6; cursor:not-allowed; }

            .rp-dots { display:inline-flex; gap:5px; }
            .rp-dot { width:6px; height:6px; border-radius:50%; background:#1a0f05; animation:dotBounce 1.2s ease-in-out infinite; }
            .rp-dot:nth-child(2) { animation-delay:0.2s; }
            .rp-dot:nth-child(3) { animation-delay:0.4s; }
            @keyframes dotBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

            .rp-back { display:block; text-align:center; margin-top:1.25rem; font-size:0.9rem; color:rgba(240,232,216,0.4); cursor:pointer; transition:color 0.2s; background:none; border:none; width:100%; }
            .rp-back:hover { color:#c9914d; }

            .rp-redirect { font-size:0.82rem; color:rgba(240,232,216,0.35); font-style:italic; margin-top:0.75rem; }
          `}</style>

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
                <p style={{ color: 'rgba(240,232,216,0.4)', fontStyle: 'italic' }}>Vérification du lien...</p>
              </div>
            ) : !tokenValid ? (
              <>
                <div className="rp-state invalid">
                  <div className="rp-state-icon">✕</div>
                  <div className="rp-state-title">Lien invalide ou expiré</div>
                  <div className="rp-state-text">Ce lien de réinitialisation n'est plus valide. Faites une nouvelle demande.</div>
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
                  <div className="rp-state-text">Votre mot de passe a été réinitialisé avec succès.</div>
                </div>
                <p className="rp-redirect" style={{ textAlign: 'center' }}>Redirection vers la connexion...</p>
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
                    required autoFocus
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
                      <span className="rp-dot" /><span className="rp-dot" /><span className="rp-dot" />
                    </span>
                  ) : 'Réinitialiser le mot de passe'}
                </button>

                <button type="button" className="rp-back" onClick={() => navigate('/login')}>
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
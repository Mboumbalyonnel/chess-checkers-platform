import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/password/forgot', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          min-height: 100vh;
          background: #100d0a;
          background-image:
            radial-gradient(ellipse 60% 50% at 30% 30%, rgba(180,130,70,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 75% 75%, rgba(160,100,50,0.05) 0%, transparent 60%);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #f0e8d8;
        }

        .fp-card {
          width: 100%;
          background: rgba(20,14,8,0.7);
          backdrop-filter: blur(30px);
          border-radius: 24px;
          border: 1px solid rgba(201,145,77,0.14);
          padding: 2.5rem 2rem;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .fp-eyebrow {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .fp-eyebrow-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(201,145,77,0.35),transparent); }
        .fp-eyebrow-text { font-family:'Cinzel',serif; font-size:0.58rem; letter-spacing:0.25em; text-transform:uppercase; color:rgba(201,145,77,0.6); white-space:nowrap; }

        .fp-title { font-family:'Cinzel',serif; font-size:1.6rem; font-weight:900; letter-spacing:0.06em; text-align:center; margin-bottom:0.5rem; background:linear-gradient(135deg,#f5e6c8 0%,#c9914d 40%,#f5e6c8 70%,#a06820 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .fp-subtitle { text-align:center; font-style:italic; font-size:0.95rem; color:rgba(240,232,216,0.45); margin-bottom:2rem; line-height:1.5; }

        .fp-success {
          text-align: center; padding: 1.5rem;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }
        .fp-success-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .fp-success-title { font-family:'Cinzel',serif; font-size:1rem; color:#86efac; margin-bottom:0.5rem; }
        .fp-success-text { font-size:0.9rem; color:rgba(240,232,216,0.55); line-height:1.5; }

        .fp-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.9rem; font-style:italic; color:#fca5a5; }

        .fp-field { margin-bottom: 1.25rem; }
        .fp-label { display:block; font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(201,145,77,0.7); margin-bottom:0.5rem; }
        .fp-input {
          width:100%; padding:0.85rem 1rem; border-radius:12px;
          background:rgba(10,7,4,0.5); border:1px solid rgba(201,145,77,0.18);
          color:#f0e8d8; font-family:'Crimson Pro',Georgia,serif; font-size:1rem;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .fp-input:focus { border-color:rgba(201,145,77,0.5); box-shadow:0 0 0 3px rgba(201,145,77,0.1); }
        .fp-input::placeholder { color:rgba(240,232,216,0.25); }

        .fp-btn {
          width:100%; padding:0.9rem; border-radius:100px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#c9914d 0%,#a06820 100%);
          color:#1a0f05; font-family:'Cinzel',serif; font-size:0.78rem;
          font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
          box-shadow:0 4px 16px rgba(201,145,77,0.3);
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
          position:relative; overflow:hidden;
        }
        .fp-btn:hover:not(:disabled) { box-shadow:0 8px 28px rgba(201,145,77,0.45); transform:translateY(-1px); }
        .fp-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .fp-dots { display:inline-flex; gap:5px; }
        .fp-dot { width:6px; height:6px; border-radius:50%; background:#1a0f05; animation:dotBounce 1.2s ease-in-out infinite; }
        .fp-dot:nth-child(2) { animation-delay:0.2s; }
        .fp-dot:nth-child(3) { animation-delay:0.4s; }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

        .fp-back { display:block; text-align:center; margin-top:1.25rem; font-size:0.9rem; color:rgba(240,232,216,0.4); cursor:pointer; transition:color 0.2s; background:none; border:none; width:100%; }
        .fp-back:hover { color:#c9914d; }
      `}</style>

      {/* Bootstrap grid pour le centrage responsive */}
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-sm-10 col-md-6 col-lg-4">
            <div className="fp-card">
              <div className="fp-eyebrow">
                <div className="fp-eyebrow-line" />
                <span className="fp-eyebrow-text">Chess & Dames</span>
                <div className="fp-eyebrow-line" />
              </div>

              <h1 className="fp-title">Mot de passe oublié</h1>
              <p className="fp-subtitle">
                Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
              </p>

              {sent ? (
                <>
                  <div className="fp-success">
                    <div className="fp-success-icon">✉</div>
                    <div className="fp-success-title">Email envoyé !</div>
                    <div className="fp-success-text">
                      Si cet email est associé à un compte, vous recevrez un lien dans quelques minutes. Vérifiez aussi vos spams.
                    </div>
                  </div>
                  <button className="fp-btn" onClick={() => navigate('/login')}>
                    Retour à la connexion
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="fp-error">{error}</div>}

                  <div className="fp-field">
                    <label className="fp-label">Adresse email</label>
                    <input
                      className="fp-input"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <button className="fp-btn" type="submit" disabled={loading}>
                    {loading ? (
                      <span className="fp-dots">
                        <span className="fp-dot" /><span className="fp-dot" /><span className="fp-dot" />
                      </span>
                    ) : 'Envoyer le lien'}
                  </button>

                  <button type="button" className="fp-back" onClick={() => navigate('/login')}>
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
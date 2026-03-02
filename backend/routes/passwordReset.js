const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ── Transporteur Gmail ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── POST /api/password/forgot ─────────────────────────────────────────────────
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });

  try {
    const user = await User.findOne({ email });

    // Toujours répondre OK même si email inconnu (sécurité anti-enumération)
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 heure
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Chess & Dames" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #100d0a; color: #f0e8d8; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #c9914d, #a06820); padding: 2rem; text-align: center;">
            <h1 style="margin: 0; font-size: 1.8rem; letter-spacing: 0.1em; color: #1a0f05;">♟ Chess & Dames</h1>
          </div>
          <div style="padding: 2rem;">
            <h2 style="color: #c9914d; margin-top: 0;">Réinitialisation du mot de passe</h2>
            <p>Bonjour <strong>${user.username}</strong>,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${resetUrl}"
                style="background: linear-gradient(135deg, #c9914d, #a06820); color: #1a0f05; padding: 0.9rem 2rem; border-radius: 100px; text-decoration: none; font-weight: 700; font-family: Georgia, serif; letter-spacing: 0.05em; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: rgba(240,232,216,0.5); font-size: 0.85rem;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/password/verify-token ───────────────────────────────────────────
// Vérifie si le token est valide avant d'afficher le formulaire
router.get('/verify-token', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false });

  try {
    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.json({ valid: false, message: 'Lien invalide ou expiré' });
    res.json({ valid: true });
  } catch {
    res.status(500).json({ valid: false });
  }
});

// ── POST /api/password/reset ──────────────────────────────────────────────────
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Données manquantes' });
  if (password.length < 6) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });

  try {
    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré' });

    // Mettre à jour le mot de passe (le pre-save hook bcrypt s'en charge)
    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  findAdminByEmail,
  getAllAdmins,
  createAdmin as createAdminDB,
  updatePassword,
  deleteAdmin as deleteAdminDB,
} from '../models/adminModel.js';
dotenv.config();

const SUPER_ADMIN_EMAIL = 'asma.garaja@isgb.ucar.tn';

// ─── In-memory OTP store ───────────────────────────────────────
const otpStore = new Map();

// ─── Nodemailer SMTP Gmail ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP Auth Error :', err.message);
  } else {
    console.log('✅ Connexion SMTP Gmail établie — Emails 2FA prêts.');
  }
});

// ─── Helpers ────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

// ─── Email: OTP de connexion / reset ──────────────────────────
async function sendOTPEmail(toEmail, otp, type = 'login') {
  const isReset = type === 'reset';
  const subject = isReset
    ? '🔑 YAZAKI TMS — Réinitialisation de votre mot de passe'
    : '🔐 YAZAKI TMS — Code de vérification (2FA)';

  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #e60012, #ff3344); padding: 32px; text-align: center;">
      <div style="color: white; font-size: 28px; font-weight: 900; letter-spacing: 2px;">YAZAKI TMS</div>
      <div style="color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px;">Transport Management System</div>
    </div>
    <div style="padding: 36px 32px; text-align: center;">
      <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px;">${isReset ? 'Réinitialisation de mot de passe' : 'Vérification de connexion'}</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 28px;">
        ${isReset ? 'Utilisez ce code pour créer un nouveau mot de passe :' : 'Votre code de vérification à usage unique :'}
      </p>
      <div style="background: #0f172a; border-radius: 12px; padding: 24px; margin: 0 auto 28px; max-width: 280px;">
        <div style="color: #e60012; font-size: 42px; font-weight: 900; letter-spacing: 12px; font-variant-numeric: tabular-nums;">${otp}</div>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">Ce code expire dans <strong>5 minutes</strong>. Ne le partagez avec personne.</p>
    </div>
    <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © 2026 Yazaki Morocco — Système de Gestion du Transport
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"YAZAKI TMS" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });
}

// ─── Email: Invitation nouveau admin ──────────────────────────
async function sendInvitationEmail(toEmail, adminName, tempPassword, invitedBy) {
  const appUrl = 'http://localhost:5173';
  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #e60012, #ff3344); padding: 32px; text-align: center;">
      <div style="color: white; font-size: 28px; font-weight: 900; letter-spacing: 2px;">YAZAKI TMS</div>
      <div style="color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px;">Transport Management System</div>
    </div>
    <div style="padding: 36px 32px;">
      <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">👋 Bienvenue, ${adminName} !</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Vous avez été invité(e) par <strong>${invitedBy}</strong> à rejoindre le système de gestion du transport Yazaki en tant qu'<strong>Administrateur</strong>.
      </p>
      
      <div style="background: #fff8f0; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="color: #9a3412; font-size: 13px; font-weight: 600; margin-bottom: 12px;">🔑 VOS INFORMATIONS DE CONNEXION</div>
        <table style="width: 100%; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px;">Email :</td>
            <td style="font-weight: 600;">${toEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Mot de passe :</td>
            <td>
              <span style="background: #0f172a; color: #e60012; font-family: monospace; font-size: 18px; font-weight: 700; padding: 6px 14px; border-radius: 8px; letter-spacing: 2px;">${tempPassword}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 14px; margin-bottom: 24px;">
        <div style="color: #dc2626; font-weight: 700; font-size: 13px; margin-bottom: 4px;">⚠️ IMPORTANT — Ce mot de passe est temporaire</div>
        <div style="color: #7f1d1d; font-size: 12px; line-height: 1.5;">
          Ce mot de passe expire dans <strong>72 heures</strong>. Après votre première connexion, rendez-vous dans 
          <strong>Mon Profil</strong> pour le modifier impérativement. Un mot de passe fort est requis (minimum 8 caractères, 
          majuscule, chiffre et caractère spécial).
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}" style="background: linear-gradient(135deg, #e60012, #ff3344); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block;">
          🚀 Accéder à YAZAKI TMS
        </a>
      </div>
    </div>
    <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © 2026 Yazaki Morocco — Système de Gestion du Transport<br>
      Si vous n'attendiez pas cet email, ignorez-le.
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"YAZAKI TMS" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: '🎉 YAZAKI TMS — Votre invitation administrateur',
    html,
  });
}

// ════════════════════════════════════════════════════════════════
// CONTROLLERS AUTH (Login / OTP / Reset)
// ════════════════════════════════════════════════════════════════

// ─── Login Step 1 : vérifier credentials + envoyer OTP ────────
export const loginStep1 = async (req, res) => {
  const { email, password, captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA manquant. Veuillez rafraîchir la page.' });
  }

  // Vérifier CAPTCHA
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    const captchaRes = await fetch(verifyUrl, { method: 'POST' });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return res.status(400).json({ error: 'Validation CAPTCHA échouée. Êtes-vous un robot ?' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification du CAPTCHA.' });
  }

  // Trouver l'admin en DB
  const admin = await findAdminByEmail(email);
  if (!admin || admin.password !== password) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  // Vérifier si le mot de passe temporaire est expiré
  if (admin.has_temp_password && admin.temp_expires_at) {
    if (new Date() > new Date(admin.temp_expires_at)) {
      return res.status(401).json({
        error: 'Votre mot de passe temporaire a expiré (72h). Contactez votre administrateur.',
      });
    }
  }

  const otp = generateOTP();
  otpStore.set(email, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    type: 'login',
  });

  try {
    await sendOTPEmail(email, otp, 'login');
    res.json({ message: `Code envoyé à ${email}` });
  } catch (err) {
    console.error('❌ Erreur envoi email login:', err.message);
    const detail = err.responseCode === 535 || err.message.includes('Invalid login')
      ? 'Authentification Gmail refusée. Vérifiez MAIL_PASS dans .env.'
      : "Erreur d'envoi de l'email. Vérifiez MAIL_USER et MAIL_PASS dans .env.";
    res.status(500).json({ error: detail });
  }
};

// ─── Resend OTP ────────────────────────────────────────────────
export const resendOtp = async (req, res) => {
  const { email, password } = req.body;
  const admin = await findAdminByEmail(email);
  if (!admin || admin.password !== password) {
    return res.status(401).json({ error: 'Non autorisé.' });
  }

  const otp = generateOTP();
  otpStore.set(email, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'login' });

  try {
    await sendOTPEmail(email, otp, 'login');
    res.json({ message: `Nouveau code envoyé à ${email}` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du renvoi du code.' });
  }
};

// ─── Login Step 2 : vérifier OTP ──────────────────────────────
export const loginStep2 = async (req, res) => {
  const { email, code } = req.body;
  const stored = otpStore.get(email);

  if (!stored) return res.status(400).json({ error: 'Aucun code en attente pour cet email.' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Code expiré. Veuillez recommencer.' });
  }
  if (stored.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Code incorrect. Vérifiez votre boîte mail.' });
  }

  otpStore.delete(email);

  // Retourner les infos du compte
  const admin = await findAdminByEmail(email);
  res.json({
    success: true,
    message: 'Authentification réussie.',
    user: {
      email: admin.email,
      name: admin.name,
      isSuperAdmin: admin.email === SUPER_ADMIN_EMAIL,
      hasTempPassword: admin.has_temp_password,
    },
  });
};

// ─── Forgot Password ───────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return res.json({ message: `Si cet email est enregistré, un code a été envoyé.` });
  }

  const otp = generateOTP();
  otpStore.set(`reset_${email}`, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'reset' });

  try {
    await sendOTPEmail(email, otp, 'reset');
    res.json({ message: `Code de réinitialisation envoyé à ${email}` });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'envoi de l'email. Vérifiez la configuration SMTP dans .env." });
  }
};

// ─── Reset Password ────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const stored = otpStore.get(`reset_${email}`);

  if (!stored) return res.status(400).json({ error: 'Aucun code de réinitialisation en attente.' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(`reset_${email}`);
    return res.status(400).json({ error: 'Code expiré. Veuillez recommencer.' });
  }
  if (stored.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Code incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
  }

  await updatePassword(email, newPassword);
  otpStore.delete(`reset_${email}`);
  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
};

// ════════════════════════════════════════════════════════════════
// CONTROLLERS ADMIN (Gestion des comptes)
// ════════════════════════════════════════════════════════════════

// ─── Lister tous les admins ────────────────────────────────────
export const listAdmins = async (req, res) => {
  const { requesterEmail } = req.query;
  if (requesterEmail !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accès réservé au super administrateur.' });
  }
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes.' });
  }
};

// ─── Créer un nouveau admin ────────────────────────────────────
export const createAdminAccount = async (req, res) => {
  const { email, name, requesterEmail } = req.body;

  if (requesterEmail !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accès réservé au super administrateur.' });
  }
  if (!email || !name) {
    return res.status(400).json({ error: 'Email et nom sont requis.' });
  }

  // Vérifier si le compte existe déjà
  const existing = await findAdminByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
  }

  const tempPassword = generateTempPassword();

  try {
    const newAdmin = await createAdminDB(email, name, tempPassword, requesterEmail);
    await sendInvitationEmail(email, name, tempPassword, requesterEmail);
    res.status(201).json({
      success: true,
      message: `Invitation envoyée à ${email}. Le compte a été créé.`,
      admin: newAdmin,
    });
  } catch (err) {
    console.error('❌ Erreur création admin:', err.message);
    res.status(500).json({ error: "Erreur lors de la création du compte ou de l'envoi de l'email." });
  }
};

// ─── Supprimer un admin ────────────────────────────────────────
export const deleteAdminAccount = async (req, res) => {
  const { email } = req.params;
  const { requesterEmail } = req.body;

  if (requesterEmail !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accès réservé au super administrateur.' });
  }
  if (email === SUPER_ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Impossible de supprimer le super administrateur.' });
  }

  try {
    const deleted = await deleteAdminDB(email);
    if (!deleted) return res.status(404).json({ error: 'Compte introuvable ou non supprimable.' });
    res.json({ success: true, message: `Compte ${email} supprimé.` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

// ─── Changer le mot de passe (depuis la page Profil) ──────────
export const changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  const admin = await findAdminByEmail(email);
  if (!admin) return res.status(404).json({ error: 'Compte introuvable.' });
  if (admin.password !== currentPassword) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
  }

  // Validation de force
  const strength = getPasswordStrength(newPassword);
  
  if (admin.has_temp_password) {
    if (strength === 'weak') {
      return res.status(400).json({
        error: 'Le mot de passe doit être au moins Moyen.',
      });
    }
  } else {
    if (strength !== 'strong') {
      return res.status(400).json({
        error: 'Le mot de passe doit être Fort.',
      });
    }
  }

  await updatePassword(email, newPassword);
  res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
};

// ─── Utilitaire : calculer la force du mot de passe ───────────
function getPasswordStrength(pwd) {
  if (!pwd || pwd.length < 8) return 'weak';
  const hasUpper   = /[A-Z]/.test(pwd);
  const hasLower   = /[a-z]/.test(pwd);
  const hasDigit   = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (pwd.length >= 10 && score === 4) return 'strong';
  if (pwd.length >= 8  && score >= 2)  return 'medium';
  return 'weak';
}

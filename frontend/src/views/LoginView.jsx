import React, { useState, useRef, useEffect } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Moon, Sun, ShieldCheck, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// Google reCAPTCHA v2 — Clés officielles Yazaki TMS
const RECAPTCHA_SITE_KEY = '6LdHpKItAAAAABop_TNjyWtddGJidKV3ux1NY-XU';

const API = 'http://localhost:5001/api/auth';

// ─── Étapes disponibles ────────────────────────────────────
// 'credentials' → 'otp' → 'success'
// 'forgot'      → 'reset-otp' → 'new-password' → 'success'

export default function LoginView({ onLogin, theme, toggleTheme }) {
  const [step, setStep] = useState('credentials'); // état courant
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const resetRefs = useRef([]);

  // ── Google reCAPTCHA ───────────────────────────────────
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState(false);
  const resetCaptcha = () => { recaptchaRef.current?.reset(); setCaptchaToken(null); setCaptchaError(false); };

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(60);

  // ── Helpers ──────────────────────────────────────────────
  const handleOtpInput = (digits, setDigits, refs, idx, val) => {
    const updated = [...digits];
    updated[idx] = val.replace(/\D/, '').slice(-1);
    setDigits(updated);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (refs, idx, e) => {
    if (e.key === 'Backspace' && !e.target.value && idx > 0)
      refs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (digits, setDigits, e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setDigits(paste.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const getOtpString = (digits) => digits.join('');

  // ── ÉTAPE 1 : Connexion (credentials) ────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Veuillez remplir tous les champs.');
    // Google reCAPTCHA validation
    if (!captchaToken) {
      setCaptchaError(true);
      return setError('Veuillez valider le CAPTCHA avant de continuer.');
    }
    setCaptchaError(false);
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo(`Un code à 6 chiffres a été envoyé à ${email}`);
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err.message || 'Erreur de connexion au serveur.');
      resetCaptcha();
    } finally { setIsLoading(false); }
  };

  // ── ÉTAPE 2 : Vérification OTP ────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const code = getOtpString(otpDigits);
    if (code.length < 6) return setError('Veuillez saisir les 6 chiffres du code.');
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user); // Passer les infos user à App.jsx
    } catch (err) {
      setError(err.message || 'Code incorrect ou expiré.');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setIsLoading(false); }
  };

  // ── Renvoi OTP ────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(''); setInfo('');
    try {
      const res = await fetch(`${API}/resend-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo('Un nouveau code a été envoyé !');
      startResendTimer();
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) { setError(err.message); }
  };

  // ── Mot de passe oublié : Étape 1 ────────────────────────
  const handleForgotSend = async (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail) return setError("Saisissez votre adresse email.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo(data.message);
      setStep('reset-otp');
      startResendTimer();
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // ── Mot de passe oublié : Étape 2 (OTP) ──────────────────
  const handleResetOtpVerify = (e) => {
    e.preventDefault();
    setError('');
    const code = getOtpString(resetCode);
    if (code.length < 6) return setError('Veuillez saisir les 6 chiffres du code.');
    setStep('new-password');
  };

  // ── Mot de passe oublié : Étape 3 (nouveau pass) ─────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    if (newPassword !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: getOtpString(resetCode), newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      setStep('credentials');
      setPassword('');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // ── Rendu ─────────────────────────────────────────────────
  const stepConfig = {
    'credentials':  { title: 'Connexion', subtitle: 'Accès sécurisé à la plateforme de transport' },
    'otp':          { title: 'Vérification 2FA', subtitle: 'Confirmez votre identité' },
    'forgot':       { title: 'Mot de passe oublié', subtitle: 'Récupération de compte' },
    'reset-otp':    { title: 'Code de réinitialisation', subtitle: 'Vérifiez votre boîte mail' },
    'new-password': { title: 'Nouveau mot de passe', subtitle: 'Choisissez un mot de passe sécurisé' },
  };
  const { title, subtitle } = stepConfig[step] || {};

  return (
    <div className="login-container">
      <button className="theme-toggle-btn absolute-top-right" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="login-card glass-card" style={{ animation: 'fadeSlideUp 0.4s ease-out' }}>
        {/* Header */}
        <div className="login-header">
          <div className="brand-logo-badge" style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '1.5rem' }}>YAZAKI</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* Step indicator */}
        {(step === 'otp' || step === 'reset-otp' || step === 'new-password') && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['credentials', 'otp'].map((s, i) => (
              <div key={s} style={{
                width: '32px', height: '4px', borderRadius: '2px',
                background: (step === 'otp' && i <= 1) ? 'var(--yazaki-red)' : 'var(--border-color)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="login-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {info && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', color: 'var(--accent-emerald)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <ShieldCheck size={18} /><span>{info}</span>
          </div>
        )}

        {/* ── STEP: CREDENTIALS ── */}
        {step === 'credentials' && (
          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="form-group">
              <label>Adresse Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-control" placeholder="admin@yazaki.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
              </div>
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className="form-control"
                  placeholder="••••••••" value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }} required
                  style={{ paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="login-actions">
              <label className="remember-me"><input type="checkbox" /> Se souvenir de moi</label>
              <button type="button" className="forgot-password" onClick={() => { setStep('forgot'); setError(''); setInfo(''); }}>
                Mot de passe oublié ?
              </button>
            </div>

            {/* ── Google reCAPTCHA v2 ── */}
            <div className="captcha-block">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => { setCaptchaToken(token); setCaptchaError(false); }}
                onExpired={() => { setCaptchaToken(null); setCaptchaError(true); }}
                theme={theme === 'dark' ? 'dark' : 'light'}
                hl="fr"
              />
              {captchaError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--yazaki-red)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  <AlertCircle size={14} /> Veuillez valider le CAPTCHA pour continuer.
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-100 login-submit-btn" disabled={isLoading}>
              {isLoading ? <><RefreshCw size={16} className="spin" /> Vérification...</> : <>Se Connecter <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="login-form" noValidate>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={40} color="var(--yazaki-red)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Code envoyé à <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {otpDigits.map((d, i) => (
                <input key={i} type="text" inputMode="numeric" maxLength={1}
                  ref={el => otpRefs.current[i] = el}
                  value={d}
                  onChange={e => handleOtpInput(otpDigits, setOtpDigits, otpRefs, i, e.target.value)}
                  onKeyDown={e => handleOtpKey(otpRefs, i, e)}
                  onPaste={e => handleOtpPaste(otpDigits, setOtpDigits, e)}
                  style={{
                    width: '48px', height: '56px', textAlign: 'center', fontSize: '1.5rem',
                    fontWeight: '800', borderRadius: '10px', border: `2px solid ${d ? 'var(--yazaki-red)' : 'var(--border-color)'}`,
                    background: 'var(--bg-input, rgba(255,255,255,0.05))',
                    color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s'
                  }} />
              ))}
            </div>
            <button type="submit" className="btn-primary w-100 login-submit-btn" disabled={isLoading}>
              {isLoading ? <><RefreshCw size={16} className="spin" /> Vérification...</> : <>Confirmer le Code <ShieldCheck size={18} /></>}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Code non reçu ?{' '}
              <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0}
                style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--yazaki-red)', fontWeight: '700', fontSize: '0.85rem' }}>
                {resendTimer > 0 ? `Renvoyer (${resendTimer}s)` : 'Renvoyer'}
              </button>
            </div>
            <button type="button" onClick={() => { setStep('credentials'); setError(''); setInfo(''); }}
              style={{ display: 'block', margin: '0.75rem auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* ── STEP: FORGOT PASSWORD — EMAIL ── */}
        {step === 'forgot' && (
          <form onSubmit={handleForgotSend} className="login-form" noValidate>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <KeyRound size={40} color="var(--yazaki-red)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Entrez votre email pour recevoir un code de réinitialisation.
              </p>
            </div>
            <div className="form-group">
              <label>Adresse Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-control" placeholder="admin@yazaki.com"
                  value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }} required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-100 login-submit-btn" disabled={isLoading}>
              {isLoading ? <><RefreshCw size={16} className="spin" /> Envoi...</> : <>Envoyer le Code <ArrowRight size={18} /></>}
            </button>
            <button type="button" onClick={() => { setStep('credentials'); setError(''); setInfo(''); }}
              style={{ display: 'block', margin: '0.75rem auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* ── STEP: FORGOT PASSWORD — OTP ── */}
        {step === 'reset-otp' && (
          <form onSubmit={handleResetOtpVerify} className="login-form" noValidate>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={40} color="var(--yazaki-red)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Code envoyé à <strong style={{ color: 'var(--text-main)' }}>{forgotEmail}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {resetCode.map((d, i) => (
                <input key={i} type="text" inputMode="numeric" maxLength={1}
                  ref={el => resetRefs.current[i] = el}
                  value={d}
                  onChange={e => handleOtpInput(resetCode, setResetCode, resetRefs, i, e.target.value)}
                  onKeyDown={e => handleOtpKey(resetRefs, i, e)}
                  onPaste={e => handleOtpPaste(resetCode, setResetCode, e)}
                  style={{
                    width: '48px', height: '56px', textAlign: 'center', fontSize: '1.5rem',
                    fontWeight: '800', borderRadius: '10px', border: `2px solid ${d ? 'var(--yazaki-red)' : 'var(--border-color)'}`,
                    background: 'var(--bg-input, rgba(255,255,255,0.05))',
                    color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s'
                  }} />
              ))}
            </div>
            <button type="submit" className="btn-primary w-100 login-submit-btn">
              Valider le Code <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* ── STEP: NEW PASSWORD ── */}
        {step === 'new-password' && (
          <form onSubmit={handleResetPassword} className="login-form" noValidate>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon" />
                <input type={showNewPass ? 'text' : 'password'} className="form-control"
                  placeholder="Min. 6 caractères" value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  style={{ paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowNewPass(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type="password" className="form-control" placeholder="Répétez le mot de passe"
                  value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} />
              </div>
            </div>
            {/* Password strength indicator */}
            {newPassword && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: newPassword.length >= level * 3
                        ? level <= 1 ? 'var(--yazaki-red)' : level === 2 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                        : 'var(--border-color)',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {newPassword.length < 6 ? 'Trop court' : newPassword.length < 9 ? 'Moyen' : newPassword.length < 12 ? 'Bon' : 'Excellent'}
                </span>
              </div>
            )}
            <button type="submit" className="btn-primary w-100 login-submit-btn" disabled={isLoading}>
              {isLoading ? <><RefreshCw size={16} className="spin" /> Mise à jour...</> : <>Enregistrer le nouveau mot de passe</>}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>© 2026 Yazaki Morocco — Transport Management System</p>
        </div>
      </div>
    </div>
  );
}

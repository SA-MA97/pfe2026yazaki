import React, { useState } from 'react';
import { Lock, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, ShieldCheck, UserCircle, UserCog } from 'lucide-react';

const API = 'http://localhost:5001/api/auth';

function getPasswordStrength(pwd) {
  if (!pwd) return null;
  if (pwd.length < 8) return 'weak';
  const hasUpper   = /[A-Z]/.test(pwd);
  const hasLower   = /[a-z]/.test(pwd);
  const hasDigit   = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (pwd.length >= 10 && score === 4) return 'strong';
  if (pwd.length >= 8  && score >= 2)  return 'medium';
  return 'weak';
}

const STRENGTH_CONFIG = {
  weak:   { label: '🔴 Faible',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  bars: 1 },
  medium: { label: '🟡 Moyen',   color: '#d97706', bg: 'rgba(217,119,6,0.12)',  bars: 2 },
  strong: { label: '🟢 Fort',    color: '#059669', bg: 'rgba(5,150,105,0.12)',  bars: 3 },
};

export default function ProfileView({ currentUser, onPasswordChanged }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const strength = getPasswordStrength(form.newPassword);
  const sConf    = strength ? STRENGTH_CONFIG[strength] : null;
  const confirmMatch = form.confirmPassword && form.newPassword === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return setError('Tous les champs sont obligatoires.');
    }
    if (form.newPassword !== form.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }
    
    if (currentUser?.hasTempPassword) {
      if (strength === 'weak') {
        return setError('Le mot de passe doit être au moins Moyen.');
      }
    } else {
      if (strength !== 'strong') {
        return setError('Le mot de passe doit être Fort.');
      }
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:           currentUser.email,
          currentPassword: form.currentPassword,
          newPassword:     form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Mot de passe modifié avec succès !');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (onPasswordChanged) {
        onPasswordChanged({ ...currentUser, hasTempPassword: false });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="operators-view" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="section-header">
        <div className="section-title-group">
          <h3>Mon Profil</h3>
          <p>Gérez vos informations de compte et sécurité.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(230,0,18,0.2), rgba(230,0,18,0.05))',
          border: '2px solid rgba(230,0,18,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserCircle size={40} style={{ color: 'var(--yazaki-red)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>{currentUser?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '2px' }}>{currentUser?.email}</div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentUser?.isSuperAdmin && (
              <span className="badge" style={{ background: 'rgba(230,0,18,0.12)', color: 'var(--yazaki-red)' }}>
                ⭐ Super Admin
              </span>
            )}
            {currentUser?.hasTempPassword ? (
              <span className="badge badge-warning">
                ⚠️ Mot de passe temporaire
              </span>
            ) : (
              <span className="badge badge-normal">
                ✅ Compte sécurisé
              </span>
            )}
          </div>
        </div>
      </div>

      {currentUser?.hasTempPassword && (
        <div className="login-error-box" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start' }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ marginLeft: '10px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Changement de mot de passe requis</strong>
            <span>Votre compte a été créé avec un mot de passe temporaire. Vous devez le modifier maintenant (niveau <strong>Moyen</strong> minimum).</span>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--yazaki-red)' }} />
          Changer le mot de passe
        </h3>

        {error && (
          <div className="login-error-box" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', color: '#059669', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
            <CheckCircle size={18} /><span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              Mot de passe actuel *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showCurrent ? 'text' : 'password'} className="form-control"
                placeholder="Votre mot de passe actuel"
                value={form.currentPassword}
                onChange={e => { setForm(f => ({ ...f, currentPassword: e.target.value })); setError(''); }}
                style={{ paddingLeft: '44px', paddingRight: '44px', height: '48px' }} required />
              <button type="button" onClick={() => setShowCurrent(p => !p)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              Nouveau mot de passe *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showNew ? 'text' : 'password'} className="form-control"
                placeholder={currentUser?.hasTempPassword ? "Niveau Moyen minimum" : "Niveau Fort obligatoire"}
                value={form.newPassword}
                onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError(''); setSuccess(''); }}
                style={{ paddingLeft: '44px', paddingRight: '44px', height: '48px' }} required />
              <button type="button" onClick={() => setShowNew(p => !p)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.newPassword && (
              <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {[1, 2, 3].map(lvl => (
                    <div key={lvl} style={{
                      flex: 1, height: '6px', borderRadius: '3px',
                      background: sConf && lvl <= sConf.bars ? sConf.color : 'var(--border-color)',
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: sConf?.color }}>{sConf?.label}</span>
                  {((currentUser?.hasTempPassword && strength === 'weak') || (!currentUser?.hasTempPassword && strength !== 'strong')) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {currentUser?.hasTempPassword ? 'Minimum requis : Moyen' : 'Minimum requis : Fort'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { rule: form.newPassword.length >= 8,           label: '8 caractères min.' },
                    { rule: /[A-Z]/.test(form.newPassword),          label: 'Une majuscule' },
                    { rule: /[0-9]/.test(form.newPassword),          label: 'Un chiffre' },
                    { rule: /[^A-Za-z0-9]/.test(form.newPassword),  label: 'Un car. spécial' },
                  ].map(({ rule, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: rule ? '#059669' : 'var(--text-muted)', fontWeight: rule ? '600' : '400' }}>
                      <span style={{ fontSize: '12px' }}>{rule ? '✅' : '○'}</span>{label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              Confirmer le nouveau mot de passe *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showConfirm ? 'text' : 'password'} className="form-control"
                placeholder="Répétez le nouveau mot de passe"
                value={form.confirmPassword}
                onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setError(''); }}
                style={{
                  paddingLeft: '44px', paddingRight: '44px', height: '48px',
                  borderColor: form.confirmPassword
                    ? confirmMatch ? 'rgba(5,150,105,0.6)' : 'rgba(220,38,38,0.6)'
                    : undefined,
                }} required />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirmPassword && (
              <div style={{ marginTop: '8px', fontSize: '0.82rem', fontWeight: '500', color: confirmMatch ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {confirmMatch ? <><CheckCircle size={14} /> Les mots de passe correspondent</> : <><AlertCircle size={14} /> Ne correspondent pas</>}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-100"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '52px', fontSize: '1rem' }}>
            {loading ? <><RefreshCw size={18} className="spin" /> Mise à jour en cours...</> : <><ShieldCheck size={18} /> Enregistrer le nouveau mot de passe</>}
          </button>
        </form>
      </div>
    </div>
  );
}

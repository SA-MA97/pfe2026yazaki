import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Moon, Sun } from 'lucide-react';

export default function LoginView({ onLogin, theme, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation d'un appel API (Mock)
    setTimeout(() => {
      if (email === 'admin@yazaki.com' && password === 'admin123') {
        onLogin();
      } else {
        setError('Identifiants incorrects. Essayez admin@yazaki.com / admin123');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="login-container">
      <button className="theme-toggle-btn absolute-top-right" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="login-card glass-card">
        <div className="login-header">
          <div className="brand-logo-badge" style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '1.5rem' }}>
            YAZAKI
          </div>
          <h2>Bienvenue sur le Portail</h2>
          <p>Connectez-vous pour accéder à la plateforme de Transport Management</p>
        </div>

        {error && (
          <div className="login-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Adresse Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="form-control" 
                placeholder="admin@yazaki.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="login-actions">
            <label className="remember-me">
              <input type="checkbox" /> Se souvenir de moi
            </label>
            <a href="#" className="forgot-password">Mot de passe oublié ?</a>
          </div>

          <button type="submit" className="btn-primary w-100 login-submit-btn" disabled={isLoading}>
            {isLoading ? 'Connexion en cours...' : (
              <>
                Se Connecter <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>© 2026 Yazaki Morocco - Transport Management System</p>
        </div>
      </div>
    </div>
  );
}

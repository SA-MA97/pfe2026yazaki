import React from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';

export default function Header({ activeTitle, isBackendOnline, onRefresh, theme, toggleTheme }) {
  return (
    <header className="top-header">
      <div className="header-title-section">
        <h2>{activeTitle}</h2>
      </div>

      <div className="header-right">
        <button 
          className="btn-secondary" 
          onClick={toggleTheme} 
          title={theme === 'light' ? 'Passer en Mode Sombre' : 'Passer en Mode Clair'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>
        </button>

        <button className="btn-secondary" onClick={onRefresh} title="Actualiser les données">
          <RefreshCw size={16} />
          <span>Actualiser</span>
        </button>

        <div className={`status-badge ${isBackendOnline ? '' : 'status-offline'}`}>
          <span className="status-dot"></span>
          <span>{isBackendOnline ? 'API Backend Connectée' : 'Mode Démo / Hors-Ligne'}</span>
        </div>

        <div className="user-profile-btn">
          <div className="user-avatar">YZ</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Superviseur Yazaki</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Responsable Logistique</div>
          </div>
        </div>
      </div>
    </header>
  );
}

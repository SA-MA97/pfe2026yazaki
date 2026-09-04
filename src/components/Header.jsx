import React from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import { useLang } from '../context/LangContext';

const LANG_META = {
  fr: { flag: '🇫🇷', label: 'FR' },
  en: { flag: '🇬🇧', label: 'EN' },
  ar: { flag: '🇹🇳', label: 'AR' },
};

export default function Header({ activeTitle, isBackendOnline, onRefresh, theme, toggleTheme }) {
  const { lang, cycleLang, t } = useLang();
  const meta = LANG_META[lang];

  return (
    <header className="top-header">
      <div className="header-title-section">
        <h2>{activeTitle}</h2>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
          {/* Language Switcher */}
          <button
            className="icon-action-btn lang-switcher-btn"
            onClick={cycleLang}
            title="Changer la langue / Change Language / تغيير اللغة"
            style={{ gap: '0.3rem', padding: '0 0.75rem', minWidth: '58px', fontSize: '0.78rem', fontWeight: '700' }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{meta.flag}</span>
            <span>{meta.label}</span>
          </button>

          {/* Theme toggle */}
          <button
            className="icon-action-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? t.toggleDark : t.toggleLight}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Refresh */}
          <button
            className="icon-action-btn"
            onClick={onRefresh}
            title={t.refresh}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className={`status-badge ${isBackendOnline ? '' : 'status-offline'}`}>
          <span className="status-dot"></span>
          <span>{isBackendOnline ? t.systemOnline : t.systemOffline}</span>
        </div>


      </div>
    </header>
  );
}

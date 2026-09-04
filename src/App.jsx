import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import DelaysView from './views/DelaysView';
import OperatorsView from './views/OperatorsView';
import BusesView from './views/BusesView';
import StationsView from './views/StationsView';
import ShiftsView from './views/ShiftsView';
import AffectationsView from './views/AffectationsView';
import LoginView from './views/LoginView';
import AdminsView from './views/AdminsView';
import ProfileView from './views/ProfileView';
import { useLang } from './context/LangContext';

// ─── Constantes de session ────────────────────────────────────
const SESSION_DURATION_MS   = 24 * 60 * 60 * 1000; // 24 heures
const WARNING_BEFORE_MS     =  5 * 60 * 1000;       // Avertissement 5 min avant
const SESSION_KEY           = 'yz_session_start';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { email, name, isSuperAdmin, hasTempPassword }
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [theme, setTheme]           = useState('light');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [stats, setStats] = useState({ operatorsCount: 0, busCount: 0, stationCount: 0, avgDelay: 0, punctuality: 100 });
  const [sessionToast, setSessionToast] = useState(null); // null | 'warning' | 'expired'
  const sessionTimerRef = useRef(null);
  const { t } = useLang();

  // ─── Déconnexion propre ──────────────────────────────────────
  const handleLogout = useCallback((reason = 'manual') => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('yz_user');
    clearTimeout(sessionTimerRef.current);
    setCurrentUser(null);
    if (reason === 'expired') {
      setSessionToast('expired');
      // Le toast "expiré" sera visible sur l'écran de login
      setTimeout(() => setSessionToast(null), 8000);
    }
    setIsAuthenticated(false);
  }, []);

  // ─── Planifier les timers de session ────────────────────────
  const scheduleSessionTimers = useCallback((loginTime) => {
    clearTimeout(sessionTimerRef.current);
    const now        = Date.now();
    const expiresAt  = loginTime + SESSION_DURATION_MS;
    const msLeft     = expiresAt - now;
    const msToWarn   = msLeft - WARNING_BEFORE_MS;

    if (msLeft <= 0) {
      // Session déjà expirée (ex: rechargement de page après 24h)
      handleLogout('expired');
      return;
    }

    if (msToWarn > 0) {
      // Timer 1 : avertissement à 5 min avant expiration
      sessionTimerRef.current = setTimeout(() => {
        setSessionToast('warning');
        // Timer 2 : déconnexion effective
        sessionTimerRef.current = setTimeout(() => {
          handleLogout('expired');
        }, WARNING_BEFORE_MS);
      }, msToWarn);
    } else {
      // On est dans la fenêtre des 5 dernières minutes
      setSessionToast('warning');
      sessionTimerRef.current = setTimeout(() => {
        handleLogout('expired');
      }, msLeft);
    }
  }, [handleLogout]);

  // ─── Connexion réussie ───────────────────────────────────────
  const handleLogin = useCallback((user) => {
    const now = Date.now();
    localStorage.setItem(SESSION_KEY, String(now));
    localStorage.setItem('yz_user', JSON.stringify(user));
    scheduleSessionTimers(now);
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, [scheduleSessionTimers]);

  // ─── Restaurer la session après rechargement de page ────────
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const loginTime = parseInt(stored, 10);
      const msLeft    = loginTime + SESSION_DURATION_MS - Date.now();
      if (msLeft > 0) {
        const savedUser = localStorage.getItem('yz_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        scheduleSessionTimers(loginTime);
      } else {
        // Session expirée pendant que l'onglet était fermé
        localStorage.removeItem(SESSION_KEY);
        setSessionToast('expired');
        setTimeout(() => setSessionToast(null), 8000);
      }
    }
    return () => clearTimeout(sessionTimerRef.current);
  }, [scheduleSessionTimers]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const checkBackend = () => {
    fetch('http://localhost:5001/api/transport/stats')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not ok');
      })
      .then((data) => {
        setIsBackendOnline(true);
        setStats(data);
      })
      .catch(() => {
        setIsBackendOnline(false);
      });
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') checkBackend(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') checkBackend();
  }, [activeTab]);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':    return t.titleDashboard;
      case 'delays':       return t.titleDelays;
      case 'operators':    return t.titleOperators;
      case 'buses':        return t.titleBuses;
      case 'stations':     return t.titleStations;
      case 'shifts':       return t.titleShifts;
      case 'affectations': return t.titleAffectations;
      case 'admins':       return 'Gestion des Comptes Admin';
      case 'profile':      return 'Mon Profil';
      default:             return 'YAZAKI TMS';
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardView stats={stats} onNavigate={setActiveTab} onDataChange={checkBackend} />;
      case 'delays':       return <DelaysView onDataChange={checkBackend} />;
      case 'operators':    return <OperatorsView onDataChange={checkBackend} />;
      case 'buses':        return <BusesView onDataChange={checkBackend} />;
      case 'stations':     return <StationsView onDataChange={checkBackend} />;
      case 'shifts':       return <ShiftsView onDataChange={checkBackend} />;
      case 'affectations': return <AffectationsView onDataChange={checkBackend} />;
      case 'admins':       return <AdminsView currentUser={currentUser} />;
      case 'profile':      return <ProfileView currentUser={currentUser} onPasswordChanged={(u) => { setCurrentUser(u); localStorage.setItem('yz_user', JSON.stringify(u)); }} />;
      default:             return <DashboardView stats={stats} onNavigate={setActiveTab} />;
    }
  };

  // ─── Toast de session ────────────────────────────────────────
  const SessionToast = () => {
    if (!sessionToast) return null;
    const isWarning = sessionToast === 'warning';
    return (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        background: isWarning ? '#f59e0b' : '#e60012',
        color: '#fff', borderRadius: '12px', padding: '16px 22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', gap: '12px',
        fontFamily: "'Inter', sans-serif", fontSize: '14px',
        animation: 'slideInToast 0.4s cubic-bezier(.22,.68,0,1.2)',
        maxWidth: '360px',
      }}>
        <span style={{ fontSize: '22px' }}>{isWarning ? '⚠️' : '🔒'}</span>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>
            {isWarning ? 'Session expire bientôt' : 'Session expirée'}
          </div>
          <div style={{ opacity: 0.9, fontSize: '12px' }}>
            {isWarning
              ? 'Votre session expire dans 5 minutes. Sauvegardez vos données.'
              : 'Vous avez été déconnecté après 24h pour des raisons de sécurité.'}
          </div>
        </div>
        <button onClick={() => setSessionToast(null)} style={{
          marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
          border: 'none', color: '#fff', borderRadius: '6px',
          padding: '4px 8px', cursor: 'pointer', fontSize: '16px',
        }}>✕</button>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div data-theme={theme} style={{ minHeight: '100vh' }}>
        <SessionToast />
        <LoginView onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
        <style>{`
          @keyframes slideInToast {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-layout" data-theme={theme}>
      <SessionToast />
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Bannière mot de passe temporaire */}
      {currentUser?.hasTempPassword && activeTab !== 'profile' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 8000,
          background: 'linear-gradient(90deg, #b45309, #d97706)',
          color: '#fff', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          fontSize: '13px', fontFamily: "'Inter', sans-serif",
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span><strong>Action requise :</strong> Vous utilisez un mot de passe temporaire. Veuillez le modifier dès maintenant pour sécuriser votre compte.</span>
          <button onClick={() => setActiveTab('profile')} style={{
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', padding: '5px 14px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '700', fontSize: '12px', marginLeft: '8px',
          }}>Modifier maintenant →</button>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => handleLogout('manual')} currentUser={currentUser} />
      
      <div className="main-wrapper">
        <Header 
          activeTitle={getTitle()} 
          isBackendOnline={isBackendOnline} 
          onRefresh={checkBackend} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        <main className="content-body">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;

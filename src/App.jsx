import { useState, useEffect } from 'react';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light'); // Default Light theme as requested
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [stats, setStats] = useState({ operatorsCount: 1420, busCount: 38 });

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
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord Exécutif';
      case 'delays': return 'Supervision & Analyse des Retards';
      case 'operators': return 'Gestion des Opérateurs Yazaki';
      case 'buses': return 'Flotte des Bus & Circuits';
      case 'stations': return 'Stations de Ramassage & Régions';
      case 'shifts': return 'Shifts & Planning Horaires';
      case 'affectations': return 'Journal des Affectations et Pointages';
      default: return 'YAZAKI Transport Management';
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} onNavigate={setActiveTab} />;
      case 'delays':
        return <DelaysView />;
      case 'operators':
        return <OperatorsView />;
      case 'buses':
        return <BusesView />;
      case 'stations':
        return <StationsView />;
      case 'shifts':
        return <ShiftsView />;
      case 'affectations':
        return <AffectationsView />;
      default:
        return <DashboardView stats={stats} onNavigate={setActiveTab} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-layout" data-theme={theme}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} />
      
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

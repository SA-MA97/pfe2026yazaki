import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Bus, 
  MapPin, 
  Clock, 
  CalendarCheck, 
  Settings, 
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'delays', label: 'Suivi des Retards', icon: AlertTriangle },
    { id: 'operators', label: 'Opérateurs (D_Opérateurs)', icon: Users },
    { id: 'buses', label: 'Flotte de Bus (D_Bus)', icon: Bus },
    { id: 'stations', label: 'Stations & Lignes (D_Stations)', icon: MapPin },
    { id: 'shifts', label: 'Shifts & Horaires (D_Shifts)', icon: Clock },
    { id: 'affectations', label: 'Affectations (F_Affectations)', icon: CalendarCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-badge">YAZAKI</div>
        <div className="brand-text-wrapper">
          <span className="brand-title">YAZAKI TMS</span>
          <span className="brand-subtitle">Transport PFE 2026</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu Principal</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="nav-icon" size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item">
          <ShieldCheck size={18} className="nav-icon" />
          <span>Accès Administrateur</span>
        </div>
        <button className="nav-item" onClick={onLogout} style={{ marginTop: '0.5rem', color: 'var(--yazaki-red)' }}>
          <LogOut size={18} className="nav-icon" style={{ color: 'var(--yazaki-red)' }} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Bus, 
  MapPin, 
  Clock, 
  CalendarCheck, 
  UserCog,
  UserCircle,
  ShieldCheck,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function Sidebar({ activeTab, setActiveTab, onLogout, currentUser }) {
  const { t } = useLang();
  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  const menuItems = [
    { id: 'dashboard',    label: t.dashboard,    icon: LayoutDashboard },
    { id: 'delays',       label: t.delays,       icon: AlertTriangle },
    { id: 'operators',    label: t.operators,    icon: Users },
    { id: 'buses',        label: t.buses,        icon: Bus },
    { id: 'stations',     label: t.stations,     icon: MapPin },
    { id: 'shifts',       label: t.shifts,       icon: Clock },
    { id: 'affectations', label: t.affectations, icon: CalendarCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-badge">YAZAKI</div>
        <div className="brand-text-wrapper">
          <span className="brand-title">YAZAKI TMS</span>
          <span className="brand-subtitle">{t.brandSubtitle}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">{t.mainMenu}</div>
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

        {/* Section Administration — super_admin uniquement */}
        {isSuperAdmin && (
          <>
            <div className="nav-section-title" style={{ marginTop: '1rem' }}>Administration</div>
            <button
              className={`nav-item ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveTab('admins')}
            >
              <UserPlus className="nav-icon" size={18} />
              <span>Gestion des Comptes</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {/* Infos utilisateur */}
        {currentUser && (
          <div style={{
            padding: '0.6rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <UserCircle size={16} style={{ color: 'var(--yazaki-red)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.email}
            </div>
            {isSuperAdmin && (
              <div style={{ paddingLeft: '24px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.62rem', background: 'rgba(230,0,18,0.15)', color: 'var(--yazaki-red)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  SUPER ADMIN
                </span>
              </div>
            )}
          </div>
        )}

        {/* Profil */}
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <UserCog size={18} className="nav-icon" />
          <span>Mon Profil</span>
          {currentUser?.hasTempPassword && (
            <span style={{
              marginLeft: 'auto', background: '#f59e0b', color: '#fff',
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 5px', borderRadius: '4px',
            }}>!</span>
          )}
        </button>

        {/* Déconnexion */}
        <button className="nav-item" onClick={onLogout} style={{ marginTop: '0.5rem', color: 'var(--yazaki-red)' }}>
          <LogOut size={18} className="nav-icon" style={{ color: 'var(--yazaki-red)' }} />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}

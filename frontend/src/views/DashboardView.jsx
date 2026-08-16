import React from 'react';
import { 
  Users, 
  Bus, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  MapPin,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardView({ stats, onNavigate }) {
  const mockDelayList = [
    { id: 1, bus: 'Bus B-12 (Tanger Direct)', shift: 'Shift 06:00 - 14:00', station: 'Station Bni Makada', delayMin: 22, severity: 'critical' },
    { id: 2, bus: 'Bus B-04 (Moghogha Line)', shift: 'Shift 06:00 - 14:00', station: 'Station Mesnana', delayMin: 12, severity: 'warning' },
    { id: 3, bus: 'Bus B-08 (Tetouan Express)', shift: 'Shift 14:00 - 22:00', station: 'Station Malabata', delayMin: 8, severity: 'normal' },
    { id: 4, bus: 'Bus B-19 (Gzennaya L2)', shift: 'Shift 22:00 - 06:00', station: 'Station Gzennaya Est', delayMin: 25, severity: 'critical' },
  ];

  return (
    <div className="dashboard-container">
      {/* Top Banner Alert */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--yazaki-red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--yazaki-red)', fontWeight: '700', fontSize: '0.9rem' }}>
            <AlertTriangle size={18} />
            <span>Alerte Supervision Retards Yazaki</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            2 bus ont enregistré un retard supérieur à 20 minutes aujourd'hui sur les trajets de l'équipe de 06:00.
          </p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('delays')}>
          Voir Détails
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-info">
            <h4>Total Opérateurs</h4>
            <div className="kpi-value">{stats.operatorsCount || 1420}</div>
            <span className="kpi-trend trend-up"><TrendingUp size={14} /> +4% ce mois</span>
          </div>
          <div className="kpi-icon-wrapper kpi-blue">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-info">
            <h4>Flotte de Bus</h4>
            <div className="kpi-value">{stats.busCount || 38}</div>
            <span className="kpi-trend trend-up"><CheckCircle2 size={14} /> 36 en service</span>
          </div>
          <div className="kpi-icon-wrapper kpi-red">
            <Bus size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-info">
            <h4>Taux de Ponctualité</h4>
            <div className="kpi-value">94.2%</div>
            <span className="kpi-trend trend-up"><TrendingUp size={14} /> +1.8% vs hier</span>
          </div>
          <div className="kpi-icon-wrapper kpi-emerald">
            <Clock size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-info">
            <h4>Retard Moyen</h4>
            <div className="kpi-value">6.4 <span style={{ fontSize: '1rem' }}>min</span></div>
            <span className="kpi-trend trend-down"><AlertTriangle size={14} /> -0.5 min</span>
          </div>
          <div className="kpi-icon-wrapper kpi-amber">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="two-column-grid">
        {/* Left Section: Live Delay Table */}
        <div className="glass-card">
          <div className="section-header">
            <div className="section-title-group">
              <h3>Derniers Retards Détectés</h3>
              <p>Suivi en temps réel des pointages aux stations d'arrivée Yazaki</p>
            </div>
            <button className="btn-secondary" onClick={() => onNavigate('delays')}>Voir Tous</button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ligne de Bus</th>
                  <th>Shift / Equipe</th>
                  <th>Station</th>
                  <th>Retard</th>
                  <th>Sévérité</th>
                </tr>
              </thead>
              <tbody>
                {mockDelayList.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: '700' }}>{row.bus}</td>
                    <td>{row.shift}</td>
                    <td>{row.station}</td>
                    <td style={{ fontWeight: '700', color: row.severity === 'critical' ? 'var(--yazaki-red)' : 'var(--text-main)' }}>
                      +{row.delayMin} min
                    </td>
                    <td>
                      <span className={`badge badge-${row.severity}`}>
                        {row.severity === 'critical' ? 'Critique' : row.severity === 'warning' ? 'Moyen' : 'Mineur'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Distribution Summary */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="section-title-group">
            <h3>Répartition des Retards par Shift</h3>
            <p>Impact des équipes sur la ponctualité global</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span>Equipe Matin (06:00 - 14:00)</span>
                <span style={{ fontWeight: '700' }}>48% des retards</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '48%', height: '100%', background: 'var(--yazaki-gradient)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span>Equipe Après-Midi (14:00 - 22:00)</span>
                <span style={{ fontWeight: '700' }}>32% des retards</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '32%', height: '100%', background: 'var(--accent-amber)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span>Equipe Nuit (22:00 - 06:00)</span>
                <span style={{ fontWeight: '700' }}>20% des retards</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '20%', height: '100%', background: 'var(--accent-emerald)' }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Station la plus affectée</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <MapPin size={16} color="var(--yazaki-red)" />
              Station Bni Makada (Bus B-12)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Bus, Clock, AlertTriangle, TrendingUp, CheckCircle2,
  MapPin, ArrowUpRight, Sun, Moon, Sunset, Activity, ShieldCheck, BarChart3, Navigation
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

// Hook to animate numbers from 0 to target value
function useAnimatedCount(target, duration = 1200, isFloat = false) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(isFloat ? current : Math.round(current));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, isFloat]);
  return isFloat ? count.toFixed(1) : count;
}

// Retourne l'icône et la couleur selon l'heure de départ
function getShiftStyle(heure) {
  if (!heure) return { icon: Sun, color: '#f59e0b', label: 'Matin' };
  const [h] = heure.substring(0, 5).split(':').map(Number);
  const totalMin = h * 60 + parseInt(heure.substring(3, 5));

  if (totalMin >= 180 && totalMin <= 719) return { icon: Sun, color: '#f59e0b', label: 'Matin' };
  if (totalMin >= 720 && totalMin <= 1139) return { icon: Sunset, color: '#f97316', label: 'Après-midi' };
  return { icon: Moon, color: '#6366f1', label: 'Nuit' };
}

export default function DashboardView({ stats, onNavigate, onDataChange }) {
  const [delayList, setDelayList] = useState([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [shiftData, setShiftData] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const animOps        = useAnimatedCount(stats.operatorsCount || 0);
  const animBuses      = useAnimatedCount(stats.busCount || 0);
  const animStations   = useAnimatedCount(stats.stationCount || 0);
  const animPunctuality = useAnimatedCount(stats.punctuality ?? 100, 1200, true);
  const animDelay      = useAnimatedCount(stats.avgDelay || 0, 1200, true);

  const fetchDashboardData = () => {
    // Utiliser /delays (endpoint dédié sans LIMIT 250) pour les vrais retards
    fetch('http://localhost:5001/api/transport/delays')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        const topDelays = data.slice(0, 5).map((a, i) => ({
          id: i,
          bus: a.bus || '—',
          shift: a.shift || '—',
          heure_prevue: a.heure_prevue,
          station: a.station || '—',
          delayMin: Math.round(a.retard_minutes),
          severity: a.retard_minutes > 20 ? 'critical' : (a.retard_minutes > 10 ? 'warning' : 'normal')
        }));
        setDelayList(topDelays);

        const shiftCounts = {};
        data.forEach(a => {
          const key = a.shift || 'Inconnu';
          shiftCounts[key] = (shiftCounts[key] || 0) + 1;
        });
        const colors = ['#e60012', '#f59e0b', '#f97316', '#6366f1', '#10b981'];
        setShiftData(Object.keys(shiftCounts).map((key, idx) => ({
          name: key,
          retards: shiftCounts[key],
          fill: colors[idx % colors.length]
        })));

        setCriticalCount(data.filter(a => a.retard_minutes > 20).length);
      })
      .catch(err => console.error(err));

    fetch('http://localhost:5001/api/transport/shifts')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setShifts(data); })
      .catch(() => {});
  };

  // Se déclenche à chaque changement de stats (toutes les 10s) OU quand un CRUD change les données
  useEffect(() => {
    fetchDashboardData();
  }, [stats]);

  // Auto-refresh interne toutes les 15 secondes pour les données du dashboard
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const shiftPeriodData = React.useMemo(() => {
    const counts = { Matin: 0, 'Après-midi': 0, Nuit: 0 };
    shifts.forEach(s => {
      const { label } = getShiftStyle(s.heure_depart_prevue);
      counts[label] = (counts[label] || 0) + 1;
    });
    const colorMap = { Matin: '#f59e0b', 'Après-midi': '#f97316', Nuit: '#6366f1' };
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, fill: colorMap[name] }));
  }, [shifts]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* --- HERO BANNER --- */}
      <div className="glass-card" style={{ 
        padding: '2rem', 
        background: 'linear-gradient(135deg, rgba(230,0,18,0.03) 0%, rgba(37,99,235,0.03) 100%)',
        borderTop: '4px solid var(--yazaki-red)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        animation: 'fadeSlideUp 0.4s ease-out forwards',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative element */}
        <div style={{ position: 'absolute', right: '-5%', top: '-20%', opacity: 0.03, pointerEvents: 'none' }}>
          <ShieldCheck size={280} />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Synthèse Exécutive
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--accent-emerald)" />
            Rapport de performance du réseau pour le <span style={{ textTransform: 'capitalize', fontWeight: '600', color: 'var(--text-main)' }}>{today}</span>
          </p>
        </div>

        {criticalCount > 0 ? (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(230,0,18,0.08)', 
            padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(230,0,18,0.2)',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--yazaki-red)' }}>
              <div style={{ animation: 'pulse 2s infinite' }}><AlertTriangle size={24} /></div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Alerte Réseau</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '500' }}>{criticalCount} retard(s) critique(s) en cours</div>
              </div>
            </div>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => onNavigate('delays')}>
              Inspecter <ArrowUpRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.08)', 
            padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.2)',
            color: 'var(--accent-emerald)', zIndex: 1
          }}>
            <ShieldCheck size={24} />
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>État du Réseau : Optimal</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '500' }}>Aucun retard critique détecté</div>
            </div>
          </div>
        )}
      </div>

      {/* --- EXECUTIVE KPI GRID --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '1.25rem',
      }}>
        {/* KPI 1 */}
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', cursor: 'pointer', animationDelay: '0.1s' }} onClick={() => onNavigate('operators')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <span className="badge" style={{ background: 'rgba(37,99,235,0.05)', color: 'var(--accent-blue)', fontSize: '0.7rem' }}>+2.4%</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Effectif Opérateurs</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{animOps}</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', cursor: 'pointer', animationDelay: '0.15s' }} onClick={() => onNavigate('buses')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(230,0,18,0.1)', color: 'var(--yazaki-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={20} />
            </div>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', fontSize: '0.7rem' }}>Actif</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Véhicules Engagés</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{animBuses}</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', cursor: 'pointer', animationDelay: '0.2s' }} onClick={() => onNavigate('stations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} />
            </div>
            <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Réseau</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Points d'Arrêt</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{animStations}</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <span className="badge" style={{ background: stats.punctuality >= 90 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: stats.punctuality >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontSize: '0.7rem' }}>
              Global
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Indice Ponctualité</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{animPunctuality}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '2px' }}>%</span></div>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Moyenne Retards</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{animDelay}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>min</span></div>
          </div>
        </div>
      </div>

      {/* --- SHIFTS OVERVIEW (sleek chips) --- */}
      {shifts.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', animationDelay: '0.35s', animationFillMode: 'both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Équipes Actives :
            </span>
            {shifts.map(s => {
              const { icon: Icon, color, label } = getShiftStyle(s.heure_depart_prevue);
              return (
                <div key={s.id_shift} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
                  borderRadius: '20px', padding: '0.35rem 0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                  onClick={() => onNavigate('shifts')}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Icon size={14} color={color} />
                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{s.nom_shift}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginLeft: '0.2rem' }}>{s.heure_depart_prevue?.substring(0, 5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MAIN SPLIT VIEW (Table & Charts) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '65% 1fr', gap: '1.5rem' }}>
        
        {/* LEFT: Incident Log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={18} color="var(--yazaki-red)" /> Journal des Anomalies
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Derniers retards significatifs enregistrés sur le réseau</p>
            </div>
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => onNavigate('delays')}>
              Ouvrir le rapport complet
            </button>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Véhicule</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Équipe</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Station</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Écart constaté</th>
                </tr>
              </thead>
              <tbody>
                {delayList.map((row) => {
                  const { icon: Icon, color } = getShiftStyle(row.heure_prevue);
                  return (
                    <tr key={row.id}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Bus size={14} color="var(--text-muted)" /> {row.bus}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-hover)', padding: '0.2rem 0.6rem', borderRadius: '4px', width: 'fit-content' }}>
                          <Icon size={12} color={color} />
                          {row.shift}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{row.station}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <span className={`badge badge-${row.severity}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          +{row.delayMin} min
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {delayList.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                      <div>Aucune anomalie d'horaire signalée.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Analytics Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Chart 1: Bar Chart */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', animationDelay: '0.45s', animationFillMode: 'both' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={16} color="var(--accent-blue)" /> Impact par Équipe
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Distribution des retards</p>
            </div>
            <div style={{ flex: 1, minHeight: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-hover)' }}
                    contentStyle={{ background: 'var(--bg-sidebar)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '0.5rem' }}
                    itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="retards" radius={[4, 4, 0, 0]} barSize={24}>
                    {shiftData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Pie Chart */}
          {shiftPeriodData.length > 0 && (
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', animationDelay: '0.5s', animationFillMode: 'both' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Couverture Horaire</h3>
              </div>
              <div style={{ flex: 1, minHeight: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={shiftPeriodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={35} paddingAngle={2}>
                      {shiftPeriodData.map((entry, index) => (
                        <Cell key={`pie-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-sidebar)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem', padding: '0.5rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {shiftPeriodData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.fill }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

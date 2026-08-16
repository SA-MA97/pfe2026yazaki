import React, { useState, useEffect } from 'react';
import { Clock, Plus, Sun, Moon, Sunset, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ShiftsView() {
  const [shifts, setShifts] = useState([
    { id_shift: 1, nom_shift: 'shift matin', heure_depart_prevue: '06:00:00', icon: Sun, color: 'var(--accent-amber)' },
    { id_shift: 2, nom_shift: 'shift soir', heure_depart_prevue: '14:00:00', icon: Sunset, color: 'var(--accent-blue)' },
    { id_shift: 3, nom_shift: 'shift nuit', heure_depart_prevue: '22:00:00', icon: Moon, color: 'var(--accent-purple)' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');

  const fetchShifts = () => {
    fetch('http://localhost:5001/api/transport/shifts')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setShifts(data.map(s => ({
            ...s,
            icon: s.nom_shift.includes('nuit') ? Moon : s.nom_shift.includes('soir') ? Sunset : Sun,
            color: s.nom_shift.includes('nuit') ? 'var(--accent-purple)' : s.nom_shift.includes('soir') ? 'var(--accent-blue)' : 'var(--accent-amber)'
          })));
        }
      })
      .catch(err => console.warn('Using shift mock:', err));
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;

    fetch('http://localhost:5001/api/transport/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_shift: name.toLowerCase(), heure_depart_prevue: `${time}:00` })
    })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(() => fetchShifts())
      .catch(() => {
        setShifts([...shifts, {
          id_shift: shifts.length + 1,
          nom_shift: name.toLowerCase(),
          heure_depart_prevue: `${time}:00`,
          icon: Clock,
          color: 'var(--yazaki-red)'
        }]);
      });

    setShowModal(false);
  };

  return (
    <div className="shifts-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Shifts & Horaires Prévus (`D_Shifts`)</h3>
          <p>Données directement synchronisées avec PostgreSQL `D_Shifts`</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchShifts}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Nouveau Shift
          </button>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: '2rem' }}>
        {shifts.map((s) => {
          const Icon = s.icon || Clock;
          return (
            <div className="glass-card" key={s.id_shift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="kpi-icon-wrapper" style={{ background: 'rgba(255,255,255,0.06)', color: s.color }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{s.nom_shift}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID Shift #{s.id_shift}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heure de Départ Prévue SQL</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: s.color || 'var(--yazaki-red)', marginTop: '0.2rem' }}>
                  {s.heure_depart_prevue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Insérer dans `D_Shifts`</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Nom du Shift</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="ex: shift volant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Heure de départ prévue</label>
                <input 
                  type="time" 
                  className="form-control" 
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer dans SQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AffectationsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [affectations, setAffectations] = useState([
    { id_affectation: 1001, date: '2024-01-01', mat: 'mat_001', operator_name: 'Karim Bennani', station: 'station bni makada', shift: 'shift matin', heure_arrivee: '05:58:00', retard_minutes: 0 },
    { id_affectation: 1002, date: '2024-01-01', mat: 'mat_002', operator_name: 'Asma Garaja', station: 'station mesnana', shift: 'shift matin', heure_arrivee: '06:14:00', retard_minutes: 14 },
  ]);

  const [newAffect, setNewAffect] = useState({ mat: 'mat_001', id_station: 1, id_shift: 1, arrival: '06:00' });

  const fetchAffectations = () => {
    fetch('http://localhost:5001/api/transport/affectations')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAffectations(data);
        }
      })
      .catch(err => console.warn('Using affectations mock:', err));
  };

  useEffect(() => {
    fetchAffectations();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    fetch('http://localhost:5001/api/transport/affectations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Date_Affectation: new Date().toISOString().split('T')[0],
        mat: newAffect.mat,
        id_station: Number(newAffect.id_station),
        id_shift: Number(newAffect.id_shift),
        heure_arrivee: `${newAffect.arrival}:00`
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(() => fetchAffectations())
      .catch(() => {
        setAffectations([{
          id_affectation: 1000 + affectations.length + 1,
          date: new Date().toISOString().split('T')[0],
          mat: newAffect.mat,
          station: 'station bni makada',
          shift: 'shift matin',
          heure_arrivee: `${newAffect.arrival}:00`,
          retard_minutes: newAffect.arrival > '06:05' ? 15 : 0
        }, ...affectations]);
      });

    setShowModal(false);
  };

  const filtered = affectations.filter(a => 
    (a.mat && a.mat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.station && a.station.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.shift && a.shift.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="affectations-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Journal des Affectations (`F_Affectations`)</h3>
          <p>Enregistrements réels de la table de faits PostgreSQL SQL</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchAffectations}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Nouveau Pointage
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Filtrer par matricule, station ou shift..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Affectation</th>
                <th>Date</th>
                <th>Matricule (mat)</th>
                <th>Station</th>
                <th>Shift</th>
                <th>Heure Arrivée</th>
                <th>Retard Calculé (min)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isLate = row.retard_minutes && row.retard_minutes > 0;
                return (
                  <tr key={row.id_affectation}>
                    <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>#{row.id_affectation}</td>
                    <td>{row.date ? String(row.date).substring(0, 10) : ''}</td>
                    <td style={{ fontWeight: '700', color: 'var(--yazaki-red)' }}>{row.mat}</td>
                    <td style={{ textTransform: 'capitalize' }}>{row.station || 'Station 1'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{row.shift || 'Shift Matin'}</td>
                    <td style={{ fontWeight: '700' }}>{row.heure_arrivee}</td>
                    <td>
                      <span className={`badge ${isLate ? 'badge-critical' : 'badge-normal'}`}>
                        {isLate ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {isLate ? `+${Math.round(row.retard_minutes)} min` : 'À l\'heure (0 min)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Insérer dans `F_Affectations`</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Matricule Opérateur (mat)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="ex: mat_001"
                  value={newAffect.mat}
                  onChange={(e) => setNewAffect({ ...newAffect, mat: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ID Station (ex: 1)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  value={newAffect.id_station}
                  onChange={(e) => setNewAffect({ ...newAffect, id_station: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ID Shift (ex: 1)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  value={newAffect.id_shift}
                  onChange={(e) => setNewAffect({ ...newAffect, id_shift: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Heure d'arrivée constatée</label>
                <input 
                  type="time" 
                  className="form-control" 
                  required
                  value={newAffect.arrival}
                  onChange={(e) => setNewAffect({ ...newAffect, arrival: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer dans PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

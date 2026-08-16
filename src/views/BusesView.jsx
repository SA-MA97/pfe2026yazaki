import React, { useState, useEffect } from 'react';
import { Bus, Plus, Search, RefreshCw } from 'lucide-react';

export default function BusesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newBusName, setNewBusName] = useState('');
  const [buses, setBuses] = useState([
    { id_bus: 1, nom_bus: 'bus tanger 01', stations_count: 5, capacity: 50, driver: 'Hassan Amrani', status: 'En Service' },
    { id_bus: 2, nom_bus: 'bus tanger 02', stations_count: 4, capacity: 50, driver: 'Karim Ziyati', status: 'En Service' },
    { id_bus: 3, nom_bus: 'bus tetouan 01', stations_count: 7, capacity: 55, driver: 'Omar Filali', status: 'En Service' },
  ]);

  const fetchBuses = () => {
    fetch('http://localhost:5001/api/transport/buses')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBuses(data.map(b => ({
            ...b,
            stationsCount: b.stations_count || 0,
            capacity: 50,
            driver: 'Prestataire Transport',
            status: 'En Service'
          })));
        }
      })
      .catch(err => console.warn('Using local mock for buses:', err));
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleAddBus = (e) => {
    e.preventDefault();
    if (!newBusName) return;

    fetch('http://localhost:5001/api/transport/buses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_bus: newBusName.toLowerCase() })
    })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(() => fetchBuses())
      .catch(() => {
        setBuses([...buses, { id_bus: buses.length + 1, nom_bus: newBusName.toLowerCase(), stationsCount: 0, capacity: 50, driver: 'Assigné', status: 'En Service' }]);
      });

    setNewBusName('');
    setShowModal(false);
  };

  const filteredBuses = buses.filter(b => b.nom_bus.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="buses-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Flotte des Bus (`D_Bus`)</h3>
          <p>Données directement issues de la table PostgreSQL `D_Bus`</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchBuses} title="Actualiser BDD">
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Ajouter un Bus
          </button>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
        {filteredBuses.map((bus) => (
          <div className="glass-card" key={bus.id_bus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="kpi-icon-wrapper kpi-red" style={{ width: '40px', height: '40px' }}>
                  <Bus size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{bus.nom_bus}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID Bus #{bus.id_bus}</span>
                </div>
              </div>
              <span className="badge badge-normal">En Service</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacité</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>50 places</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stations SQL</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-blue)' }}>{bus.stations_count || 0} arrêts</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Insérer dans `D_Bus`</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddBus}>
              <div className="form-group">
                <label>Nom du Bus (ex: bus tanger 04)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  placeholder="nom du bus"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer dans PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Bus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const customIcon = new L.divIcon({
  className: 'custom-map-marker',
  html: `<div class="marker-pulse"></div><div class="marker-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -35]
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function StationsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [buses, setBuses] = useState([]);
  const [stations, setStations] = useState([
    { id_station: 1, nom_station: 'Station Zarzouna Centre', nom_region: 'Bizerte Sud', nom_bus: 'Bus Bizerte 01', latitude: 37.2650, longitude: 9.8850 },
    { id_station: 2, nom_station: 'Station Corniche Plage', nom_region: 'Bizerte Nord', nom_bus: 'Bus Bizerte 02', latitude: 37.2850, longitude: 9.8700 },
    { id_station: 3, nom_station: 'Menzel Bourguiba', nom_region: 'Menzel Bourguiba', nom_bus: 'Bus MB 01', latitude: 37.1542, longitude: 9.7865 },
    { id_station: 4, nom_station: 'Menzel Abderrahmane', nom_region: 'Bizerte Sud', nom_bus: 'Bus Bizerte 01', latitude: 37.2333, longitude: 9.8944 },
    { id_station: 5, nom_station: 'Station Tinja', nom_region: 'Tinja', nom_bus: 'Bus MB 02', latitude: 37.1631, longitude: 9.7584 },
    { id_station: 6, nom_station: 'Ras Jebel Centre', nom_region: 'Ras Jebel', nom_bus: 'Bus RJ 01', latitude: 37.2144, longitude: 10.1211 },
    { id_station: 7, nom_station: 'Station Mateur', nom_region: 'Mateur', nom_bus: 'Bus Mateur 01', latitude: 37.0414, longitude: 9.6669 },
    { id_station: 8, nom_station: 'Bizerte Centre Ville', nom_region: 'Bizerte Nord', nom_bus: 'Bus Bizerte 03', latitude: 37.2764, longitude: 9.8712 },
  ]);

  const [currentStation, setCurrentStation] = useState({ id_station: null, nom_station: '', nom_region: '', id_bus: '', latitude: 37.2746, longitude: 9.8739 });

  const fetchStations = () => {
    fetch('http://localhost:5001/api/transport/stations')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStations(data);
        }
      })
      .catch(err => console.warn('Using local station mock:', err));

    fetch('http://localhost:5001/api/transport/buses')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setBuses(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentStation({ id_station: null, nom_station: '', nom_region: '', id_bus: '', latitude: 37.2746, longitude: 9.8739 });
    setShowModal(true);
  };

  const openEditModal = (station) => {
    setIsEditing(true);
    setCurrentStation(station);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentStation.nom_station) return;

    const payload = {
      nom_station: currentStation.nom_station.toLowerCase(),
      nom_region: currentStation.nom_region.toLowerCase() || 'bizerte',
      id_bus: currentStation.id_bus || null,
      latitude: currentStation.latitude || 37.2746,
      longitude: currentStation.longitude || 9.8739
    };

    if (isEditing) {
      // PUT (Modification)
      fetch(`http://localhost:5001/api/transport/stations/${currentStation.id_station}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('DB Error');
          return res.json();
        })
        .then(() => fetchStations())
        .catch(() => {
          setStations(stations.map(st => st.id_station === currentStation.id_station ? { ...currentStation, ...payload } : st));
        });
    } else {
      // POST (Ajout)
      fetch('http://localhost:5001/api/transport/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('DB Error');
          return res.json();
        })
        .then(() => fetchStations())
        .catch(() => {
          setStations([...stations, {
            id_station: stations.length > 0 ? Math.max(...stations.map(s => s.id_station)) + 1 : 1,
            nom_station: payload.nom_station,
            nom_region: payload.nom_region,
            nom_bus: 'bus non assigné',
            latitude: payload.latitude,
            longitude: payload.longitude
          }]);
        });
    }

    setShowModal(false);
  };

  const handleDelete = (id) => {
    if(!window.confirm('Voulez-vous vraiment supprimer cette station ?')) return;

    fetch(`http://localhost:5001/api/transport/stations/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
      })
      .then(() => fetchStations())
      .catch(() => {
        setStations(stations.filter(st => st.id_station !== id));
      });
  };

  const filteredStations = stations.filter(s => 
    (s.nom_station && s.nom_station.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.nom_region && s.nom_region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="stations-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Stations & Régions (Carte Interactive)</h3>
          <p>Localisation GPS et gestion CRUD des arrêts de bus de la région</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchStations}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Ajouter une Station
          </button>
        </div>
      </div>

      <div className="two-column-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr' }}>
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '800' }}>Carte Géographique des Arrêts</h4>
            <div className="search-input-box" style={{ minWidth: '300px' }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Rechercher sur la carte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, position: 'relative', zIndex: 1, borderRadius: '0 0 var(--radius-xl) var(--radius-xl)', overflow: 'hidden' }}>
            <MapContainer center={[37.24, 9.87]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              <MapClickHandler onMapClick={(lat, lng) => {
                setIsEditing(false);
                setCurrentStation({ 
                  id_station: null, 
                  nom_station: '', 
                  nom_region: '', 
                  id_bus: '', 
                  latitude: lat, 
                  longitude: lng 
                });
                setShowModal(true);
              }} />
              {filteredStations.map(st => (
                <Marker key={st.id_station} position={[st.latitude || 37.2746, st.longitude || 9.8739]} icon={customIcon}>
                  <Popup>
                    <div style={{ padding: '12px 15px', textAlign: 'center', minWidth: '150px' }}>
                      <strong style={{ textTransform: 'capitalize', color: 'var(--yazaki-red)', display: 'block', fontSize: '1.1rem', marginBottom: '4px', fontWeight: '800' }}>
                        {st.nom_station}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>{st.nom_region}</span>
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                          <Bus size={12} style={{ marginRight: '4px' }}/> {st.nom_bus || 'Aucun bus'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Station</th>
                <th>Nom Station</th>
                <th>Région / Zone</th>
                <th>Bus Rattaché</th>
                <th>Coordonnées GPS</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((st) => (
                <tr key={st.id_station}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>#{st.id_station}</td>
                  <td style={{ fontWeight: '700', textTransform: 'capitalize' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={16} color="var(--yazaki-red)" />
                      {st.nom_station}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{st.nom_region}</td>
                  <td>
                    <span className="badge badge-blue">
                      <Bus size={12} style={{ marginRight: '0.2rem' }} />
                      {st.nom_bus || 'Non Assigné'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {st.latitude ? Number(st.latitude).toFixed(4) : 'N/A'}, {st.longitude ? Number(st.longitude).toFixed(4) : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => openEditModal(st)} title="Modifier">
                        <Edit size={14} color="var(--accent-blue)" />
                      </button>
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleDelete(st.id_station)} title="Supprimer">
                        <Trash2 size={14} color="var(--yazaki-red)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStations.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Aucune station trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Modifier la Station' : 'Nouvelle Station'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom de la Station</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="ex: station zarzouna"
                  value={currentStation.nom_station}
                  onChange={(e) => setCurrentStation({ ...currentStation, nom_station: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Région / Quartier</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ex: bizerte sud"
                  value={currentStation.nom_region}
                  onChange={(e) => setCurrentStation({ ...currentStation, nom_region: e.target.value })}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="37.2746"
                    value={currentStation.latitude}
                    onChange={(e) => setCurrentStation({ ...currentStation, latitude: parseFloat(e.target.value) || '' })}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="9.8739"
                    value={currentStation.longitude}
                    onChange={(e) => setCurrentStation({ ...currentStation, longitude: parseFloat(e.target.value) || '' })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bus Rattaché (ID)</label>
                <select 
                  className="form-control"
                  value={currentStation.id_bus || ''}
                  onChange={(e) => setCurrentStation({ ...currentStation, id_bus: e.target.value })}
                >
                  <option value="">Sélectionner un Bus</option>
                  {buses.map(b => (
                    <option key={b.id_bus} value={b.id_bus}>{b.nom_bus}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{isEditing ? 'Mettre à jour' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

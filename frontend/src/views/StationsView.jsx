import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Bus, RefreshCw, Edit, Trash2, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import { validateForm, isFormValid, required, minLength, maxLength, validateLatitude, validateLongitude } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;

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

export default function StationsView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [buses, setBuses] = useState([]);
  const [stations, setStations] = useState([]);

  const [currentStation, setCurrentStation] = useState({ id_station: null, nom_station: '', nom_region: '', id_bus: '', latitude: 37.2746, longitude: 9.8739 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const addToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStations = () => {
    fetch('http://localhost:5001/api/transport/stations')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map(st => ({
            ...st,
            latitude: parseFloat(st.latitude),
            longitude: parseFloat(st.longitude)
          }));
          setStations(parsed);
        }
      })
      .catch(err => console.error('API Error', err));

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
    const errors = validateForm({
      nom_station: [
        required(currentStation.nom_station, 'Le nom de la station'),
        minLength(currentStation.nom_station, 3, 'Le nom de la station'),
        maxLength(currentStation.nom_station, 100, 'Le nom de la station'),
      ],
      latitude: [validateLatitude(currentStation.latitude)],
      longitude: [validateLongitude(currentStation.longitude)],
    });
    setFormErrors(errors);
    if (!isFormValid(errors)) return;

    const payload = {
      nom_station: currentStation.nom_station.trim().toLowerCase(),
      nom_region: currentStation.nom_region?.trim().toLowerCase() || 'bizerte',
      id_bus: currentStation.id_bus || null,
      latitude: parseFloat(currentStation.latitude),
      longitude: parseFloat(currentStation.longitude)
    };

    if (isEditing) {
      // PUT (Modification)
      fetch(`http://localhost:5001/api/transport/stations/${currentStation.id_station}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(() => { fetchStations(); if (onDataChange) onDataChange(); addToast('Station mise à jour !'); })
        .catch(() => addToast('Erreur lors de la modification', 'error'));
    } else {
      fetch('http://localhost:5001/api/transport/stations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(() => { fetchStations(); if (onDataChange) onDataChange(); addToast('Station ajoutée avec succès !'); })
        .catch(() => addToast('Erreur lors de l\'ajout', 'error'));
    }
    setShowModal(false);
    setFormErrors({});
  };

  const confirmDelete = () => {
    fetch(`http://localhost:5001/api/transport/stations/${deleteTarget.id_station}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error(); })
      .then(() => { fetchStations(); if (onDataChange) onDataChange(); addToast('Station supprimée.', 'error'); })
      .catch(() => addToast('Erreur lors de la suppression', 'error'))
      .finally(() => setDeleteTarget(null));
  };

  const filteredStations = stations.filter(s => 
    (s.nom_station && s.nom_station.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.nom_region && s.nom_region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { items: sortedStations, requestSort, sortConfig } = useSortableData(filteredStations);

  // --- Pagination ---
  const PER_PAGE = 50;
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig]);
  const totalItems = sortedStations.length;
  const pagedStations = sortedStations.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="stations-view">
      {/* Inline Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
          <div className="toast-item" style={{ '--toast-color': toastMsg.type === 'error' ? 'var(--yazaki-red)' : 'var(--accent-emerald)' }}>
            {toastMsg.msg}
          </div>
        </div>
      )}
      <div className="section-header">
        <div className="section-title-group">
          <h3>Stations & Régions (Carte Interactive)</h3>
          <p>Réseau de transport Yazaki — Région de Bizerte</p>
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
            <MapContainer center={[37.18, 9.90]} zoom={10} style={{ height: '100%', width: '100%' }}>
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
                <SortableHeader label="Nom Station" sortKey="nom_station" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Région / Zone" sortKey="nom_region" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Bus Rattaché" sortKey="nom_bus" sortConfig={sortConfig} requestSort={requestSort} />
                <th>Coordonnées GPS</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedStations.map((st) => (
                <tr key={st.id_station}>
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
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setDeleteTarget(st)} title="Supprimer">
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
        <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Modifier la Station' : 'Nouvelle Station'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Nom de la Station *</label>
                <input type="text"
                  className={`form-control ${formErrors.nom_station ? 'has-error' : ''}`}
                  placeholder="ex: station zarzouna"
                  value={currentStation.nom_station}
                  onChange={(e) => { setCurrentStation({ ...currentStation, nom_station: e.target.value }); setFormErrors(p => ({ ...p, nom_station: null })); }} />
                <FieldError error={formErrors.nom_station} />
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
                  <label>Latitude * <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(30–38)</span></label>
                  <input type="number" step="any"
                    className={`form-control ${formErrors.latitude ? 'has-error' : ''}`}
                    placeholder="37.2746"
                    value={currentStation.latitude}
                    onChange={(e) => { setCurrentStation({ ...currentStation, latitude: e.target.value }); setFormErrors(p => ({ ...p, latitude: null })); }} />
                  <FieldError error={formErrors.latitude} />
                </div>
                <div className="form-group">
                  <label>Longitude * <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(7–12)</span></label>
                  <input type="number" step="any"
                    className={`form-control ${formErrors.longitude ? 'has-error' : ''}`}
                    placeholder="9.8739"
                    value={currentStation.longitude}
                    onChange={(e) => { setCurrentStation({ ...currentStation, longitude: e.target.value }); setFormErrors(p => ({ ...p, longitude: null })); }} />
                  <FieldError error={formErrors.longitude} />
                </div>
              </div>

              <div className="form-group">
                <label>Bus Rattaché</label>
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

      {/* DELETE Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(230,0,18,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertCircle size={28} color="var(--yazaki-red)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Confirmer la suppression</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Supprimer la station <strong>{deleteTarget.nom_station}</strong> ? Cette action est <strong style={{ color: 'var(--yazaki-red)' }}>irréversible</strong>.
            </p>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button className="btn-primary" style={{ background: 'var(--yazaki-gradient)' }} onClick={confirmDelete}>Oui, Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

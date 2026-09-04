import React, { useState, useEffect } from 'react';
import { Bus, Plus, Search, RefreshCw, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import DeleteModal from '../components/DeleteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { validateForm, isFormValid, required, minLength, maxLength } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;

export default function BusesView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = ajout, objet = modification
  const [busName, setBusName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, addToast } = useToast();

  const fetchBuses = () => {
    setLoading(true);
    fetch('http://localhost:5001/api/transport/buses')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (Array.isArray(data)) setBuses(data.map(b => ({ ...b, stations_count: b.stations_count || 0 }))); })
      .catch(() => addToast('Erreur de connexion au serveur', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBuses(); }, []);

  const openAddModal = () => {
    setEditTarget(null);
    setBusName('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    setEditTarget(bus);
    setBusName(bus.nom_bus);
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm({
      nom_bus: [
        required(busName, 'Le nom du bus'),
        minLength(busName, 3, 'Le nom du bus'),
        maxLength(busName, 100, 'Le nom du bus'),
      ],
    });
    setFormErrors(errors);
    if (!isFormValid(errors)) return;

    const isEdit = !!editTarget;
    const url = isEdit
      ? `http://localhost:5001/api/transport/buses/${editTarget.id_bus}`
      : 'http://localhost:5001/api/transport/buses';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_bus: busName.trim().toLowerCase() })
    })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(() => {
        fetchBuses();
        if (onDataChange) onDataChange();
        addToast(isEdit ? `Bus "${busName}" modifié !` : `Bus "${busName}" ajouté !`, 'success');
        setShowModal(false);
        setBusName('');
        setEditTarget(null);
        setFormErrors({});
      })
      .catch(() => addToast(isEdit ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout', 'error'));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    fetch(`http://localhost:5001/api/transport/buses/${deleteTarget.id_bus}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error(); })
      .then(() => { 
        fetchBuses(); 
        if (onDataChange) onDataChange();
        addToast(`Bus "${deleteTarget.nom_bus}" supprimé.`, 'error'); 
      })
      .catch(() => addToast('Erreur lors de la suppression', 'error'))
      .finally(() => setDeleteTarget(null));
  };

  const filteredBuses = buses.filter(b => b.nom_bus?.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- Pagination ---
  const PER_PAGE = 24; // Multiples de 2, 3, 4 pour la grille
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const totalItems = filteredBuses.length;
  const pagedBuses = filteredBuses.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="buses-view">
      <ToastContainer toasts={toasts} />
      <div className="section-header">
        <div className="section-title-group">
          <h3>Flotte des Bus</h3>
          <p>Gestion de la flotte de transport du personnel</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchBuses}><RefreshCw size={16} className={loading ? 'spin' : ''} /></button>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Ajouter un Bus
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Rechercher par nom de bus..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="glass-card"><LoadingSpinner text="Chargement de la flotte..." /></div>
      ) : filteredBuses.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Bus} title="Aucun bus dans la flotte"
            description="Ajoutez un premier bus pour démarrer la gestion de votre flotte."
            action={{ label: '+ Ajouter un Bus', onClick: openAddModal }} />
        </div>
      ) : (
        <div className="cards-grid">
          {pagedBuses.map((bus) => (
            <div className="glass-card" key={bus.id_bus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="kpi-icon-wrapper kpi-red" style={{ width: '40px', height: '40px' }}><Bus size={20} /></div>
                  <div>
                    <h4 style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{bus.nom_bus}</h4>
                  </div>
                </div>
                <span className="badge badge-normal">En Service</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacité</span><div style={{ fontWeight: '700' }}>50 places</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stations</span><div style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>{bus.stations_count} arrêts</div></div>
              </div>
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  onClick={() => openEditModal(bus)}
                  title="Modifier"
                >
                  <Pencil size={13} /> Modifier
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--yazaki-red)', borderColor: 'rgba(230,0,18,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  onClick={() => setDeleteTarget(bus)}
                  title="Supprimer"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredBuses.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Modale Ajout / Modification */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editTarget ? 'Modifier le Bus' : 'Nouveau Bus'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Nom du Bus * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(min 3 caractères)</span></label>
                <input type="text" className={`form-control ${formErrors.nom_bus ? 'has-error' : ''}`}
                  placeholder="ex: Bus Bizerte 05" value={busName}
                  onChange={(e) => { setBusName(e.target.value); setFormErrors(p => ({ ...p, nom_bus: null })); }} />
                <FieldError error={formErrors.nom_bus} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editTarget ? 'Enregistrer les modifications' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal isOpen={!!deleteTarget} onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)} itemName={deleteTarget?.nom_bus} />
    </div>
  );
}

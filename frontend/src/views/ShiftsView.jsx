import React, { useState, useEffect } from 'react';
import { Clock, Plus, Sun, Moon, Sunset, RefreshCw, Edit, Trash2, AlertCircle, Search } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import DeleteModal from '../components/DeleteModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { validateForm, isFormValid, required, minLength, maxLength, validateTime } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;

// Retourne l'icône et la couleur selon l'heure de départ
function getShiftStyle(heure) {
  if (!heure) return { icon: Sun, color: 'var(--yazaki-red)', label: 'Matin' };
  const [h, m] = heure.substring(0, 5).split(':').map(Number);
  const totalMin = h * 60 + m;

  // Matin : 03:00 → 11:59  (180 min → 719 min)
  if (totalMin >= 180 && totalMin <= 719) {
    return { icon: Sun, color: '#f59e0b', label: 'Matin' };
  }
  // Après-midi : 12:00 → 18:59  (720 min → 1139 min)
  if (totalMin >= 720 && totalMin <= 1139) {
    return { icon: Sunset, color: '#f97316', label: 'Après-midi' };
  }
  // Nuit : 19:00 → 02:59  (1140 min → 1440+179 min, wrap-around)
  return { icon: Moon, color: '#6366f1', label: 'Nuit' };
}

const API = 'http://localhost:5001/api/transport';

export default function ShiftsView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ nom_shift: '', heure_depart_prevue: '08:00' });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const { toasts, addToast } = useToast();

  const fetchShifts = () => {
    setLoading(true);
    fetch(`${API}/shifts`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { if (Array.isArray(data)) setShifts(data); })
      .catch(() => addToast('Erreur de connexion', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchShifts(); }, []);

  const validateShiftForm = (nom, heure) => validateForm({
    nom_shift: [required(nom, 'Le nom du shift'), minLength(nom, 3, 'Le nom du shift'), maxLength(nom, 50, 'Le nom du shift')],
    heure: [required(heure, 'L\'heure de départ'), validateTime(heure, 'L\'heure de départ')],
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const errors = validateShiftForm(form.nom_shift, form.heure_depart_prevue);
    setAddErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/shifts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_shift: form.nom_shift.trim(), heure_depart_prevue: `${form.heure_depart_prevue}:00` })
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => { 
        fetchShifts(); 
        if (onDataChange) onDataChange();
        addToast(`Shift "${form.nom_shift}" créé !`, 'success'); 
        setShowAddModal(false); 
        setAddErrors({}); 
      })
      .catch(() => addToast('Erreur lors de la création', 'error'));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const errors = validateShiftForm(editTarget.nom_shift, editTarget.heure_edit);
    setEditErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/shifts/${editTarget.id_shift}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_shift: editTarget.nom_shift.trim(), heure_depart_prevue: `${editTarget.heure_edit}:00` })
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => { 
        fetchShifts(); 
        if (onDataChange) onDataChange();
        addToast('Shift mis à jour !', 'success'); 
        setEditTarget(null); 
        setEditErrors({}); 
      })
      .catch(() => addToast('Erreur lors de la mise à jour', 'error'));
  };

  const confirmDelete = () => {
    fetch(`${API}/shifts/${deleteTarget.id_shift}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error(); })
      .then(() => { 
        fetchShifts(); 
        if (onDataChange) onDataChange();
        addToast(`Shift supprimé.`, 'error'); 
        setDeleteTarget(null); 
      })
      .catch(() => addToast('Erreur lors de la suppression', 'error'));
  };

  const filteredShifts = shifts.filter(s => 
    s.nom_shift?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Pagination ---
  const PER_PAGE = 24; // Multiple de la grille
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const totalItems = filteredShifts.length;
  const pagedShifts = filteredShifts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="shifts-view">
      <ToastContainer toasts={toasts} />
      <div className="section-header">
        <div className="section-title-group">
          <h3>Shifts & Horaires</h3>
          <p>Planification des équipes et horaires de départ</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchShifts}><RefreshCw size={16} className={loading ? 'spin' : ''} /></button>
          <button className="btn-primary" onClick={() => { setForm({ nom_shift: '', heure_depart_prevue: '08:00' }); setAddErrors({}); setShowAddModal(true); }}>
            <Plus size={16} /> Nouveau Shift
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Rechercher par nom d'équipe..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="glass-card"><LoadingSpinner text="Chargement des shifts..." /></div>
      ) : filteredShifts.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Clock} title="Aucun shift trouvé"
            description="Créez des équipes pour organiser les pointages."
            action={{ label: '+ Nouveau Shift', onClick: () => setShowAddModal(true) }} />
        </div>
      ) : (
        <div className="cards-grid">
          {pagedShifts.map((s) => {
            const { icon: Icon, color, label } = getShiftStyle(s.heure_depart_prevue);
            return (
              <div className="glass-card" key={s.id_shift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="kpi-icon-wrapper" style={{ background: 'rgba(255,255,255,0.06)', color }}><Icon size={24} /></div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{s.nom_shift}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55`, fontSize: '0.7rem' }}>
                      <Icon size={11} /> {label}
                    </span>
                    <button className="btn-secondary" style={{ padding: '0.35rem 0.55rem' }}
                      onClick={() => { setEditTarget({ ...s, heure_edit: s.heure_depart_prevue?.substring(0, 5) }); setEditErrors({}); }}>
                      <Edit size={14} color="var(--accent-blue)" />
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.35rem 0.55rem' }} onClick={() => setDeleteTarget(s)}>
                      <Trash2 size={14} color="var(--yazaki-red)" />
                    </button>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heure de Départ Prévue</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color, marginTop: '0.2rem' }}>{s.heure_depart_prevue?.substring(0, 5)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredShifts.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* ADD Modal */}
      {showAddModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>Nouveau Shift</h3><button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button></div>
          <form onSubmit={handleCreate} noValidate>
            <div className="form-group">
              <label>Nom du Shift * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(ex: Matin A, Nuit B)</span></label>
              <input type="text" className={`form-control ${addErrors.nom_shift ? 'has-error' : ''}`}
                placeholder="ex: Matin A" value={form.nom_shift}
                onChange={e => { setForm({ ...form, nom_shift: e.target.value }); setAddErrors(p => ({ ...p, nom_shift: null })); }} />
              <FieldError error={addErrors.nom_shift} />
            </div>
            <div className="form-group">
              <label>Heure de départ prévue *</label>
              <input type="time" className={`form-control ${addErrors.heure ? 'has-error' : ''}`}
                value={form.heure_depart_prevue}
                onChange={e => { setForm({ ...form, heure_depart_prevue: e.target.value }); setAddErrors(p => ({ ...p, heure: null })); }} />
              <FieldError error={addErrors.heure} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Créer</button>
            </div>
          </form>
        </div></div>
      )}

      {/* EDIT Modal */}
      {editTarget && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>Modifier le Shift</h3><button className="close-btn" onClick={() => setEditTarget(null)}>✕</button></div>
          <form onSubmit={handleUpdate} noValidate>
            <div className="form-group">
              <label>Nom du Shift *</label>
              <input type="text" className={`form-control ${editErrors.nom_shift ? 'has-error' : ''}`}
                value={editTarget.nom_shift}
                onChange={e => { setEditTarget({ ...editTarget, nom_shift: e.target.value }); setEditErrors(p => ({ ...p, nom_shift: null })); }} />
              <FieldError error={editErrors.nom_shift} />
            </div>
            <div className="form-group">
              <label>Heure de départ prévue *</label>
              <input type="time" className={`form-control ${editErrors.heure ? 'has-error' : ''}`}
                value={editTarget.heure_edit}
                onChange={e => { setEditTarget({ ...editTarget, heure_edit: e.target.value }); setEditErrors(p => ({ ...p, heure: null })); }} />
              <FieldError error={editErrors.heure} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>Annuler</button>
              <button type="submit" className="btn-primary">Mettre à jour</button>
            </div>
          </form>
        </div></div>
      )}

      <DeleteModal isOpen={!!deleteTarget} onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)} itemName={`le shift "${deleteTarget?.nom_shift}"`} />
    </div>
  );
}

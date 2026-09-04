import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, AlertTriangle, RefreshCw, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import DeleteModal from '../components/DeleteModal';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/LoadingSpinner';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import { validateForm, isFormValid, required, validateTime, validateArrivalLogic, onlyNumbers } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;
const FieldWarning = ({ warn }) => warn
  ? <div className="field-warning"><AlertTriangle size={12} />{warn}</div> : null;

const API = 'http://localhost:5001/api/transport';

export default function AffectationsView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [affectations, setAffectations] = useState([]);
  const [stations, setStations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ mat: '', id_station: '', id_shift: '', arrival: '06:00' });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const { toasts, addToast } = useToast();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/affectations`).then(r => r.json()),
      fetch(`${API}/stations`).then(r => r.json()),
      fetch(`${API}/shifts`).then(r => r.json()),
    ])
      .then(([affData, stData, shData]) => {
        if (Array.isArray(affData)) setAffectations(affData);
        if (Array.isArray(stData)) {
          const sortedStations = [...stData].sort((a, b) => a.nom_station.localeCompare(b.nom_station));
          setStations(sortedStations);
        }
        if (Array.isArray(shData)) setShifts(shData);
      })
      .catch(() => addToast('Erreur de connexion', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // Get shift departure time for logical validation
  const getShiftDeparture = (id_shift) => {
    const sh = shifts.find(s => String(s.id_shift) === String(id_shift));
    return sh?.heure_depart_prevue?.substring(0, 5) || null;
  };

  const validateAffectForm = (mat, id_station, id_shift, arrival) => {
    const shiftTime = getShiftDeparture(id_shift);
    return validateForm({
      mat: [required(mat, 'Le matricule'), onlyNumbers(mat, 'Le matricule')],
      id_station: [required(id_station, 'La station')],
      id_shift: [required(id_shift, 'Le shift')],
      heure_arrivee: [required(arrival, 'L\'heure d\'arrivée'), validateTime(arrival, 'L\'heure d\'arrivée')],
      logique: [shiftTime ? validateArrivalLogic(shiftTime, arrival) : null],
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const errors = validateAffectForm(form.mat, form.id_station, form.id_shift, form.arrival);
    setAddErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/affectations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Date_Affectation: new Date().toISOString().split('T')[0],
        mat: form.mat.trim(), id_station: Number(form.id_station),
        id_shift: Number(form.id_shift), heure_arrivee: `${form.arrival}:00`
      })
    })
      .then(async r => { 
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.error || 'Erreur lors de l\'ajout');
        }
        return r.json(); 
      })
      .then(() => { 
        fetchAll(); 
        if (onDataChange) onDataChange();
        addToast('Pointage enregistré !', 'success'); 
        setShowAddModal(false); 
        setAddErrors({}); 
      })
      .catch((err) => addToast(err.message || 'Erreur lors de l\'ajout', 'error'));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const shiftTime = getShiftDeparture(editTarget.id_shift);
    const errors = validateForm({
      id_station: [required(editTarget.id_station, 'La station')],
      id_shift: [required(editTarget.id_shift, 'Le shift')],
      heure_arrivee: [required(editTarget.heure_edit, 'L\'heure d\'arrivée'), validateTime(editTarget.heure_edit, 'L\'heure d\'arrivée')],
      logique: [shiftTime ? validateArrivalLogic(shiftTime, editTarget.heure_edit) : null],
    });
    setEditErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/affectations/${editTarget.id_affectation}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heure_arrivee: `${editTarget.heure_edit}:00`, id_station: Number(editTarget.id_station), id_shift: Number(editTarget.id_shift) })
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => { 
        fetchAll(); 
        if (onDataChange) onDataChange();
        addToast('Pointage mis à jour !', 'success'); 
        setEditTarget(null); 
        setEditErrors({}); 
      })
      .catch(() => addToast('Erreur lors de la mise à jour', 'error'));
  };

  const confirmDelete = () => {
    fetch(`${API}/affectations/${deleteTarget.id_affectation}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error(); })
      .then(() => { 
        fetchAll(); 
        if (onDataChange) onDataChange();
        addToast('Pointage supprimé.', 'error'); 
        setDeleteTarget(null); 
      })
      .catch(() => addToast('Erreur lors de la suppression', 'error'));
  };

  const filtered = affectations.filter(a =>
    (a.mat && a.mat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.station && a.station.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.shift && a.shift.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.operator_name && a.operator_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { items: sortedAffectations, requestSort, sortConfig } = useSortableData(filtered);

  // --- Pagination ---
  const PER_PAGE = 50;
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig]);
  const totalItems = sortedAffectations.length;
  const pagedAffectations = sortedAffectations.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Arrival logic warning for add form
  const addLogicWarn = form.id_shift && form.arrival
    ? validateArrivalLogic(getShiftDeparture(form.id_shift), form.arrival)
    : null;

  return (
    <div className="affectations-view">
      <ToastContainer toasts={toasts} />
      <div className="section-header">
        <div className="section-title-group">
          <h3>Journal des Affectations</h3>
          <p>Suivi des pointages d'arrivée et calcul de ponctualité</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchAll}><RefreshCw size={16} className={loading ? 'spin' : ''} /></button>
          <button className="btn-primary" onClick={() => { setForm({ mat: '', id_station: '', id_shift: '', arrival: '06:00' }); setAddErrors({}); setShowAddModal(true); }}>
            <Plus size={16} /> Nouveau Pointage
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Filtrer par matricule, station ou shift..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <table className="custom-table"><tbody><SkeletonRows cols={8} rows={4} /></tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Aucune affectation trouvée"
            description="Enregistrez les pointages d'arrivée des opérateurs."
            action={{ label: '+ Nouveau Pointage', onClick: () => setShowAddModal(true) }} />
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
              <tr>
                  <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Matricule" sortKey="mat" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Opérateur" sortKey="operator_name" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Station" sortKey="station" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Shift" sortKey="shift" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Arrivée" sortKey="heure_arrivee" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Retard" sortKey="retard_minutes" sortConfig={sortConfig} requestSort={requestSort} />
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedAffectations.map((row) => {
                  const isLate = row.retard_minutes && row.retard_minutes > 0;
                  return (
                    <tr key={row.id_affectation}>
                      <td>{row.date ? String(row.date).substring(0, 10) : ''}</td>
                      <td style={{ fontWeight: '700', color: 'var(--yazaki-red)' }}>{row.mat}</td>
                      <td style={{ fontWeight: '600' }}>{row.operator_name || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{row.station || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{row.shift || '—'}</td>
                      <td style={{ fontWeight: '700' }}>{row.heure_arrivee?.substring(0, 5)}</td>
                      <td>
                        <span className={`badge ${isLate ? 'badge-critical' : 'badge-normal'}`}>
                          {isLate ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          {isLate ? ` +${Math.round(row.retard_minutes)} min` : " À l'heure"}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => { setEditTarget({ ...row, heure_edit: row.heure_arrivee?.substring(0, 5) || '06:00' }); setEditErrors({}); }}>
                            <Edit size={14} color="var(--accent-blue)" />
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setDeleteTarget(row)}>
                            <Trash2 size={14} color="var(--yazaki-red)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {/* ADD Modal */}
      {showAddModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>Nouveau Pointage</h3><button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button></div>
          <form onSubmit={handleCreate} noValidate>
            <div className="form-group">
              <label>Matricule Opérateur *</label>
              <input type="text" className={`form-control ${addErrors.mat ? 'has-error' : ''}`}
                placeholder="ex: M001" value={form.mat}
                onChange={e => { setForm({ ...form, mat: e.target.value }); setAddErrors(p => ({ ...p, mat: null })); }} />
              <FieldError error={addErrors.mat} />
            </div>
            <div className="form-group">
              <label>Station *</label>
              <select className={`form-control ${addErrors.id_station ? 'has-error' : ''}`}
                value={form.id_station}
                onChange={e => { setForm({ ...form, id_station: e.target.value }); setAddErrors(p => ({ ...p, id_station: null })); }}>
                <option value="">— Sélectionner une station —</option>
                {stations.map(s => <option key={s.id_station} value={s.id_station}>{s.nom_station}</option>)}
              </select>
              <FieldError error={addErrors.id_station} />
            </div>
            <div className="form-group">
              <label>Shift *</label>
              <select className={`form-control ${addErrors.id_shift ? 'has-error' : ''}`}
                value={form.id_shift}
                onChange={e => { setForm({ ...form, id_shift: e.target.value }); setAddErrors(p => ({ ...p, id_shift: null })); }}>
                <option value="">— Sélectionner un shift —</option>
                {shifts.map(s => <option key={s.id_shift} value={s.id_shift}>{s.nom_shift} ({s.heure_depart_prevue?.substring(0, 5)})</option>)}
              </select>
              <FieldError error={addErrors.id_shift} />
            </div>
            <div className="form-group">
              <label>Heure d'arrivée constatée *</label>
              <input type="time" className={`form-control ${addErrors.heure_arrivee ? 'has-error' : ''}`}
                value={form.arrival}
                onChange={e => { setForm({ ...form, arrival: e.target.value }); setAddErrors(p => ({ ...p, heure_arrivee: null, logique: null })); }} />
              <FieldError error={addErrors.heure_arrivee} />
              <FieldWarning warn={addLogicWarn} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </div></div>
      )}

      {/* EDIT Modal */}
      {editTarget && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>Modifier le Pointage</h3><button className="close-btn" onClick={() => setEditTarget(null)}>✕</button></div>
          <form onSubmit={handleUpdate} noValidate>
            <div className="form-group">
              <label>Station *</label>
              <select className={`form-control ${editErrors.id_station ? 'has-error' : ''}`}
                value={editTarget.id_station}
                onChange={e => { setEditTarget({ ...editTarget, id_station: e.target.value }); setEditErrors(p => ({ ...p, id_station: null })); }}>
                {stations.map(s => <option key={s.id_station} value={s.id_station}>{s.nom_station}</option>)}
              </select>
              <FieldError error={editErrors.id_station} />
            </div>
            <div className="form-group">
              <label>Shift *</label>
              <select className={`form-control ${editErrors.id_shift ? 'has-error' : ''}`}
                value={editTarget.id_shift}
                onChange={e => { setEditTarget({ ...editTarget, id_shift: e.target.value }); setEditErrors(p => ({ ...p, id_shift: null })); }}>
                {shifts.map(s => <option key={s.id_shift} value={s.id_shift}>{s.nom_shift} ({s.heure_depart_prevue?.substring(0, 5)})</option>)}
              </select>
              <FieldError error={editErrors.id_shift} />
            </div>
            <div className="form-group">
              <label>Heure d'arrivée corrigée *</label>
              <input type="time" className={`form-control ${editErrors.heure_arrivee ? 'has-error' : ''}`}
                value={editTarget.heure_edit}
                onChange={e => { setEditTarget({ ...editTarget, heure_edit: e.target.value }); setEditErrors(p => ({ ...p, heure_arrivee: null })); }} />
              <FieldError error={editErrors.heure_arrivee} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>Annuler</button>
              <button type="submit" className="btn-primary">Mettre à jour</button>
            </div>
          </form>
        </div></div>
      )}

      <DeleteModal isOpen={!!deleteTarget} onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)} itemName={`le pointage de ${deleteTarget?.operator_name || deleteTarget?.mat}`} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Download, Plus, Edit, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast, ToastContainer } from '../components/Toast';
import DeleteModal from '../components/DeleteModal';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/LoadingSpinner';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import { validateForm, isFormValid, required, validateTime, validateArrivalLogic } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;
const FieldWarning = ({ warn }) => warn
  ? <div className="field-warning"><AlertTriangle size={12} />{warn}</div> : null;

const API = 'http://localhost:5001/api/transport';

export default function DelaysView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [delaysData, setDelaysData] = useState([]);
  const [allAffectations, setAllAffectations] = useState([]); // All records for CREATE form
  const [stations, setStations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ mat: '', id_station: '', id_shift: '', heure_arrivee: '06:00' });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const { toasts, addToast } = useToast();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/delays`).then(r => r.json()),      // Retards directs depuis BDD (SQL filtré)
      fetch(`${API}/stations`).then(r => r.json()),
      fetch(`${API}/shifts`).then(r => r.json()),
    ])
      .then(([delayRows, stData, shData]) => {
        if (Array.isArray(delayRows)) {
          setAllAffectations(delayRows);
          const lates = delayRows.map(a => ({
            id: a.id_affectation,
            date: a.date ? String(a.date).substring(0, 10) : '',
            operator: a.operator_name || 'Opérateur',
            mat: a.mat || '',
            bus: a.bus || '-',
            station: a.station || '-',
            shift: a.shift || '-',
            id_station: a.id_station,
            id_shift: a.id_shift,
            expected: a.heure_prevue?.substring(0, 5) || '00:00',
            actual: a.heure_arrivee?.substring(0, 5) || '00:00',
            heure_arrivee_raw: a.heure_arrivee,
            delayMin: Math.round(a.retard_minutes),
            severity: a.retard_minutes > 20 ? 'critical' : (a.retard_minutes > 10 ? 'warning' : 'normal')
          }));
          setDelaysData(lates);
        }
        if (Array.isArray(stData)) setStations(stData);
        if (Array.isArray(shData)) setShifts(shData);
      })
      .catch(() => addToast('Erreur de connexion au serveur', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ---- CREATE ----
  const handleCreate = (e) => {
    e.preventDefault();
    const shiftTime = shifts.find(s => String(s.id_shift) === String(form.id_shift))?.heure_depart_prevue?.substring(0,5);
    const errors = validateForm({
      mat: [required(form.mat, 'Le matricule')],
      id_station: [required(form.id_station, 'La station')],
      id_shift: [required(form.id_shift, 'Le shift')],
      heure_arrivee: [required(form.heure_arrivee, 'L\'heure d\'arrivée'), validateTime(form.heure_arrivee, 'L\'heure d\'arrivée')],
      logique: [shiftTime ? validateArrivalLogic(shiftTime, form.heure_arrivee) : null],
    });
    setAddErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/affectations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Date_Affectation: new Date().toISOString().split('T')[0],
        mat: form.mat.trim(), id_station: Number(form.id_station),
        id_shift: Number(form.id_shift), heure_arrivee: `${form.heure_arrivee}:00`
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
        fetchData(); 
        if (onDataChange) onDataChange();
        addToast('Pointage ajouté avec succès !', 'success'); 
        setShowAddModal(false); 
        setAddErrors({}); 
      })
      .catch((err) => addToast(err.message || 'Erreur lors de l\'ajout', 'error'));
  };

  // ---- UPDATE ----
  const handleUpdate = (e) => {
    e.preventDefault();
    const shiftTime = shifts.find(s => String(s.id_shift) === String(editTarget.id_shift))?.heure_depart_prevue?.substring(0,5);
    const errors = validateForm({
      id_station: [required(editTarget.id_station, 'La station')],
      id_shift: [required(editTarget.id_shift, 'Le shift')],
      heure_arrivee: [required(editTarget.actual, 'L\'heure d\'arrivée'), validateTime(editTarget.actual, 'L\'heure d\'arrivée')],
      logique: [shiftTime ? validateArrivalLogic(shiftTime, editTarget.actual) : null],
    });
    setEditErrors(errors);
    if (!isFormValid(errors)) return;
    fetch(`${API}/affectations/${editTarget.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heure_arrivee: `${editTarget.actual}:00`, id_station: Number(editTarget.id_station), id_shift: Number(editTarget.id_shift) })
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => { 
        fetchData(); 
        if (onDataChange) onDataChange();
        addToast('Pointage modifié !', 'success'); 
        setEditTarget(null); 
        setEditErrors({}); 
      })
      .catch(() => addToast('Erreur lors de la modification', 'error'));
  };

  // ---- DELETE ----
  const confirmDelete = () => {
    fetch(`${API}/affectations/${deleteTarget.id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error(); })
      .then(() => { 
        fetchData(); 
        if (onDataChange) onDataChange();
        addToast('Pointage supprimé.', 'error'); 
        setDeleteTarget(null); 
      })
      .catch(() => addToast('Erreur lors de la suppression', 'error'));
  };

  // ---- EXPORT PDF ----
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18); doc.setTextColor(230, 0, 18);
    doc.text('Rapport des Retards de Transport - YAZAKI', 14, 22);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 30);
    autoTable(doc, {
      head: [['Code', 'Date', 'Opérateur', 'Matricule', 'Bus', 'Station', 'Shift', 'Retard (min)', 'Sévérité']],
      body: filteredData.map(r => [
        `DEL-${r.id}`, r.date, r.operator, r.mat, r.bus, r.station, r.shift,
        `+${r.delayMin} min`,
        r.severity === 'critical' ? 'Critique' : r.severity === 'warning' ? 'Modéré' : 'Faible'
      ]),
      startY: 35, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [230, 0, 18], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save('Yazaki_Rapport_Retards.pdf');
  };

  const filteredData = delaysData.filter(item => {
    const matchesSearch = item.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.station.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const { items: sortedDelays, requestSort, sortConfig } = useSortableData(filteredData);

  // --- Pagination ---
  const PER_PAGE = 50;
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, severityFilter, sortConfig]);
  const totalItems = sortedDelays.length;
  const pagedDelays = sortedDelays.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="delays-view">
      <ToastContainer toasts={toasts} />

      <div className="section-header">
        <div className="section-title-group">
          <h3>Supervision & Analyse des Retards</h3>
          <p>Analyse en temps réel de la ponctualité du réseau</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchData} title="Actualiser">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn-secondary" onClick={exportToPDF}>
            <Download size={16} /> Exporter PDF
          </button>
          <button className="btn-primary" onClick={() => { setForm({ mat: '', id_station: '', id_shift: '', heure_arrivee: '06:00' }); setShowAddModal(true); }}>
            <Plus size={16} /> Nouveau Pointage
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="controls-bar" style={{ justifyContent: 'space-between' }}>
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Rechercher par opérateur, matricule, bus, station..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select className="select-filter" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="all">Tous les retards</option>
              <option value="critical">Critique (&gt; 20 min)</option>
              <option value="warning">Modéré (10–20 min)</option>
              <option value="normal">Mineur (&lt; 10 min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        {loading ? (
          <table className="custom-table"><tbody><SkeletonRows cols={9} rows={4} /></tbody></table>
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Aucun retard enregistré"
            description="Tous les opérateurs sont à l'heure ! Ou ajoutez un nouveau pointage pour commencer le suivi."
            action={{ label: '+ Nouveau Pointage', onClick: () => setShowAddModal(true) }}
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
              <tr>
                  <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Opérateur" sortKey="operator" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Bus" sortKey="bus" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Station" sortKey="station" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Shift" sortKey="shift" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Prévu → Arrivé" sortKey="expected" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Écart" sortKey="delayMin" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Statut" sortKey="severity" sortConfig={sortConfig} requestSort={requestSort} />
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedDelays.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{row.operator}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.mat}</div>
                    </td>
                    <td><span className="badge badge-blue">{row.bus}</span></td>
                    <td>{row.station}</td>
                    <td>{row.shift}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.expected}</span> → <span style={{ fontWeight: '700', color: 'var(--yazaki-red)' }}>{row.actual}</span>
                    </td>
                    <td style={{ fontWeight: '800', color: row.severity === 'critical' ? 'var(--yazaki-red)' : 'var(--accent-amber)' }}>
                      +{row.delayMin} min
                    </td>
                    <td><span className={`badge badge-${row.severity}`}>
                      {row.severity === 'critical' ? 'Critique' : row.severity === 'warning' ? 'Modéré' : 'Faible'}
                    </span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => setEditTarget({ ...row })} title="Modifier">
                          <Edit size={14} color="var(--accent-blue)" />
                        </button>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => setDeleteTarget(row)} title="Supprimer">
                          <Trash2 size={14} color="var(--yazaki-red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {/* ADD Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouveau Pointage de Retard</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} noValidate>
              <div className="form-group">
                <label>Matricule Opérateur *</label>
                <input type="text" className={`form-control ${addErrors.mat ? 'has-error' : ''}`} placeholder="ex: M001"
                  value={form.mat} onChange={e => { setForm({ ...form, mat: e.target.value }); setAddErrors(p => ({ ...p, mat: null })); }} />
                <FieldError error={addErrors.mat} />
              </div>
              <div className="form-group">
                <label>Station *</label>
                <select className={`form-control ${addErrors.id_station ? 'has-error' : ''}`} value={form.id_station}
                  onChange={e => { setForm({ ...form, id_station: e.target.value }); setAddErrors(p => ({ ...p, id_station: null })); }}>
                  <option value="">— Sélectionner une station —</option>
                  {stations.map(s => <option key={s.id_station} value={s.id_station}>{s.nom_station}</option>)}
                </select>
                <FieldError error={addErrors.id_station} />
              </div>
              <div className="form-group">
                <label>Shift *</label>
                <select className={`form-control ${addErrors.id_shift ? 'has-error' : ''}`} value={form.id_shift}
                  onChange={e => { setForm({ ...form, id_shift: e.target.value }); setAddErrors(p => ({ ...p, id_shift: null })); }}>
                  <option value="">— Sélectionner un shift —</option>
                  {shifts.map(s => <option key={s.id_shift} value={s.id_shift}>{s.nom_shift} ({s.heure_depart_prevue?.substring(0, 5)})</option>)}
                </select>
                <FieldError error={addErrors.id_shift} />
              </div>
              <div className="form-group">
                <label>Heure d'arrivée constatée *</label>
                <input type="time" className={`form-control ${addErrors.heure_arrivee ? 'has-error' : ''}`}
                  value={form.heure_arrivee} onChange={e => { setForm({ ...form, heure_arrivee: e.target.value }); setAddErrors(p => ({ ...p, heure_arrivee: null })); }} />
                <FieldError error={addErrors.heure_arrivee} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT Modal */}
      {editTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Modifier le Pointage</h3>
              <button className="close-btn" onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Station</label>
                <select className="form-control" value={editTarget.id_station}
                  onChange={e => setEditTarget({ ...editTarget, id_station: e.target.value })}>
                  {stations.map(s => <option key={s.id_station} value={s.id_station}>{s.nom_station}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" value={editTarget.id_shift}
                  onChange={e => setEditTarget({ ...editTarget, id_shift: e.target.value })}>
                  {shifts.map(s => <option key={s.id_shift} value={s.id_shift}>{s.nom_shift} ({s.heure_depart_prevue?.substring(0, 5)})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Heure d'arrivée corrigée</label>
                <input type="time" className="form-control" required
                  value={editTarget.actual}
                  onChange={e => setEditTarget({ ...editTarget, actual: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>Annuler</button>
                <button type="submit" className="btn-primary">Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        itemName={`le pointage de ${deleteTarget?.operator}`}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import DeleteModal from '../components/DeleteModal';
import { SkeletonRows } from '../components/LoadingSpinner';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import { validateForm, isFormValid, required, minLength, maxLength, onlyNumbers, onlyLetters } from '../utils/validate';

const FieldError = ({ error }) => error
  ? <div className="field-error"><AlertCircle size={12} />{error}</div> : null;

export default function OperatorsView({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOpMat, setNewOpMat] = useState('');
  const [newOpName, setNewOpName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, addToast } = useToast();

  const fetchOperators = () => {
    setLoading(true);
    fetch('http://localhost:5001/api/transport/operators')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (Array.isArray(data)) {
          setOperators(data.map(op => ({ ...op, station: op.station || 'Non Affectée', bus: op.bus || 'En attente' })));
        }
      })
      .catch(() => addToast('Erreur de connexion au serveur', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOperators(); }, []);

  const handleAddOperator = (e) => {
    e.preventDefault();
    const errors = validateForm({
      mat: [
        required(newOpMat, 'Le matricule'),
        minLength(newOpMat, 2, 'Le matricule'),
        maxLength(newOpMat, 20, 'Le matricule'),
        onlyNumbers(newOpMat, 'Le matricule'),
      ],
      nom_prenom: [
        required(newOpName, 'Le nom et prénom'),
        minLength(newOpName, 3, 'Le nom et prénom'),
        maxLength(newOpName, 80, 'Le nom et prénom'),
        onlyLetters(newOpName, 'Le nom et prénom'),
      ],
    });
    setFormErrors(errors);
    if (!isFormValid(errors)) return;

    fetch('http://localhost:5001/api/transport/operators', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mat: newOpMat.trim(), nom_prenom: newOpName.trim() })
    })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(() => { 
        fetchOperators(); 
        if (onDataChange) onDataChange();
        addToast(`Opérateur ${newOpName} ajouté !`, 'success'); 
        setNewOpMat(''); 
        setNewOpName(''); 
        setShowAddModal(false); 
        setFormErrors({}); 
      })
      .catch(() => addToast('Erreur lors de l\'ajout', 'error'));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    fetch(`http://localhost:5001/api/transport/operators/${deleteTarget.mat}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error(); })
      .then(() => { 
        fetchOperators(); 
        if (onDataChange) onDataChange();
        addToast(`${deleteTarget.nom_prenom} supprimé.`, 'error'); 
      })
      .catch(() => addToast('Erreur lors de la suppression', 'error'))
      .finally(() => setDeleteTarget(null));
  };

  const filteredOperators = operators.filter(op =>
    (op.nom_prenom && op.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (op.mat && op.mat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { items: sortedOperators, requestSort, sortConfig } = useSortableData(filteredOperators);

  // --- Pagination ---
  const PER_PAGE = 50;
  const [currentPage, setCurrentPage] = React.useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig]);
  const totalItems = sortedOperators.length;
  const pagedOperators = sortedOperators.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="operators-view">
      <ToastContainer toasts={toasts} />
      <div className="section-header">
        <div className="section-title-group">
          <h3>Gestion des Opérateurs</h3>
          <p>Annuaire du personnel de transport Yazaki</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchOperators} title="Actualiser"><RefreshCw size={16} className={loading ? 'spin' : ''} /></button>
          <button className="btn-primary" onClick={() => { setShowAddModal(true); setFormErrors({}); setNewOpMat(''); setNewOpName(''); }}>
            <Plus size={16} /> Ajouter un Opérateur
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Rechercher par Nom ou Matricule..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <table className="custom-table"><tbody><SkeletonRows cols={6} rows={4} /></tbody></table>
        ) : sortedOperators.length === 0 ? (
          <EmptyState icon={Users} title="Aucun opérateur trouvé"
            description="Ajoutez des opérateurs pour les voir apparaître ici."
            action={{ label: '+ Ajouter un Opérateur', onClick: () => setShowAddModal(true) }} />
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <SortableHeader label="Matricule" sortKey="mat" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Nom & Prénom" sortKey="nom_prenom" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Station" sortKey="station" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Bus" sortKey="bus" sortConfig={sortConfig} requestSort={requestSort} />
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedOperators.map((op) => (
                  <tr key={op.mat}>
                    <td style={{ fontWeight: '800', color: 'var(--yazaki-red)' }}>{op.mat}</td>
                    <td style={{ fontWeight: '600' }}>{op.nom_prenom}</td>
                    <td>{op.station}</td>
                    <td><span className="badge badge-blue">{op.bus}</span></td>
                    <td><span className="badge badge-normal"><CheckCircle size={12} /> Actif</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', color: 'var(--yazaki-red)', borderColor: 'rgba(230,0,18,0.3)' }}
                        onClick={() => setDeleteTarget(op)} title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={totalItems} page={currentPage} perPage={PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouvel Opérateur</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddOperator} noValidate>
              <div className="form-group">
                <label>Matricule Unique (Chiffres uniquement) *</label>
                <input type="text" className={`form-control ${formErrors.mat ? 'has-error' : ''}`}
                  placeholder="ex: 1099" value={newOpMat}
                  onChange={(e) => { setNewOpMat(e.target.value); setFormErrors(p => ({ ...p, mat: null })); }} />
                <FieldError error={formErrors.mat} />
              </div>
              <div className="form-group">
                <label>Nom et Prénom *</label>
                <input type="text" className={`form-control ${formErrors.nom_prenom ? 'has-error' : ''}`}
                  placeholder="ex: Amine Jabri" value={newOpName}
                  onChange={(e) => { setNewOpName(e.target.value); setFormErrors(p => ({ ...p, nom_prenom: null })); }} />
                <FieldError error={formErrors.nom_prenom} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal isOpen={!!deleteTarget} onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)} itemName={deleteTarget?.nom_prenom} />
    </div>
  );
}

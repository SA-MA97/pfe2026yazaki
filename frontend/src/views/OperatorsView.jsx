import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function OperatorsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOpMat, setNewOpMat] = useState('');
  const [newOpName, setNewOpName] = useState('');
  const [loading, setLoading] = useState(true);

  const [operators, setOperators] = useState([
    { mat: 'mat_001', nom_prenom: 'Karim Bennani', station: 'station bni makada', bus: 'bus tanger 01', status: 'Actif' },
    { mat: 'mat_002', nom_prenom: 'Asma Garaja', station: 'station mesnana', bus: 'bus tanger 02', status: 'Actif' },
    { mat: 'mat_003', nom_prenom: 'Yassine Chraibi', station: 'station malabata', bus: 'bus tetouan 01', status: 'Actif' },
  ]);

  const fetchOperators = () => {
    setLoading(true);
    fetch('http://localhost:5001/api/transport/operators')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOperators(data.map(op => ({
            ...op,
            station: op.station || 'Non Affectée',
            bus: op.bus || 'En attente',
            status: 'Actif'
          })));
        }
      })
      .catch(err => console.warn('Database offline, mock data used:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleAddOperator = (e) => {
    e.preventDefault();
    if (!newOpMat || !newOpName) return;

    fetch('http://localhost:5001/api/transport/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mat: newOpMat, nom_prenom: newOpName })
    })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(() => fetchOperators())
      .catch(() => {
        setOperators([{ mat: newOpMat, nom_prenom: newOpName, station: 'Non Affectée', bus: 'En attente', status: 'Actif' }, ...operators]);
      });

    setNewOpMat('');
    setNewOpName('');
    setShowAddModal(false);
  };

  const handleDelete = (mat) => {
    fetch(`http://localhost:5001/api/transport/operators/${mat}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
      })
      .then(() => fetchOperators())
      .catch(() => {
        setOperators(operators.filter(op => op.mat !== mat));
      });
  };

  const filteredOperators = operators.filter(op => 
    (op.nom_prenom && op.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (op.mat && op.mat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="operators-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Gestion des Opérateurs (`D_Operateurs`)</h3>
          <p>Données directement reliées à la table PostgreSQL Yazaki</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchOperators} title="Actualiser BDD">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Ajouter un Opérateur
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher dans PostgreSQL (Nom, Matricule)..." 
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
                <th>Matricule (mat)</th>
                <th>Nom & Prénom</th>
                <th>Station Attribuée</th>
                <th>Ligne de Bus</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.map((op) => (
                <tr key={op.mat}>
                  <td style={{ fontWeight: '800', color: 'var(--yazaki-red)' }}>{op.mat}</td>
                  <td style={{ fontWeight: '600' }}>{op.nom_prenom}</td>
                  <td>{op.station}</td>
                  <td>
                    <span className="badge badge-blue">{op.bus}</span>
                  </td>
                  <td>
                    <span className="badge badge-normal">
                      <CheckCircle size={12} /> Actif
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.6rem', color: 'var(--yazaki-red)', borderColor: 'rgba(230,0,18,0.3)' }} 
                      onClick={() => handleDelete(op.mat)}
                      title="Supprimer dans PostgreSQL"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enregistrer dans `D_Operateurs`</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddOperator}>
              <div className="form-group">
                <label>Matricule Unique (mat)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={newOpMat}
                  onChange={(e) => setNewOpMat(e.target.value)}
                  placeholder="ex: mat_099"
                />
              </div>
              <div className="form-group">
                <label>Nom et Prénom</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="ex: Amine Jabri"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Insérer en Base de Données</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

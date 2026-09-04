import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteModal({ isOpen, onConfirm, onCancel, itemName = 'cet élément' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(230, 0, 18, 0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
        }}>
          <AlertTriangle size={28} color="var(--yazaki-red)" />
        </div>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Confirmer la suppression
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Êtes-vous sûr de vouloir supprimer <strong style={{ color: 'var(--text-main)' }}>{itemName}</strong> ?<br />
          Cette action est <strong style={{ color: 'var(--yazaki-red)' }}>irréversible</strong>.
        </p>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onCancel}>Annuler</button>
          <button
            className="btn-primary"
            style={{ background: 'var(--yazaki-gradient)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={onConfirm}
          >
            <Trash2 size={15} />
            Oui, Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

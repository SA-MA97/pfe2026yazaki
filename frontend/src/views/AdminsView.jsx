import React, { useState, useEffect } from 'react';
import {
  UserPlus, Trash2, RefreshCw, Mail, User, Shield,
  CheckCircle, Clock, AlertCircle, Search, X
} from 'lucide-react';
import { SkeletonRows } from '../components/LoadingSpinner';

const API = 'http://localhost:5001/api/auth';

export default function AdminsView({ currentUser }) {
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ email: '', name: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/list?requesterEmail=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.email || !form.name) return setError('Email et nom sont requis.');
    setFormLoading(true);
    try {
      const res  = await fetch(`${API}/admin/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, requesterEmail: currentUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`✅ Invitation envoyée à ${form.email}. Le compte a été créé.`);
      setForm({ email: '', name: '' });
      setShowForm(false);
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (email) => {
    setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API}/admin/${encodeURIComponent(email)}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail: currentUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Compte ${email} supprimé.`);
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = admins.filter(a =>
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="operators-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Gestion des Comptes Admin</h3>
          <p>Invitez de nouveaux administrateurs et gérez les accès à la plateforme.</p>
        </div>
        <div className="controls-bar">
          <button className="btn-secondary" onClick={fetchAdmins} title="Actualiser">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}>
            <UserPlus size={16} /> Inviter un Admin
          </button>
        </div>
      </div>

      {error   && <div className="login-error-box" style={{ marginBottom: '1.5rem' }}><AlertCircle size={16} /><span>{error}</span></div>}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', color: '#059669', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
          <CheckCircle size={18} /><span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* Formulaire d'invitation (Modal-like) */}
      {showForm && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={20} style={{ color: 'var(--yazaki-red)' }} />
              Inviter un nouvel administrateur
            </h3>
            <button onClick={() => { setShowForm(false); setForm({ email: '', name: '' }); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ background: 'rgba(230,0,18,0.06)', border: '1px solid rgba(230,0,18,0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            📧 Un email d'invitation sera envoyé avec un mot de passe temporaire valable <strong>72 heures</strong>. L'administrateur devra le modifier à sa première connexion.
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <Mail size={16} /> Adresse Email *
                </label>
                <input type="email" className="form-control" placeholder="nouveau@yazaki.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <User size={16} /> Nom et Prénom *
                </label>
                <input type="text" className="form-control" placeholder="Prénom Nom"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm({ email: '', name: '' }); }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={formLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formLoading ? <><RefreshCw size={16} className="spin" /> Envoi...</> : <><Mail size={16} /> Envoyer l'invitation</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-input-box" style={{ maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Rechercher par email ou nom..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <table className="custom-table"><tbody><SkeletonRows cols={7} rows={4} /></tbody></table>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Administrateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut du compte</th>
                  <th>Créé le</th>
                  <th>Invité par</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucun compte trouvé.</td></tr>
                ) : filtered.map(admin => {
                  const isTempExpired = admin.has_temp_password && admin.temp_expires_at && new Date() > new Date(admin.temp_expires_at);
                  return (
                    <tr key={admin.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: admin.is_super_admin ? 'rgba(230,0,18,0.15)' : 'rgba(99,102,241,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {admin.is_super_admin
                              ? <Shield size={16} style={{ color: 'var(--yazaki-red)' }} />
                              : <User size={16} style={{ color: '#6366f1' }} />}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{admin.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{admin.email}</td>
                      <td>
                        <span className="badge" style={{
                          background: admin.is_super_admin ? 'rgba(230,0,18,0.12)' : 'rgba(99,102,241,0.12)',
                          color: admin.is_super_admin ? 'var(--yazaki-red)' : '#6366f1',
                        }}>
                          {admin.is_super_admin ? '⭐ Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td>
                        {admin.has_temp_password ? (
                          <span className={isTempExpired ? "badge badge-error" : "badge badge-warning"}>
                            <Clock size={12} />
                            {isTempExpired ? 'Expiré' : 'Mot de passe temporaire'}
                          </span>
                        ) : (
                          <span className="badge badge-normal">
                            <CheckCircle size={12} /> Actif
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(admin.created_at)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{admin.created_by || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {!admin.is_super_admin ? (
                          deleteTarget === admin.email ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', color: '#fff', background: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleDelete(admin.email)}>Confirmer</button>
                              <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setDeleteTarget(null)}>Annuler</button>
                            </div>
                          ) : (
                            <button
                              className="btn-secondary"
                              onClick={() => { setDeleteTarget(admin.email); setError(''); setSuccess(''); }}
                              style={{ padding: '0.4rem 0.6rem', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
                              title="Supprimer ce compte"
                            >
                              <Trash2 size={16} />
                            </button>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Connecté au Frontend Vite + React')
  const [users, setUsers] = useState([])

  useEffect(() => {
    // API backend call example
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setStatus('Backend non démarré (http://localhost:5000)'))
  }, [])

  return (
    <div className="app-container">
      <header className="navbar glass-panel">
        <div className="logo-section">
          <span className="brand-badge">YAZAKI</span>
          <h2>Transport Management System</h2>
        </div>
        <div className="user-profile">
          <span className="status-indicator"></span>
          <span>{status}</span>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="hero-banner glass-panel">
          <h1>Bienvenue sur la plateforme <span className="gradient-text">YAZAKI Transport</span></h1>
          <p>Supervision en temps réel des opérateurs, des bus et de la gestion des retards.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <span className="stat-label">Statut Backend API</span>
            <h3 className="stat-value">{users.length > 0 ? 'En ligne' : 'En attente'}</h3>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-label">Utilisateurs enregistrés</span>
            <h3 className="stat-value">{users.length}</h3>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-label">Projet</span>
            <h3 className="stat-value">PFE 2026</h3>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

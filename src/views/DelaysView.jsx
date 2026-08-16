import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, Download, Calendar, Bus, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DelaysView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const delaysData = [
    { id: 'DEL-101', date: '2026-08-14', operator: 'Mohammed Amine', mat: 'MAT-8842', bus: 'Bus B-12', station: 'Bni Makada', shift: 'Matin (06:00)', expected: '05:45', actual: '06:12', delayMin: 27, severity: 'critical' },
    { id: 'DEL-102', date: '2026-08-14', operator: 'Fatima Zohra', mat: 'MAT-7719', bus: 'Bus B-04', station: 'Mesnana', shift: 'Matin (06:00)', expected: '05:40', actual: '05:54', delayMin: 14, severity: 'warning' },
    { id: 'DEL-103', date: '2026-08-13', operator: 'Youssef El Alami', mat: 'MAT-9301', bus: 'Bus B-08', station: 'Malabata', shift: 'Soir (14:00)', expected: '13:45', actual: '13:52', delayMin: 7, severity: 'normal' },
    { id: 'DEL-104', date: '2026-08-13', operator: 'Khadija Mansouri', mat: 'MAT-6623', bus: 'Bus B-19', station: 'Gzennaya', shift: 'Nuit (22:00)', expected: '21:40', actual: '22:11', delayMin: 31, severity: 'critical' },
    { id: 'DEL-105', date: '2026-08-13', operator: 'Omar Benali', mat: 'MAT-4412', bus: 'Bus B-02', station: 'Charf', shift: 'Soir (14:00)', expected: '13:45', actual: '14:02', delayMin: 17, severity: 'warning' },
    { id: 'DEL-106', date: '2026-08-12', operator: 'Salma Tazi', mat: 'MAT-5118', bus: 'Bus B-15', station: 'Boukhalef', shift: 'Matin (06:00)', expected: '05:50', actual: '05:55', delayMin: 5, severity: 'normal' },
  ];

  const filteredData = delaysData.filter(item => {
    const matchesSearch = item.operator.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.mat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.bus.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.station.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Add Title
    doc.setFontSize(18);
    doc.setTextColor(230, 0, 18); // Yazaki red
    doc.text('Rapport des Retards de Transport - YAZAKI', 14, 22);
    
    // Add Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Genere le : ${new Date().toLocaleString('fr-FR')}`, 14, 30);

    // Prepare table data
    const tableColumn = ["Code", "Date", "Operateur", "Matricule", "Bus", "Station", "Shift", "Retard (min)", "Severite"];
    const tableRows = [];

    filteredData.forEach(row => {
      const rowData = [
        row.id,
        row.date,
        row.operator,
        row.mat,
        row.bus,
        row.station,
        row.shift,
        `+${row.delayMin} min`,
        row.severity === 'critical' ? 'Critique' : row.severity === 'warning' ? 'Modere' : 'Faible'
      ];
      tableRows.push(rowData);
    });

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [230, 0, 18], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Save PDF
    doc.save('Yazaki_Rapport_Retards.pdf');
  };

  return (
    <div className="delays-view">
      <div className="section-header">
        <div className="section-title-group">
          <h3>Supervision & Analyse des Retards</h3>
          <p>Consultez les dépassements d'horaires et le non-respect des heures d'arrivée usine</p>
        </div>

        <div className="controls-bar">
          <button className="btn-secondary" onClick={exportToPDF}>
            <Download size={16} />
            Exporter Rapport PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="controls-bar" style={{ justifyContent: 'space-between' }}>
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher par opérateur, matricule, bus, station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Niveau de retard:</span>
            <select 
              className="select-filter" 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">Tous les retards</option>
              <option value="critical">Critique (&gt; 20 min)</option>
              <option value="warning">Moyen (10 - 20 min)</option>
              <option value="normal">Mineur (&lt; 10 min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delays Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code Incident</th>
                <th>Date</th>
                <th>Opérateur (Matricule)</th>
                <th>Ligne Bus</th>
                <th>Station</th>
                <th>Shift Prevu</th>
                <th>Heure Prevue vs Arrivée</th>
                <th>Ecart (Retard)</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.id}</td>
                  <td>{row.date}</td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{row.operator}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.mat}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      <Bus size={12} style={{ marginRight: '0.2rem' }} />
                      {row.bus}
                    </span>
                  </td>
                  <td>{row.station}</td>
                  <td>{row.shift}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Prévu: {row.expected}</span> &rarr; <span style={{ fontWeight: '700', color: 'var(--yazaki-red)' }}>Arrivé: {row.actual}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '800', fontSize: '1rem', color: row.severity === 'critical' ? 'var(--yazaki-red)' : 'var(--accent-amber)' }}>
                    +{row.delayMin} min
                  </td>
                  <td>
                    <span className={`badge badge-${row.severity}`}>
                      {row.severity === 'critical' ? 'Critique' : row.severity === 'warning' ? 'Modéré' : 'Faible'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucun incident de retard trouvé pour les critères sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

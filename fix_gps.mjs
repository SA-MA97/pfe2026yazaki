import pool from './backend/src/config/db.js';

const updates = [
  [`UPDATE D_Stations SET latitude=37.2597, longitude=9.8823 WHERE nom_station ILIKE '%Zarzouna%'`, 'Zarzouna'],
  [`UPDATE D_Stations SET latitude=37.2720, longitude=9.8580 WHERE nom_station ILIKE '%Corniche%'`, 'Corniche Plage'],
  [`UPDATE D_Stations SET latitude=37.1537, longitude=9.7859 WHERE nom_station ILIKE '%Menzel Bourguiba%'`, 'Menzel Bourguiba'],
  [`UPDATE D_Stations SET latitude=37.2419, longitude=9.8739 WHERE nom_station ILIKE '%Menzel Abderrahmane%'`, 'Menzel Abderrahmane'],
  [`UPDATE D_Stations SET latitude=37.1670, longitude=9.7670 WHERE nom_station ILIKE '%Tinja%'`, 'Tinja'],
  [`UPDATE D_Stations SET latitude=37.2162, longitude=10.1143 WHERE nom_station ILIKE '%Ras Jebel%'`, 'Ras Jebel'],
  [`UPDATE D_Stations SET latitude=37.0400, longitude=9.6650 WHERE nom_station ILIKE '%Mateur%'`, 'Mateur'],
  [`UPDATE D_Stations SET latitude=37.2746, longitude=9.8627 WHERE nom_station ILIKE '%Bizerte%'`, 'Bizerte Centre Ville'],
];

for (const [query, name] of updates) {
  const result = await pool.query(query);
  console.log(`✅ ${name} → ${result.rowCount} ligne(s) mise(s) à jour`);
}

const { rows } = await pool.query('SELECT nom_station, nom_region, latitude, longitude FROM D_Stations ORDER BY nom_station');
console.log('\n📍 Stations après correction :');
rows.forEach(r => console.log(`  ${r.nom_station.padEnd(30)} ${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`));

process.exit(0);

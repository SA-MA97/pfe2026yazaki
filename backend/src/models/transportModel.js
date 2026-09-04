import pool from '../config/db.js';
import { initAdminTable, seedDefaultAdmins } from './adminModel.js';

// --- TABLE CREATION INITIALIZER IF NOT EXISTS ---
export const initDatabaseTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS D_Bus (
        id_bus SERIAL PRIMARY KEY,
        nom_bus VARCHAR(150) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS D_Shifts (
        id_shift SERIAL PRIMARY KEY,
        nom_shift VARCHAR(50) NOT NULL,
        heure_depart_prevue TIME NOT NULL
      );

      CREATE TABLE IF NOT EXISTS D_Operateurs (
        mat VARCHAR(50) PRIMARY KEY,
        nom_prenom VARCHAR(150) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS D_Stations (
        id_station SERIAL PRIMARY KEY,
        id_bus INTEGER REFERENCES D_Bus(id_bus) ON DELETE SET NULL,
        nom_station VARCHAR(150) NOT NULL,
        nom_region VARCHAR(150),
        latitude NUMERIC(10, 7),
        longitude NUMERIC(10, 7)
      );

      CREATE TABLE IF NOT EXISTS F_Affectations (
        id_affectation SERIAL PRIMARY KEY,
        Date_Affectation DATE NOT NULL DEFAULT CURRENT_DATE,
        mat VARCHAR(50) REFERENCES D_Operateurs(mat) ON DELETE CASCADE,
        id_station INTEGER REFERENCES D_Stations(id_station) ON DELETE CASCADE,
        id_shift INTEGER REFERENCES D_Shifts(id_shift) ON DELETE CASCADE,
        heure_arrivee TIME
      );
    `);
    // Initialiser la table des admins + seeder les comptes par défaut
    await initAdminTable();
    await seedDefaultAdmins();
    console.log("✅ Tables Yazaki transport vérifiées / créées avec succès.");
  } catch (error) {
    console.error("⚠️ Erreur d'initialisation des tables :", error.message);
  }
};

// --- D_OPERATEURS ---
export const getAllOperatorsDB = async () => {
  const result = await pool.query(`
    SELECT * FROM (
      SELECT DISTINCT ON (o.mat) 
        o.mat, 
        o.nom_prenom, 
        s.nom_station as station, 
        b.nom_bus as bus
      FROM D_Operateurs o
      LEFT JOIN F_Affectations a ON o.mat = a.mat
      LEFT JOIN D_Stations s ON a.id_station = s.id_station
      LEFT JOIN D_Bus b ON s.id_bus = b.id_bus
      ORDER BY o.mat ASC, a.Date_Affectation DESC
    ) sub
    ORDER BY sub.nom_prenom ASC
  `);
  return result.rows;
};

export const createOperatorDB = async (mat, nom_prenom) => {
  const result = await pool.query(
    `INSERT INTO D_Operateurs (mat, nom_prenom) VALUES ($1, $2) ON CONFLICT (mat) DO UPDATE SET nom_prenom = $2 RETURNING *`,
    [mat, nom_prenom]
  );
  return result.rows[0];
};

export const deleteOperatorDB = async (mat) => {
  const result = await pool.query(`DELETE FROM D_Operateurs WHERE mat = $1 RETURNING *`, [mat]);
  return result.rows[0];
};

// --- D_BUS ---
export const getAllBusesDB = async () => {
  const result = await pool.query(`
    SELECT b.id_bus, b.nom_bus, COUNT(s.id_station)::int as stations_count
    FROM D_Bus b
    LEFT JOIN D_Stations s ON b.id_bus = s.id_bus
    GROUP BY b.id_bus, b.nom_bus
    ORDER BY b.id_bus ASC
  `);
  return result.rows;
};

export const createBusDB = async (nom_bus) => {
  const result = await pool.query(
    `INSERT INTO D_Bus (nom_bus) VALUES ($1) RETURNING *`,
    [nom_bus]
  );
  return result.rows[0];
};

// --- D_STATIONS ---
export const updateBusDB = async (id, nom_bus) => {
  const result = await pool.query(
    `UPDATE D_Bus SET nom_bus = $1 WHERE id_bus = $2 RETURNING *`,
    [nom_bus, id]
  );
  return result.rows[0];
};

export const deleteBusDB = async (id) => {
  await pool.query(`DELETE FROM D_Bus WHERE id_bus = $1`, [id]);
};

export const getAllStationsDB = async () => {
  const result = await pool.query(`
    SELECT s.id_station, s.nom_station, s.nom_region, s.latitude, s.longitude, b.id_bus, b.nom_bus 
    FROM D_Stations s
    LEFT JOIN D_Bus b ON s.id_bus = b.id_bus
    ORDER BY s.id_station DESC
  `);
  return result.rows;
};

export const createStationDB = async (nom_station, nom_region, id_bus, latitude, longitude) => {
  const result = await pool.query(
    `INSERT INTO D_Stations (nom_station, nom_region, id_bus, latitude, longitude) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nom_station, nom_region, id_bus || null, latitude, longitude]
  );
  return result.rows[0];
};

export const updateStationDB = async (id, nom_station, nom_region, id_bus, latitude, longitude) => {
  const result = await pool.query(
    `UPDATE D_Stations 
     SET nom_station = $1, nom_region = $2, id_bus = $3, latitude = $4, longitude = $5 
     WHERE id_station = $6 RETURNING *`,
    [nom_station, nom_region, id_bus || null, latitude, longitude, id]
  );
  return result.rows[0];
};

export const deleteStationDB = async (id) => {
  await pool.query(`DELETE FROM D_Stations WHERE id_station = $1`, [id]);
};

// --- D_SHIFTS ---
export const getAllShiftsDB = async () => {
  const result = await pool.query(`SELECT * FROM D_Shifts ORDER BY heure_depart_prevue ASC`);
  return result.rows;
};

export const createShiftDB = async (nom_shift, heure_depart_prevue) => {
  const result = await pool.query(
    `INSERT INTO D_Shifts (nom_shift, heure_depart_prevue) VALUES ($1, $2) RETURNING *`,
    [nom_shift, heure_depart_prevue]
  );
  return result.rows[0];
};

export const deleteShiftDB = async (id) => {
  const result = await pool.query(`DELETE FROM D_Shifts WHERE id_shift = $1 RETURNING *`, [id]);
  return result.rows[0];
};

export const updateShiftDB = async (id, nom_shift, heure_depart_prevue) => {
  const result = await pool.query(
    `UPDATE D_Shifts SET nom_shift = $1, heure_depart_prevue = $2 WHERE id_shift = $3 RETURNING *`,
    [nom_shift, heure_depart_prevue, id]
  );
  return result.rows[0];
};

// --- F_AFFECTATIONS & RETARDS ---
export const getAllAffectationsDB = async () => {
  const result = await pool.query(`
    SELECT 
      f.id_affectation,
      f.Date_Affectation as date,
      f.mat,
      o.nom_prenom as operator_name,
      s.nom_station as station,
      s.id_station,
      b.nom_bus as bus,
      sh.nom_shift as shift,
      sh.id_shift,
      sh.heure_depart_prevue as heure_prevue,
      f.heure_arrivee,
      EXTRACT(EPOCH FROM (f.heure_arrivee - sh.heure_depart_prevue))/60 as retard_minutes
    FROM F_Affectations f
    LEFT JOIN D_Operateurs o ON f.mat = o.mat
    LEFT JOIN D_Stations s ON f.id_station = s.id_station
    LEFT JOIN D_Bus b ON s.id_bus = b.id_bus
    LEFT JOIN D_Shifts sh ON f.id_shift = sh.id_shift
    ORDER BY f.Date_Affectation DESC, f.id_affectation DESC
  `);
  return result.rows;
};

// --- RETARDS UNIQUEMENT (toute la BDD) ---
export const getAllDelaysDB = async () => {
  const result = await pool.query(`
    SELECT 
      f.id_affectation,
      f.Date_Affectation as date,
      f.mat,
      o.nom_prenom as operator_name,
      s.nom_station as station,
      s.id_station,
      b.nom_bus as bus,
      sh.nom_shift as shift,
      sh.id_shift,
      sh.heure_depart_prevue as heure_prevue,
      f.heure_arrivee,
      EXTRACT(EPOCH FROM (f.heure_arrivee - sh.heure_depart_prevue))/60 as retard_minutes
    FROM F_Affectations f
    LEFT JOIN D_Operateurs o ON f.mat = o.mat
    LEFT JOIN D_Stations s ON f.id_station = s.id_station
    LEFT JOIN D_Bus b ON s.id_bus = b.id_bus
    LEFT JOIN D_Shifts sh ON f.id_shift = sh.id_shift
    WHERE f.heure_arrivee > sh.heure_depart_prevue
    ORDER BY retard_minutes DESC
  `);
  return result.rows;
};

export const createAffectationDB = async (date_affectation, mat, id_station, id_shift, heure_arrivee) => {
  const dateObj = new Date(date_affectation || new Date());
  const formattedDate = dateObj.toISOString().split('T')[0];
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  // S'assurer que la date existe dans la dimension Temps pour éviter l'erreur de clé étrangère
  await pool.query(
    `INSERT INTO D_Calendrier (date, annee, mois) VALUES ($1, $2, $3) ON CONFLICT (date) DO NOTHING`,
    [formattedDate, year, month]
  );

  const result = await pool.query(
    `INSERT INTO F_Affectations (Date_Affectation, mat, id_station, id_shift, heure_arrivee)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [formattedDate, mat, id_station, id_shift, heure_arrivee]
  );
  return result.rows[0];
};

export const deleteAffectationDB = async (id) => {
  const result = await pool.query(`DELETE FROM F_Affectations WHERE id_affectation = $1 RETURNING *`, [id]);
  return result.rows[0];
};

export const updateAffectationDB = async (id, heure_arrivee, id_station, id_shift) => {
  const result = await pool.query(
    `UPDATE F_Affectations SET heure_arrivee = $1, id_station = $2, id_shift = $3 WHERE id_affectation = $4 RETURNING *`,
    [heure_arrivee, id_station, id_shift, id]
  );
  return result.rows[0];
};

// --- DASHBOARD STATS ---
export const getDashboardStatsDB = async () => {
  const opCount = await pool.query(`SELECT COUNT(*)::int as count FROM D_Operateurs`);
  const busCount = await pool.query(`SELECT COUNT(*)::int as count FROM D_Bus`);
  const stationCount = await pool.query(`SELECT COUNT(*)::int as count FROM D_Stations`);
  const delays = await pool.query(`
    SELECT 
      COUNT(*)::int as total_affectations,
      COUNT(CASE WHEN f.heure_arrivee <= sh.heure_depart_prevue THEN 1 END)::int as on_time_affectations,
      AVG(CASE WHEN f.heure_arrivee > sh.heure_depart_prevue THEN EXTRACT(EPOCH FROM (f.heure_arrivee - sh.heure_depart_prevue))/60 ELSE 0 END)::numeric(10,1) as avg_delay
    FROM F_Affectations f
    LEFT JOIN D_Shifts sh ON f.id_shift = sh.id_shift
  `);

  const total = delays.rows[0]?.total_affectations || 0;
  const onTime = delays.rows[0]?.on_time_affectations || 0;
  const punctuality = total > 0 ? ((onTime / total) * 100).toFixed(1) : 100;

  return {
    operatorsCount: opCount.rows[0]?.count || 0,
    busCount: busCount.rows[0]?.count || 0,
    stationCount: stationCount.rows[0]?.count || 0,
    avgDelay: delays.rows[0]?.avg_delay || 0,
    punctuality: parseFloat(punctuality)
  };
};

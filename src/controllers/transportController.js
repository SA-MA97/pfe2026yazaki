import {
  getAllOperatorsDB,
  createOperatorDB,
  deleteOperatorDB,
  getAllBusesDB,
  createBusDB,
  getAllStationsDB,
  createStationDB,
  getAllShiftsDB,
  createShiftDB,
  getAllAffectationsDB,
  createAffectationDB,
  getDashboardStatsDB
} from '../models/transportModel.js';

// --- OPERATEURS ---
export const getOperators = async (req, res, next) => {
  try {
    const data = await getAllOperatorsDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createOperator = async (req, res, next) => {
  try {
    const { mat, nom_prenom } = req.body;
    if (!mat || !nom_prenom) return res.status(400).json({ error: 'Matricule et Nom requis' });
    const result = await createOperatorDB(mat, nom_prenom);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteOperator = async (req, res, next) => {
  try {
    const { mat } = req.params;
    const result = await deleteOperatorDB(mat);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// --- BUS ---
export const getBuses = async (req, res, next) => {
  try {
    const data = await getAllBusesDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createBus = async (req, res, next) => {
  try {
    const { nom_bus } = req.body;
    if (!nom_bus) return res.status(400).json({ error: 'Nom de bus requis' });
    const result = await createBusDB(nom_bus);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// --- STATIONS ---
export const getStations = async (req, res, next) => {
  try {
    const data = await getAllStationsDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createStation = async (req, res, next) => {
  try {
    const { nom_station, nom_region, id_bus, latitude, longitude } = req.body;
    if (!nom_station) return res.status(400).json({ error: 'Nom de station requis' });
    const result = await createStationDB(nom_station, nom_region, id_bus, latitude, longitude);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// --- SHIFTS ---
export const getShifts = async (req, res, next) => {
  try {
    const data = await getAllShiftsDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createShift = async (req, res, next) => {
  try {
    const { nom_shift, heure_depart_prevue } = req.body;
    if (!nom_shift || !heure_depart_prevue) return res.status(400).json({ error: 'Shift et Heure requis' });
    const result = await createShiftDB(nom_shift, heure_depart_prevue);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// --- AFFECTATIONS & RETARDS ---
export const getAffectations = async (req, res, next) => {
  try {
    const data = await getAllAffectationsDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createAffectation = async (req, res, next) => {
  try {
    const { Date_Affectation, mat, id_station, id_shift, heure_arrivee } = req.body;
    const result = await createAffectationDB(Date_Affectation, mat, id_station, id_shift, heure_arrivee);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// --- DASHBOARD STATS ---
export const getStats = async (req, res, next) => {
  try {
    const data = await getDashboardStatsDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

import {
  getAllOperatorsDB, createOperatorDB, deleteOperatorDB,
  getAllBusesDB, createBusDB, updateBusDB, deleteBusDB,
  getAllStationsDB, createStationDB, updateStationDB, deleteStationDB,
  getAllShiftsDB, createShiftDB, deleteShiftDB, updateShiftDB,
  getAllAffectationsDB, createAffectationDB, deleteAffectationDB, updateAffectationDB,
  getAllDelaysDB,
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

export const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom_bus } = req.body;
    const result = await updateBusDB(id, nom_bus);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteBusDB(id);
    res.json(result);
  } catch (err) { next(err); }
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

export const updateStation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom_station, nom_region, id_bus, latitude, longitude } = req.body;
    const result = await updateStationDB(id, nom_station, nom_region, id_bus, latitude, longitude);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteStation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteStationDB(id);
    res.json(result);
  } catch (err) { next(err); }
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

export const deleteShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteShiftDB(id);
    res.json(result);
  } catch (err) { next(err); }
};

export const updateShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom_shift, heure_depart_prevue } = req.body;
    const result = await updateShiftDB(id, nom_shift, heure_depart_prevue);
    res.json(result);
  } catch (err) { next(err); }
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
    if (err.code === '23503' && err.constraint === 'fk_fait_operateur') {
      return res.status(400).json({ error: "Ce matricule n'existe pas. Veuillez l'ajouter dans la page Opérateurs." });
    }
    next(err); 
  }
};

export const deleteAffectation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteAffectationDB(id);
    res.json(result);
  } catch (err) { next(err); }
};

export const updateAffectation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { heure_arrivee, id_station, id_shift } = req.body;
    const result = await updateAffectationDB(id, heure_arrivee, id_station, id_shift);
    res.json(result);
  } catch (err) { next(err); }
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

// --- RETARDS DEDIE ---
export const getDelays = async (req, res, next) => {
  try {
    const data = await getAllDelaysDB();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

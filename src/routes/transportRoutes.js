import express from 'express';
import {
  getOperators, createOperator, deleteOperator,
  getBuses, createBus, updateBus, deleteBus,
  getStations, createStation, updateStation, deleteStation,
  getShifts, createShift, deleteShift, updateShift,
  getAffectations, createAffectation, deleteAffectation, updateAffectation,
  getDelays,
  getStats
} from '../controllers/transportController.js';

const router = express.Router();

// Operateurs
router.get('/operators', getOperators);
router.post('/operators', createOperator);
router.delete('/operators/:mat', deleteOperator);

// Bus
router.get('/buses', getBuses);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Stations
router.get('/stations', getStations);
router.post('/stations', createStation);
router.put('/stations/:id', updateStation);
router.delete('/stations/:id', deleteStation);

// Shifts
router.get('/shifts', getShifts);
router.post('/shifts', createShift);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

// Affectations & Pointages
router.get('/affectations', getAffectations);
router.post('/affectations', createAffectation);
router.put('/affectations/:id', updateAffectation);
router.delete('/affectations/:id', deleteAffectation);

// Retards dédiés (toute la BDD, filtrés côté SQL)
router.get('/delays', getDelays);

// Dashboard Stats
router.get('/stats', getStats);

export default router;

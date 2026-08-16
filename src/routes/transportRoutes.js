import express from 'express';
import {
  getOperators,
  createOperator,
  deleteOperator,
  getBuses,
  createBus,
  getStations,
  createStation,
  getShifts,
  createShift,
  getAffectations,
  createAffectation,
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

// Stations
router.get('/stations', getStations);
router.post('/stations', createStation);

// Shifts
router.get('/shifts', getShifts);
router.post('/shifts', createShift);

// Affectations & Pointages
router.get('/affectations', getAffectations);
router.post('/affectations', createAffectation);

// Dashboard Stats
router.get('/stats', getStats);

export default router;

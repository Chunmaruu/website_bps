import express from 'express';
import {
  getAllVillages,
  getVillageById,
  updateVillageStatus,
} from '../controllers/villageManagementController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Proteksi seluruh rute di file ini: Wajib login dan harus role Admin BPS ('bps')
router.use(authenticateToken, authorizeRole('bps'));

router.get('/', getAllVillages);
router.get('/:id', getVillageById);
router.patch('/:id/status', updateVillageStatus);

export default router;

import express from 'express';
import {
  getHostedWebsites,
  createHostedWebsite,
} from '../controllers/hostedWebsiteController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Rute Publik (Melihat direktori website desa Subang yang sudah hosting)
router.get('/', getHostedWebsites);

// Rute Khusus Admin BPS (Menambahkan website desa yang sudah online / hosting)
router.post('/', authenticateToken, authorizeRole('bps'), createHostedWebsite);

export default router;

import express from 'express';
import {
  registerDesa,
  loginDesa,
  loginBps,
  getMe,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rute Publik
router.post('/register/desa', registerDesa);
router.post('/login/desa', loginDesa);
router.post('/login/bps', loginBps);

// Rute Terproteksi
router.get('/me', authenticateToken, getMe);

export default router;

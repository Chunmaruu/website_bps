import express from 'express';
import {
  registerDesa,
  loginDesa,
  loginBps,
  getMe,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/authRateLimit.js';

const router = express.Router();

// Rute Publik
router.post('/register/desa', authRateLimit, registerDesa);
router.post('/login/desa', authRateLimit, loginDesa);
router.post('/login/bps', authRateLimit, loginBps);

// Rute Terproteksi
router.get('/me', authenticateToken, getMe);

export default router;

import express from 'express';
import {
  getPublicTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
} from '../controllers/templateController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Rute Publik / Admin Desa (Galeri Templat)
router.get('/', getPublicTemplates);
router.get('/:id', getTemplateById);

// Rute Khusus Admin BPS (CRUD & Status Manajemen Templat)
router.post('/', authenticateToken, authorizeRole('bps'), createTemplate);
router.put('/:id', authenticateToken, authorizeRole('bps'), updateTemplate);
router.patch('/:id/status', authenticateToken, authorizeRole('bps'), updateTemplateStatus);

export default router;

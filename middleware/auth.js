import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

import { JWT_SECRET } from '../config/auth.js';

/**
 * Middleware untuk memverifikasi token JWT dari header Authorization.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded; // Menyimpan data user (id dan role) ke objek req
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Token tidak valid atau telah kedaluwarsa.'
    });
  }
};

/**
 * Middleware untuk membatasi akses berdasarkan role tertentu.
 * @param {...string} allowedRoles - Daftar role yang diizinkan (misal: 'bps', 'desa')
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Role tidak terdefinisi.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Anda tidak memiliki hak akses untuk rute ini.'
      });
    }

    next();
  };
};

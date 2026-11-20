import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import villageManagementRoutes from './routes/villageManagementRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import hostedWebsiteRoutes from './routes/hostedWebsiteRoutes.js';
import { createWebsiteRouter, publicVillage } from './routes/websiteRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hanya aset publik yang boleh diakses melalui HTTP.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gambar', express.static(path.join(__dirname, 'gambar')));
app.use('/gambar', express.static(path.join(__dirname, 'public', 'gambar')));

// Handler eksplisit untuk halaman utama dan portal admin
app.get(['/', '/admin'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute Autentikasi
app.use('/api/auth', authRoutes);

// Rute Manajemen Desa (Khusus Admin BPS)
app.use('/api/admin/villages', villageManagementRoutes);

// Rute Templat Website Desa
app.use('/api/templates', templateRoutes);

// Rute Direktori Website Desa yang Sudah Hosting
app.use('/api/hosted-websites', hostedWebsiteRoutes);
app.use('/api/my-website', createWebsiteRouter());
app.get('/desa/:slug', publicVillage);
app.get('/desa/:slug/dokumen', publicVillage);

// Endpoint status (Health check)
app.get('/api/status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'success',
      message: 'Server Express berjalan dan database terhubung.',
      timestamp: new Date(),
      env: process.env.NODE_ENV,
      db: {
        dialect: sequelize.getDialect(),
        connected: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server Express berjalan tetapi koneksi database gagal.',
      timestamp: new Date(),
      error: error.message
    });
  }
});

// Unknown paths must not expose source files or masquerade as the SPA.
app.use((req, res) => res.status(404).json({ status: 'error', message: 'Tidak ditemukan.' }));

// Jalankan server dan hubungkan ke database
const startServer = async () => {
  try {
    try {
      await sequelize.authenticate();
      console.log('Koneksi database berhasil dilakukan.');
      
      // Sinkronisasi model database
      await sequelize.sync();
      console.log('Sinkronisasi model database berhasil.');

    } catch (dbErr) {
      console.warn('Database connection/sync warning:', dbErr.message);
    }
    
    // Hanya lakukan app.listen jika tidak berjalan di environment serverless Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server berjalan dalam mode ${process.env.NODE_ENV || 'development'} pada port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

startServer();
export default app;


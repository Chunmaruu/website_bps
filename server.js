import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import villageManagementRoutes from './routes/villageManagementRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import hostedWebsiteRoutes from './routes/hostedWebsiteRoutes.js';

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

// Sajikan file statis dari direktori 'public', root, dan 'gambar'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/gambar', express.static(path.join(__dirname, 'gambar')));
app.use('/gambar', express.static(path.join(__dirname, 'public', 'gambar')));

// Handler eksplisit untuk halaman utama
app.get('/', (req, res) => {
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
        dialect: process.env.DB_DIALECT || 'sqlite',
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

// Fallback jika ada request GET yang bukan /api
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server dan hubungkan ke database
const startServer = async () => {
  try {
    try {
      await sequelize.authenticate();
      console.log('Koneksi database berhasil dilakukan.');
      
      // Sinkronisasi model database
      await sequelize.sync();
      console.log('Sinkronisasi model database berhasil.');

      // Auto-seed default Admin BPS jika belum ada (berguna untuk SQLite baru di /tmp)
      const defaultEmail = 'admin@bps.go.id';
      const { AdminBps, AdminDesa } = await import('./models/index.js');
      const existingAdmin = await AdminBps.findOne({ where: { email: defaultEmail } });
      if (!existingAdmin) {
        const bcrypt = (await import('bcryptjs')).default;
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('admin123', salt);
        await AdminBps.create({
          nama: 'Super Admin BPS',
          email: defaultEmail,
          password_hash,
          status: 'aktif',
        });
        console.log('Auto-seed default Admin BPS berhasil (admin@bps.go.id).');
      }

      // Auto-seed sample Admin Desa jika belum ada data (berguna untuk SQLite baru di /tmp Vercel)
      const villageCount = await AdminDesa.count();
      if (villageCount === 0) {
        const bcrypt = (await import('bcryptjs')).default;
        const salt = await bcrypt.genSalt(10);
        const desaPasswordHash = await bcrypt.hash('desa123', salt);

        await AdminDesa.bulkCreate([
          {
            nama_desa: 'Desa Ciater',
            kecamatan: 'Kec. Ciater',
            kabupaten: 'Kab. Subang',
            provinsi: 'Jawa Barat',
            nama_pic: 'Hendra Gunawan',
            email: 'desa@subang.desa.id',
            password_hash: desaPasswordHash,
            status: 'approved',
          },
          {
            nama_desa: 'Kalijati Barat',
            kecamatan: 'Kec. Kalijati',
            kabupaten: 'Kab. Subang',
            provinsi: 'Jawa Barat',
            nama_pic: 'Asep Saepudin',
            email: 'desa@gmail.com',
            password_hash: desaPasswordHash,
            status: 'approved',
          },
          {
            nama_desa: 'Desa Sukamaju',
            kecamatan: 'Kec. Pagaden',
            kabupaten: 'Kab. Subang',
            provinsi: 'Jawa Barat',
            nama_pic: 'Ujang Suryana',
            email: 'ujang@sukamaju.desa.id',
            password_hash: desaPasswordHash,
            status: 'approved',
          },
          {
            nama_desa: 'Desa Bojongsoang',
            kecamatan: 'Kec. Subang',
            kabupaten: 'Kab. Subang',
            provinsi: 'Jawa Barat',
            nama_pic: 'Dede Kurnia',
            email: 'dede@bojongsoang.desa.id',
            password_hash: desaPasswordHash,
            status: 'pending',
          },
        ]);
        console.log('Auto-seed sample Admin Desa berhasil.');
      }
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


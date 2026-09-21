import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import villageManagementRoutes from './routes/villageManagementRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import hostedWebsiteRoutes from './routes/hostedWebsiteRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis dari direktori 'public' dan 'gambar'
app.use(express.static('public'));
app.use('/gambar', express.static('gambar'));

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

// Jalankan server dan hubungkan ke database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil dilakukan.');
    
    // Sinkronisasi model database
    await sequelize.sync();
    console.log('Sinkronisasi model database berhasil.');

    // Auto-seed default Admin BPS jika belum ada (berguna untuk SQLite baru di /tmp)
    try {
      const defaultEmail = 'admin@bps.go.id';
      const { AdminBps } = await import('./models/index.js');
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
    } catch (seedErr) {
      console.warn('Notice seeding admin:', seedErr.message);
    }
    
    // Hanya lakukan app.listen jika tidak berjalan di environment serverless Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server berjalan dalam mode ${process.env.NODE_ENV || 'development'} pada port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Gagal menghubungkan ke database atau menjalankan server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

startServer();
export default app;


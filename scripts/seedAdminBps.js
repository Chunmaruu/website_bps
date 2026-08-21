import bcrypt from 'bcryptjs';
import { sequelize, AdminBps } from '../models/index.js';

const seedAdminBps = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database terhubung untuk seeding.');

    // Melakukan sinkronisasi untuk memastikan tabel sudah terbuat
    await sequelize.sync();

    const defaultEmail = 'admin@bps.go.id';
    const defaultPassword = 'admin123';

    // Memeriksa apakah admin BPS default sudah ada
    const existingAdmin = await AdminBps.findOne({ where: { email: defaultEmail } });
    if (existingAdmin) {
      console.log(`Admin BPS dengan email "${defaultEmail}" sudah terdaftar.`);
      process.exit(0);
    }

    // Hash password default
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(defaultPassword, salt);

    // Membuat admin BPS baru
    await AdminBps.create({
      nama: 'Super Admin BPS',
      email: defaultEmail,
      password_hash,
      status: 'aktif',
    });

    console.log('--------------------------------------------------');
    console.log('Seeding Admin BPS Berhasil!');
    console.log(`Email    : ${defaultEmail}`);
    console.log(`Password : ${defaultPassword}`);
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Gagal melakukan seeding Admin BPS:', error);
    process.exit(1);
  }
};

seedAdminBps();

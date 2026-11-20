import bcrypt from 'bcryptjs';
import { sequelize, AdminBps } from '../models/index.js';

const seedAdminBps = async () => {
  try {
    const defaultEmail = process.env.ADMIN_BPS_EMAIL;
    const defaultPassword = process.env.ADMIN_BPS_PASSWORD;
    if (!defaultEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(defaultEmail) || !defaultPassword || defaultPassword.length < 5) {
      throw new Error('Isi ADMIN_BPS_EMAIL dan ADMIN_BPS_PASSWORD unik minimal 5 karakter.');
    }

    await sequelize.authenticate();
    console.log('Database terhubung untuk seeding.');

    // Melakukan sinkronisasi untuk memastikan tabel sudah terbuat
    await sequelize.sync();

    // Memeriksa apakah admin BPS default sudah ada
    const existingAdmin = await AdminBps.findOne({ where: { email: defaultEmail } });
    if (existingAdmin) {
      if (await bcrypt.compare('admin123', existingAdmin.password_hash)) {
        existingAdmin.password_hash = await bcrypt.hash(defaultPassword, 12);
        await existingAdmin.save();
        console.log('Password admin bawaan berhasil diganti.');
      } else {
        console.log('Admin sudah terdaftar; password yang bukan bawaan tidak diubah.');
      }
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

    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Gagal melakukan seeding Admin BPS:', error);
    process.exit(1);
  }
};

seedAdminBps();

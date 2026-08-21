import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminBps, AdminDesa } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_bps_village_gallery_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Registrasi akun Admin Desa baru
 */
export const registerDesa = async (req, res) => {
  try {
    const {
      nama_desa,
      kecamatan,
      kabupaten,
      provinsi,
      nama_pic,
      email,
      password,
    } = req.body;

    // Validasi input wajib
    if (!nama_desa || !kecamatan || !kabupaten || !provinsi || !nama_pic || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Semua field wajib diisi.',
      });
    }

    // Memeriksa apakah email sudah terdaftar di Admin Desa
    const existingDesa = await AdminDesa.findOne({ where: { email } });
    if (existingDesa) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar.',
      });
    }

    // Memeriksa apakah email sudah terdaftar di Admin BPS (mencegah bentrok email)
    const existingBps = await AdminBps.findOne({ where: { email } });
    if (existingBps) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah digunakan oleh akun BPS.',
      });
    }

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Membuat akun desa dengan status default 'approved' (langsung aktif)
    const newDesa = await AdminDesa.create({
      nama_desa,
      kecamatan,
      kabupaten,
      provinsi,
      nama_pic,
      email,
      password_hash,
      status: 'approved',
    });

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil! Akun desa Anda langsung aktif dan dapat digunakan untuk login.',
      data: {
        id: newDesa.id,
        nama_desa: newDesa.nama_desa,
        email: newDesa.email,
        status: newDesa.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat registrasi desa.',
      error: error.message,
    });
  }
};

/**
 * Login Admin Desa
 */
export const loginDesa = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cari desa berdasarkan email
    const desa = await AdminDesa.findOne({ where: { email } });
    if (!desa) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Bandingkan password
    const isMatch = await bcrypt.compare(password, desa.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Cek status akun desa
    if (desa.status === 'nonaktif') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun desa Anda dinonaktifkan sementara oleh Admin BPS. Silakan hubungi pihak BPS.',
      });
    }

    if (desa.status === 'rejected') {
      return res.status(403).json({
        status: 'error',
        message: 'Pendaftaran akun Anda ditolak oleh Admin BPS.',
      });
    }

    if (desa.status === 'pending') {
      return res.status(403).json({
        status: 'error',
        message: 'Pendaftaran akun Anda masih pending. Silakan tunggu persetujuan dari Admin BPS.',
      });
    }

    // Jika disetujui, generate token JWT
    const token = jwt.sign(
      { id: desa.id, role: 'desa' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      status: 'success',
      message: 'Login berhasil.',
      token,
      user: {
        id: desa.id,
        nama_desa: desa.nama_desa,
        email: desa.email,
        role: 'desa',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat login desa.',
      error: error.message,
    });
  }
};

/**
 * Login Admin BPS (Pusat)
 */
export const loginBps = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cari admin BPS berdasarkan email
    const bps = await AdminBps.findOne({ where: { email } });
    if (!bps) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Bandingkan password
    const isMatch = await bcrypt.compare(password, bps.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Cek status admin BPS
    if (bps.status === 'nonaktif') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun admin BPS Anda dinonaktifkan.',
      });
    }

    // Generate token JWT
    const token = jwt.sign(
      { id: bps.id, role: 'bps' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      status: 'success',
      message: 'Login Admin BPS berhasil.',
      token,
      user: {
        id: bps.id,
        nama: bps.nama,
        email: bps.email,
        role: 'bps',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat login admin BPS.',
      error: error.message,
    });
  }
};

/**
 * Mengambil data profil user yang sedang login (me)
 */
export const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'bps') {
      const bps = await AdminBps.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
      });
      if (!bps) {
        return res.status(404).json({
          status: 'error',
          message: 'Akun Admin BPS tidak ditemukan.',
        });
      }
      return res.json({
        status: 'success',
        user: {
          ...bps.toJSON(),
          role: 'bps',
        },
      });
    } else if (role === 'desa') {
      const desa = await AdminDesa.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
      });
      if (!desa) {
        return res.status(404).json({
          status: 'error',
          message: 'Akun Admin Desa tidak ditemukan.',
        });
      }
      return res.json({
        status: 'success',
        user: {
          ...desa.toJSON(),
          role: 'desa',
        },
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Role token tidak valid.',
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil profil user.',
      error: error.message,
    });
  }
};

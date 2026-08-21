import { AdminDesa } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Mendapatkan daftar seluruh akun desa (dengan filter status dan pencarian)
 */
export const getAllVillages = async (req, res) => {
  try {
    const { status, search } = req.query;
    const whereClause = {};

    // Filter berdasarkan status jika disediakan
    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'nonaktif'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Status tidak valid. Pilihan valid: ${validStatuses.join(', ')}`,
        });
      }
      whereClause.status = status;
    }

    // Filter pencarian berdasarkan kata kunci
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        { nama_desa: { [Op.like]: searchPattern } },
        { kecamatan: { [Op.like]: searchPattern } },
        { kabupaten: { [Op.like]: searchPattern } },
        { provinsi: { [Op.like]: searchPattern } },
        { nama_pic: { [Op.like]: searchPattern } },
        { email: { [Op.like]: searchPattern } },
      ];
    }

    const villages = await AdminDesa.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });

    res.json({
      status: 'success',
      total: villages.length,
      data: villages,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil daftar akun desa.',
      error: error.message,
    });
  }
};

/**
 * Mendapatkan detail akun desa berdasarkan ID
 */
export const getVillageById = async (req, res) => {
  try {
    const { id } = req.params;

    const village = await AdminDesa.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!village) {
      return res.status(404).json({
        status: 'error',
        message: 'Akun desa tidak ditemukan.',
      });
    }

    res.json({
      status: 'success',
      data: village,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil detail akun desa.',
      error: error.message,
    });
  }
};

/**
 * Mengubah status akun desa (Approval, Rejection, atau Aktivasi/Nonaktivasi)
 */
export const updateVillageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'nonaktif'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status wajib diisi dan harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }

    const village = await AdminDesa.findByPk(id);
    if (!village) {
      return res.status(404).json({
        status: 'error',
        message: 'Akun desa tidak ditemukan.',
      });
    }

    // Update status
    village.status = status;
    await village.save();

    res.json({
      status: 'success',
      message: `Status akun desa "${village.nama_desa}" berhasil diubah menjadi "${status}".`,
      data: {
        id: village.id,
        nama_desa: village.nama_desa,
        email: village.email,
        status: village.status,
        updated_at: village.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat memperbarui status akun desa.',
      error: error.message,
    });
  }
};

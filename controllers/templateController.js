import {
  fetchAllTemplatesFromSheet,
  appendTemplateToSheet,
  updateTemplateInSheet,
} from '../config/sheets.js';
import { Review } from '../models/index.js';

/**
 * Mendapatkan galeri templat (untuk publik/Admin Desa)
 * Menyaring hanya templat yang berstatus 'Aktif', dengan dukungan filter kategori dan pencarian kata kunci.
 */
export const getPublicTemplates = async (req, res) => {
  try {
    const { kategori, search, includeAll } = req.query;
    let templates = await fetchAllTemplatesFromSheet();

    // Jika pengguna bukan Admin BPS atau tidak meminta includeAll, hanya tampilkan yang berstatus 'Aktif'
    if (includeAll !== 'true' || !req.user || req.user.role !== 'bps') {
      templates = templates.filter(
        (t) => t.status && t.status.toLowerCase() === 'aktif'
      );
    }

    // Filter berdasarkan kategori jika diberikan
    if (kategori) {
      templates = templates.filter(
        (t) => t.kategori && t.kategori.toLowerCase() === kategori.toLowerCase()
      );
    }

    // Filter pencarian berdasarkan nama templat atau deskripsi
    if (search) {
      const searchLower = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          (t.nama_templat && t.nama_templat.toLowerCase().includes(searchLower)) ||
          (t.deskripsi && t.deskripsi.toLowerCase().includes(searchLower))
      );
    }

    // Ambil data review dari database SQLite untuk menghitung rating riil
    const allReviews = await Review.findAll();
    const reviewsByTemplate = {};
    for (const r of allReviews) {
      if (!reviewsByTemplate[r.template_id]) {
        reviewsByTemplate[r.template_id] = [];
      }
      reviewsByTemplate[r.template_id].push(r);
    }

    // Pasangkan data review & rating ke setiap templat
    templates = templates.map((t) => {
      const templateReviews = reviewsByTemplate[t.id] || [];
      const reviewCount = templateReviews.length;
      let avgRating = 5.0;
      if (reviewCount > 0) {
        const sum = templateReviews.reduce((acc, r) => acc + r.rating, 0);
        avgRating = parseFloat((sum / reviewCount).toFixed(1));
      }
      return {
        ...t,
        rating: avgRating,
        total_reviews: reviewCount,
      };
    });

    res.json({
      status: 'success',
      total: templates.length,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil galeri templat.',
      error: error.message,
    });
  }
};

/**
 * Mendapatkan detail satu templat berdasarkan ID
 */
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const templates = await fetchAllTemplatesFromSheet();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Templat tidak ditemukan.',
      });
    }

    const templateReviews = await Review.findAll({ where: { template_id: id } });
    const reviewCount = templateReviews.length;
    let avgRating = 5.0;
    if (reviewCount > 0) {
      const sum = templateReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = parseFloat((sum / reviewCount).toFixed(1));
    }

    res.json({
      status: 'success',
      data: {
        ...template,
        rating: avgRating,
        total_reviews: reviewCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil detail templat.',
      error: error.message,
    });
  }
};

/**
 * Menambahkan templat baru (Khusus Admin BPS)
 */
export const createTemplate = async (req, res) => {
  try {
    const {
      nama_templat,
      kategori,
      thumbnail_url,
      deskripsi,
      link_templat,
      tipe_database,
      sheet_id_referensi,
      status,
    } = req.body;

    if (!nama_templat || !kategori || !link_templat) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama templat, kategori, dan link templat wajib diisi.',
      });
    }

    // Generate ID unik jika tidak diberikan
    const id = `TPL-${Date.now().toString().slice(-6)}`;

    const newTemplate = {
      id,
      nama_templat,
      kategori,
      thumbnail_url: thumbnail_url || '',
      deskripsi: deskripsi || '',
      link_templat,
      tipe_database: tipe_database || 'Statis',
      sheet_id_referensi: sheet_id_referensi || '',
      status: status || 'Aktif',
    };

    const saved = await appendTemplateToSheet(newTemplate);

    res.status(201).json({
      status: 'success',
      message: 'Templat baru berhasil ditambahkan dan disimpan ke Google Spreadsheet Master.',
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat menambah templat baru.',
      error: error.message,
    });
  }
};

/**
 * Memperbarui data templat (Khusus Admin BPS)
 */
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await updateTemplateInSheet(id, updateData);
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: `Templat dengan ID "${id}" tidak ditemukan atau gagal diperbarui.`,
      });
    }

    res.json({
      status: 'success',
      message: `Templat "${id}" berhasil diperbarui di Google Spreadsheet Master.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat memperbarui templat.',
      error: error.message,
    });
  }
};

/**
 * Memperbarui status templat saja (Aktif / Nonaktif / Draft) - Khusus Admin BPS
 */
export const updateTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Aktif', 'Nonaktif', 'Draft'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status wajib diisi dan harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await updateTemplateInSheet(id, { status });
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: `Templat dengan ID "${id}" tidak ditemukan.`,
      });
    }

    res.json({
      status: 'success',
      message: `Status templat "${id}" berhasil diubah menjadi "${status}".`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengubah status templat.',
      error: error.message,
    });
  }
};

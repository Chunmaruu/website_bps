import {
  fetchAllHostedWebsitesFromSheet,
  appendHostedWebsiteToSheet,
} from '../config/sheets.js';

/**
 * Mengambil daftar website desa yang sudah hosting / online di Kab. Subang
 * Menyaring hanya website yang berstatus 'Aktif', dengan dukungan filter pencarian dan kategori/kecamatan.
 */
export const getHostedWebsites = async (req, res) => {
  try {
    const { kategori, kecamatan, search, includeAll } = req.query;
    let sites = await fetchAllHostedWebsitesFromSheet();

    // Jika bukan admin BPS atau tidak meminta includeAll, tampilkan hanya yang Aktif
    if (includeAll !== 'true' || !req.user || req.user.role !== 'bps') {
      sites = sites.filter(
        (s) => s.status && s.status.toLowerCase() === 'aktif'
      );
    }

    // Filter kategori jika ada
    if (kategori) {
      sites = sites.filter(
        (s) => s.kategori && s.kategori.toLowerCase() === kategori.toLowerCase()
      );
    }

    // Filter kecamatan jika ada
    if (kecamatan) {
      sites = sites.filter(
        (s) => s.kecamatan && s.kecamatan.toLowerCase().includes(kecamatan.toLowerCase())
      );
    }

    // Filter pencarian berdasarkan nama desa, kecamatan, atau nama templat
    if (search) {
      const searchLower = search.toLowerCase();
      sites = sites.filter(
        (s) =>
          (s.nama_desa && s.nama_desa.toLowerCase().includes(searchLower)) ||
          (s.kecamatan && s.kecamatan.toLowerCase().includes(searchLower)) ||
          (s.nama_templat && s.nama_templat.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      status: 'success',
      total: sites.length,
      data: sites,
    });
  } catch (error) {
    console.error('Error fetching hosted websites:', error);
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data website desa yang sudah hosting.',
      error: error.message,
    });
  }
};

/**
 * Menambahkan data website desa yang baru selesai di-hosting (Khusus Admin BPS)
 */
export const createHostedWebsite = async (req, res) => {
  try {
    const {
      nama_desa,
      kecamatan,
      kategori,
      nama_templat,
      link_hosting,
      thumbnail_url,
      tipe_database,
      status,
    } = req.body;

    if (!nama_desa || !kecamatan || !link_hosting) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama desa, kecamatan, dan link website hosting wajib diisi.',
      });
    }

    const newId = `WEB-${Date.now().toString().slice(-6)}`;
    const newSite = {
      id: newId,
      nama_desa: nama_desa.trim(),
      kecamatan: kecamatan.trim(),
      kategori: (kategori || 'Desa Agraris').trim(),
      nama_templat: (nama_templat || 'Standar BPS Subang').trim(),
      link_hosting: link_hosting.trim(),
      thumbnail_url: (thumbnail_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600').trim(),
      tipe_database: tipe_database === 'Spreadsheet' ? 'Spreadsheet' : 'Statis',
      status: status || 'Aktif',
    };

    const savedSite = await appendHostedWebsiteToSheet(newSite);

    res.status(201).json({
      status: 'success',
      message: 'Website desa hosting berhasil ditambahkan ke direktori.',
      data: savedSite,
    });
  } catch (error) {
    console.error('Error creating hosted website:', error);
    res.status(500).json({
      status: 'error',
      message: 'Gagal menambahkan website desa hosting.',
      error: error.message,
    });
  }
};

import 'dotenv/config';
import {
  ensureHeaderRow,
  isGoogleSheetsConfigured,
  appendTemplateToSheet,
  fetchAllTemplatesFromSheet,
} from '../config/sheets.js';

const initSpreadsheet = async () => {
  console.log('================================================--');
  console.log(' PENYIAPAN GOOGLE SPREADSHEET MASTER');
  console.log('================================================--');
  console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID || '1SBE8QE_ICEvizjMHDH6kTur0tsdiuZ0zIqqKlfiyQJM');

  if (!isGoogleSheetsConfigured()) {
    console.log('\n[INFO] Kredensial Service Account belum diisi penuh di .env.');
    console.log('Untuk menghubungkan spreadsheet asli secara otomatis:');
    console.log('1. Buat Service Account di Google Cloud Console.');
    console.log('2. Masukkan GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY ke file .env.');
    console.log('3. Bagikan (Share) Google Spreadsheet ke email Service Account dengan peran EDITOR.');
    console.log('\n[OK] Sistem backend akan tetap berjalan penuh menggunakan fallback data lokal.');
    console.log('================================================--');
    process.exit(0);
  }

  console.log('\nMenyiapkan header kolom di Google Spreadsheet...');
  const success = await ensureHeaderRow();
  if (success) {
    console.log('✓ Baris Header (A1:I1) berhasil dibuat pada tab "Templates"!');
    
    const existing = await fetchAllTemplatesFromSheet();
    if (existing.length === 0) {
      console.log('Menyisipkan sampel templat awal ke Google Spreadsheet...');
      await appendTemplateToSheet({
        id: 'TPL-001',
        nama_templat: 'Desa Wisata Modern',
        kategori: 'Desa Wisata',
        thumbnail_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
        deskripsi: 'Templat modern khusus untuk desa wisata dengan keindahan alam dan paket homestay.',
        link_templat: 'https://preview-desa-wisata.example.com',
        tipe_database: 'Statis',
        sheet_id_referensi: '',
        status: 'Aktif',
      });
      console.log('✓ Sampel templat awal berhasil ditambahkan!');
    }
  } else {
    console.log('× Gagal menulis ke Google Spreadsheet. Pastikan email Service Account diberi akses Editor pada spreadsheet.');
  }

  console.log('================================================--');
  process.exit(0);
};

initSpreadsheet();

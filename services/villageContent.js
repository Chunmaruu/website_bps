import { google } from 'googleapis';
import { WebsiteError } from './websiteError.js';
import { MICRO_PORTAL_TEMPLATE_ID, MICRO_PORTAL_RANGES, validateMicroPortalContent } from './microPortalContent.js';

export { WebsiteError } from './websiteError.js';

export const TEMPLATE_ID = 'desa-informatif-v1';
export const SCHEMA = {
  Profil: ['kunci', 'nilai'],
  Perangkat: ['nama', 'jabatan'],
  Berita: ['judul', 'tanggal', 'isi'],
  Potensi: ['nama', 'deskripsi'],
  Statistik: ['indikator', 'nilai', 'satuan', 'tahun'],
};

export function spreadsheetId(input) {
  if (typeof input !== 'string') throw new WebsiteError('Masukkan link Google Sheets yang valid.');
  try {
    const url = new URL(input.trim());
    const match = url.pathname.match(/^\/spreadsheets\/d\/([\w-]{20,100})(?:\/|$)/);
    if (url.protocol === 'https:' && url.hostname === 'docs.google.com' && match) return match[1];
  } catch {}
  throw new WebsiteError('Gunakan link https://docs.google.com/spreadsheets/d/...');
}

export function validateContent(valueRanges, code) {
  const tables = {};
  Object.entries(SCHEMA).forEach(([tab, headers], i) => {
    const rows = valueRanges[i]?.values || [];
    if (rows.length > 501) throw new WebsiteError(`Tab ${tab} maksimal 500 baris data.`);
    if (!headers.every((header, j) => String(rows[0]?.[j] || '').trim() === header)) {
      throw new WebsiteError(`Header tab ${tab} harus: ${headers.join(', ')}.`);
    }
    tables[tab] = rows.slice(1).filter(row => row.some(cell => String(cell).trim())).map((row, n) => {
      const record = {};
      headers.forEach((key, j) => {
        const value = String(row[j] ?? '').trim();
        if (value.length > 10000) throw new WebsiteError(`Isi ${tab}, baris ${n + 2} terlalu panjang.`);
        record[key] = value;
      });
      if (!record[headers[0]]) throw new WebsiteError(`Isi ${headers[0]} pada tab ${tab}, baris ${n + 2}.`);
      return record;
    });
  });
  const profile = {};
  const allowed = ['kode_koneksi', 'nama_desa', 'kecamatan', 'kabupaten', 'provinsi', 'deskripsi', 'alamat', 'email', 'telepon'];
  for (const row of tables.Profil) {
    if (!allowed.includes(row.kunci)) throw new WebsiteError(`Kunci Profil tidak dikenal: ${row.kunci}.`);
    if (Object.hasOwn(profile, row.kunci)) throw new WebsiteError(`Kunci Profil berulang: ${row.kunci}.`);
    profile[row.kunci] = row.nilai;
  }
  if (profile.kode_koneksi !== code) throw new WebsiteError('Kode koneksi tidak sesuai. Salin kode dari Website Saya ke baris kode_koneksi di tab Profil.');
  for (const key of ['nama_desa', 'kecamatan', 'kabupaten', 'provinsi', 'deskripsi']) {
    if (!profile[key]) throw new WebsiteError(`Isi ${key} pada tab Profil terlebih dahulu.`);
  }
  delete profile.kode_koneksi;
  for (const news of tables.Berita) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(news.tanggal) || Number.isNaN(Date.parse(news.tanggal)) || new Date(news.tanggal).toISOString().slice(0, 10) !== news.tanggal || !news.isi) {
      throw new WebsiteError('Berita wajib memiliki isi dan tanggal valid berformat YYYY-MM-DD (gunakan format teks di Sheets).');
    }
  }
  for (const row of tables.Statistik) {
    if (!/^\d+(\.\d+)?$/.test(row.nilai) || !/^\d{4}$/.test(row.tahun) || !row.satuan) throw new WebsiteError('Statistik memerlukan nilai angka positif, satuan, dan tahun empat digit.');
  }
  return { profile, perangkat: tables.Perangkat, berita: tables.Berita, potensi: tables.Potensi, statistik: tables.Statistik };
}

export function sheetsConnection() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const key = process.env.GOOGLE_PRIVATE_KEY || '';
  const configured = email.includes('@') && key.includes('BEGIN PRIVATE KEY') && !key.includes('your_private_key');
  return { configured, email: configured ? email : null };
}

export async function readVillageContent(id, code, templateId = TEMPLATE_ID) {
  if (!sheetsConnection().configured) throw new WebsiteError('Koneksi Google Sheets belum diaktifkan oleh pengelola platform. Konfigurasi tersimpan; hubungi pengelola untuk mengaktifkan sinkronisasi.', 503);
  const microPortal = templateId === MICRO_PORTAL_TEMPLATE_ID;
  const ranges = microPortal ? MICRO_PORTAL_RANGES : Object.keys(SCHEMA).map(tab => `'${tab}'!A:E`);
  const validate = microPortal ? validateMicroPortalContent : validateContent;
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const result = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: id,
      ranges,
      valueRenderOption: 'FORMATTED_VALUE',
    }, { timeout: 20000, retry: false });
    return validate(result.data.valueRanges || [], code);
  } catch (error) {
    if (error instanceof WebsiteError) throw error;
    const status = Number(error.code || error.response?.status);
    if ([403, 404].includes(status)) throw new WebsiteError('Spreadsheet tidak dapat dibaca. Periksa link dan bagikan file kepada email layanan dengan akses Pelihat.');
    if (status === 400) throw new WebsiteError('Tab spreadsheet belum lengkap. Cocokkan nama tab dengan format spreadsheet untuk templat yang dipilih.');
    throw new WebsiteError('Google Sheets sedang tidak dapat dihubungi. Coba sinkronkan lagi; website terbit tetap memakai data terakhir.', 502);
  }
}

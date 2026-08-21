import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const getSpreadsheetId = () => process.env.GOOGLE_SHEET_ID || '1SBE8QE_ICEvizjMHDH6kTur0tsdiuZ0zIqqKlfiyQJM';
const TAB_NAME = 'Templates';

// In-memory fallback data templat untuk pengujian lokal saat kredensial API belum diisi
let localTemplatesFallback = [
  {
    id: 'TPL-001',
    nama_templat: 'Desa Wisata Modern',
    kategori: 'Desa Wisata',
    thumbnail_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
    deskripsi: 'Templat modern khusus untuk desa wisata dengan keindahan alam, destinasi turis, dan paket homestay.',
    link_templat: 'https://preview-desa-wisata.example.com',
    tipe_database: 'Statis',
    sheet_id_referensi: '',
    status: 'Aktif',
  },
  {
    id: 'TPL-002',
    nama_templat: 'Desa Agraris Mandiri',
    kategori: 'Desa Agraris',
    thumbnail_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?w=600',
    deskripsi: 'Templat responsif untuk desa pertanian dan perkebunan dengan katalog hasil panen.',
    link_templat: 'https://preview-desa-agraris.example.com',
    tipe_database: 'Spreadsheet',
    sheet_id_referensi: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
    status: 'Aktif',
  },
  {
    id: 'TPL-003',
    nama_templat: 'Desa Maritim Jaya',
    kategori: 'Desa Maritim',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    deskripsi: 'Templat interaktif untuk desa pesisir pantai dan perikanan.',
    link_templat: 'https://preview-desa-maritim.example.com',
    tipe_database: 'Statis',
    sheet_id_referensi: '',
    status: 'Aktif',
  },
];

/**
 * Memeriksa apakah kredensial Service Account Google API sudah diisi secara valid
 */
export const isGoogleSheetsConfigured = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  return (
    email &&
    email !== 'your_service_account_email_here' &&
    privateKey &&
    !privateKey.includes('your_private_key_here')
  );
};

/**
 * Mengambil instance Google Sheets API client
 */
const getSheetsClient = () => {
  if (!isGoogleSheetsConfigured()) {
    return null;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT(
    email,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth });
};

/**
 * Mendapatkan seluruh baris templat dari tab 'Templates'
 */
export const fetchAllTemplatesFromSheet = async () => {
  const sheets = getSheetsClient();
  if (!sheets) {
    console.log('[Google Sheets] Kredensial API belum dikonfigurasi. Menggunakan data fallback lokal.');
    return localTemplatesFallback;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${TAB_NAME}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const dataRows = rows.slice(1);
    return dataRows
      .filter((row) => row && row[0] && !row[0].toLowerCase().includes('contoh') && row[1])
      .map((row) => ({
        id: (row[0] || '').trim(),
        nama_templat: (row[1] || '').trim(),
        kategori: (row[2] || '').trim(),
        thumbnail_url: (row[3] || '').trim(),
        deskripsi: (row[4] || '').trim(),
        link_templat: (row[5] || '').trim(),
        tipe_database: (row[6] || 'Statis').trim(),
        sheet_id_referensi: (row[7] || '').trim(),
        status: (row[8] || 'Aktif').trim(),
      }));
  } catch (error) {
    console.error('[Google Sheets API Error]:', error.message);
    console.log('[Google Sheets] Menggunakan data fallback lokal.');
    return localTemplatesFallback;
  }
};

/**
 * Menambahkan templat baru ke Google Sheets
 */
export const appendTemplateToSheet = async (templateData) => {
  const sheets = getSheetsClient();
  
  const newRow = [
    templateData.id,
    templateData.nama_templat,
    templateData.kategori,
    templateData.thumbnail_url,
    templateData.deskripsi,
    templateData.link_templat,
    templateData.tipe_database || 'Statis',
    templateData.sheet_id_referensi || '',
    templateData.status || 'Aktif',
  ];

  if (!sheets) {
    localTemplatesFallback.push(templateData);
    return templateData;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `${TAB_NAME}!A:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });
    return templateData;
  } catch (error) {
    console.error('[Google Sheets API Append Error]:', error.message);
    localTemplatesFallback.push(templateData);
    return templateData;
  }
};

/**
 * Memperbarui templat di Google Sheets berdasarkan ID
 */
export const updateTemplateInSheet = async (id, updatedData) => {
  const sheets = getSheetsClient();

  if (!sheets) {
    const index = localTemplatesFallback.findIndex((t) => t.id === id);
    if (index !== -1) {
      localTemplatesFallback[index] = { ...localTemplatesFallback[index], ...updatedData };
      return localTemplatesFallback[index];
    }
    return null;
  }

  try {
    const allTemplates = await fetchAllTemplatesFromSheet();
    const index = allTemplates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const rowIndex = index + 2; // +1 offset header, +1 karena 1-based index
    const existing = allTemplates[index];
    const merged = { ...existing, ...updatedData };

    const updatedRow = [
      merged.id,
      merged.nama_templat,
      merged.kategori,
      merged.thumbnail_url,
      merged.deskripsi,
      merged.link_templat,
      merged.tipe_database,
      merged.sheet_id_referensi,
      merged.status,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${TAB_NAME}!A${rowIndex}:I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    return merged;
  } catch (error) {
    console.error('[Google Sheets API Update Error]:', error.message);
    return null;
  }
};

/**
 * Menyiapkan baris header awal di Google Spreadsheet jika belum ada
 */
export const ensureHeaderRow = async () => {
  const sheets = getSheetsClient();
  if (!sheets) return false;

  try {
    const header = [
      'id',
      'nama_templat',
      'kategori',
      'thumbnail_url',
      'deskripsi',
      'link_templat',
      'tipe_database',
      'sheet_id_referensi',
      'status',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${TAB_NAME}!A1:I1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [header],
      },
    });

    return true;
  } catch (error) {
    console.error('[Google Sheets API EnsureHeader Error]:', error.message);
    return false;
  }
};

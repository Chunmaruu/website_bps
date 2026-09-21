import dotenv from 'dotenv';

dotenv.config();

const getSpreadsheetId = () => process.env.GOOGLE_SHEET_ID || '1SBE8QE_ICEvizjMHDH6kTur0tsdiuZ0zIqqKlfiyQJM';
const getGoogleScriptUrl = () => process.env.GOOGLE_SCRIPT_URL;
const TAB_NAME = 'Templates';
const TAB_NAME_HOSTED = 'WebDesa';

// In-memory fallback data templat untuk pengujian lokal saat offline
let localTemplatesFallback = [
  {
    id: 'TPL-001',
    nama_templat: 'Desa Wisata Ciater Subang',
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
    nama_templat: 'Desa Agraris Subang Makmur',
    kategori: 'Desa Agraris',
    thumbnail_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?w=600',
    deskripsi: 'Templat responsif untuk desa perkebunan nanas dan pertanian terintegrasi database panen.',
    link_templat: 'https://preview-desa-agraris.example.com',
    tipe_database: 'Spreadsheet',
    sheet_id_referensi: '1AbCdEfGhIjKlMnOpQrStUv',
    status: 'Aktif',
  },
  {
    id: 'TPL-003',
    nama_templat: 'Desa Pesisir Pantura Subang',
    kategori: 'Desa Maritim',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    deskripsi: 'Templat interaktif untuk sentra pelelangan ikan dan hasil laut pantura Subang.',
    link_templat: 'https://preview-desa-maritim.example.com',
    tipe_database: 'Statis',
    sheet_id_referensi: '',
    status: 'Aktif',
  },
  {
    id: 'TPL-004',
    nama_templat: 'Desa Digital Smart Subang',
    kategori: 'Desa Digital',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    deskripsi: 'Templat pelayanan administrasi online, surat menyurat digital, dan statistik kependudukan desa.',
    link_templat: 'https://preview-desa-digital.example.com',
    tipe_database: 'Spreadsheet',
    sheet_id_referensi: '1ZyxWvUtSrQpOnMlKjIhGfEd',
    status: 'Aktif',
  },
  {
    id: 'TPL-005',
    nama_templat: 'Desa Cantik Cinta Statistik Subang',
    kategori: 'Desa Statistik',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
    deskripsi: 'Templat portal desa terintegrasi portal statistik sektoral, Satu Data Indonesia, visualisasi infografis kependudukan, dan monografi desa BPS.',
    link_templat: 'https://preview-desa-cantik.example.com',
    tipe_database: 'Spreadsheet',
    sheet_id_referensi: '',
    status: 'Aktif',
  },
];

// In-memory fallback data website desa yang sudah hosting / online di Kab. Subang
let localHostedWebsitesFallback = [
  {
    id: 'WEB-001',
    nama_desa: 'Desa Ciater',
    kecamatan: 'Kec. Ciater',
    kategori: 'Desa Wisata',
    nama_templat: 'Desa Wisata Ciater Subang',
    link_hosting: 'https://desaciater.subang.go.id',
    thumbnail_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
    tipe_database: 'Statis',
    status: 'Aktif',
  },
  {
    id: 'WEB-002',
    nama_desa: 'Desa Jalancagak',
    kecamatan: 'Kec. Jalancagak',
    kategori: 'Desa Agraris',
    nama_templat: 'Desa Agraris Subang Makmur',
    link_hosting: 'https://jalancagak.desa.id',
    thumbnail_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?w=600',
    tipe_database: 'Spreadsheet',
    status: 'Aktif',
  },
  {
    id: 'WEB-003',
    nama_desa: 'Desa Blanakan',
    kecamatan: 'Kec. Blanakan',
    kategori: 'Desa Maritim',
    nama_templat: 'Desa Pesisir Pantura Subang',
    link_hosting: 'https://blanakan.subang.desa.id',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    tipe_database: 'Statis',
    status: 'Aktif',
  },
  {
    id: 'WEB-004',
    nama_desa: 'Desa Kasomalang Kulon',
    kecamatan: 'Kec. Kasomalang',
    kategori: 'Desa Digital',
    nama_templat: 'Desa Digital Smart Subang',
    link_hosting: 'https://kasomalangkulon.desa.id',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    tipe_database: 'Spreadsheet',
    status: 'Aktif',
  },
  {
    id: 'WEB-005',
    nama_desa: 'Desa Cibogo',
    kecamatan: 'Kec. Cibogo',
    kategori: 'Desa Agraris',
    nama_templat: 'Desa templat 1',
    link_hosting: 'https://desacantik-cibogo.vercel.app/',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=601',
    tipe_database: 'Spreadsheet',
    status: 'Aktif',
  },
  {
    id: 'WEB-006',
    nama_desa: 'Desa Cibeusi',
    kecamatan: 'Kec. Ciater',
    kategori: 'Desa Statistik',
    nama_templat: 'Desa Cantik Cinta Statistik Subang',
    link_hosting: 'https://cibeusi.desa.id',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
    tipe_database: 'Spreadsheet',
    status: 'Aktif',
  },
];

/**
 * Memeriksa apakah kredensial Google Sheets API atau Google Apps Script sudah dikonfigurasi
 */
export const isGoogleSheetsConfigured = () => {
  if (getGoogleScriptUrl()) return true;
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
 * Mengambil instance Google Sheets API client (jika memakai Service Account)
 */
const getSheetsClient = async () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || email === 'your_service_account_email_here' || !privateKey || privateKey.includes('your_private_key_here')) {
    return null;
  }
  const { google } = await import('googleapis');
  privateKey = privateKey.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT(
    email,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
};

/**
 * Mendapatkan seluruh baris templat (Prioritas: Google Apps Script API -> Service Account -> Fallback)
 */
export const fetchAllTemplatesFromSheet = async () => {
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, { redirect: 'follow' });
      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        return json.data.map((row) => ({
          id: (row.id || '').trim(),
          nama_templat: (row.nama_templat || '').trim(),
          kategori: (row.kategori || '').trim(),
          thumbnail_url: (row.thumbnail_url || '').trim(),
          deskripsi: (row.deskripsi || '').trim(),
          link_templat: (row.link_templat || '').trim(),
          tipe_database: (row.tipe_database || 'Statis').trim(),
          sheet_id_referensi: (row.sheet_id_referensi || '').trim(),
          status: (row.status || 'Aktif').trim(),
        }));
      }
    } catch (err) {
      console.error('[Google Apps Script Fetch Error]:', err.message);
    }
  }

  // Fallback 1: Google Sheets API v4 (Service Account)
  const sheets = await getSheetsClient();
  if (sheets) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `${TAB_NAME}!A:I`,
      });
      const rows = response.data.values;
      if (rows && rows.length > 1) {
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
      }
    } catch (error) {
      console.error('[Google Sheets API Error]:', error.message);
    }
  }

  console.log('[Google Sheets] Menggunakan data fallback lokal.');
  return localTemplatesFallback;
};

/**
 * Menambahkan templat baru ke Google Sheets (Prioritas: Google Apps Script API -> Service Account -> Fallback)
 */
export const appendTemplateToSheet = async (templateData) => {
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'create',
          data: templateData,
        }),
        redirect: 'follow',
      });
      const json = await response.json();
      if (json.status === 'success') {
        return templateData;
      }
    } catch (err) {
      console.error('[Google Apps Script Append Error]:', err.message);
    }
  }

  const sheets = await getSheetsClient();
  if (sheets) {
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
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: `${TAB_NAME}!A:I`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
      return templateData;
    } catch (error) {
      console.error('[Google Sheets API Append Error]:', error.message);
    }
  }

  localTemplatesFallback.push(templateData);
  return templateData;
};

/**
 * Memperbarui status / templat di Google Sheets (Prioritas: Google Apps Script API -> Service Account -> Fallback)
 */
export const updateTemplateInSheet = async (id, updatedData) => {
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      if (updatedData.status) {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateStatus',
            id,
            status: updatedData.status,
          }),
          redirect: 'follow',
        });
        const json = await response.json();
        if (json.status === 'success') {
          return { id, ...updatedData };
        }
      }
    } catch (err) {
      console.error('[Google Apps Script Update Error]:', err.message);
    }
  }

  const sheets = await getSheetsClient();
  if (sheets) {
    try {
      const allTemplates = await fetchAllTemplatesFromSheet();
      const index = allTemplates.findIndex((t) => t.id === id);
      if (index !== -1) {
        const rowIndex = index + 2;
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
          requestBody: { values: [updatedRow] },
        });
        return merged;
      }
    } catch (error) {
      console.error('[Google Sheets API Update Error]:', error.message);
    }
  }

  const index = localTemplatesFallback.findIndex((t) => t.id === id);
  if (index !== -1) {
    localTemplatesFallback[index] = { ...localTemplatesFallback[index], ...updatedData };
    return localTemplatesFallback[index];
  }
  return null;
};

export const ensureHeaderRow = async () => {
  return true;
};

/**
 * Mendapatkan seluruh daftar website desa yang sudah hosting / online
 * (Prioritas: Google Apps Script API dengan ?sheet=WebDesa -> Google Sheets API v4 -> Fallback Lokal)
 */
export const fetchAllHostedWebsitesFromSheet = async () => {
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      const urlWithParam = scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'sheet=WebDesa';
      const response = await fetch(urlWithParam, { redirect: 'follow' });
      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        // Validasi apakah respons benar-benar berisi data sheet WebDesa (bukan sheet Templates)
        const validHosted = json.data.filter((row) => (row.nama_desa && row.nama_desa.trim() !== '') || (row.link_hosting && row.link_hosting.trim() !== ''));
        if (validHosted.length > 0) {
          return validHosted.map((row) => ({
            id: (row.id || '').trim(),
            nama_desa: (row.nama_desa || '').trim(),
            kecamatan: (row.kecamatan || '').trim(),
            kategori: (row.kategori || '').trim(),
            nama_templat: (row.nama_templat || '').trim(),
            link_hosting: (row.link_hosting || row.link || '').trim(),
            thumbnail_url: (row.thumbnail_url || '').trim(),
            tipe_database: (row.tipe_database || 'Statis').trim(),
            status: (row.status || 'Aktif').trim(),
          }));
        }
      }
    } catch (err) {
      console.error('[Google Apps Script Hosted Fetch Error]:', err.message);
    }
  }

  // Fallback 1: Google Sheets API v4 (Service Account)
  const sheets = await getSheetsClient();
  if (sheets) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `${TAB_NAME_HOSTED}!A:I`,
      });
      const rows = response.data.values;
      if (rows && rows.length > 1) {
        const dataRows = rows.slice(1);
        return dataRows
          .filter((row) => row && row[0] && row[1])
          .map((row) => ({
            id: (row[0] || '').trim(),
            nama_desa: (row[1] || '').trim(),
            kecamatan: (row[2] || '').trim(),
            kategori: (row[3] || '').trim(),
            nama_templat: (row[4] || '').trim(),
            link_hosting: (row[5] || '').trim(),
            thumbnail_url: (row[6] || '').trim(),
            tipe_database: (row[7] || 'Statis').trim(),
            status: (row[8] || 'Aktif').trim(),
          }));
      }
    } catch (error) {
      console.error('[Google Sheets API Hosted Error]:', error.message);
    }
  }

  console.log('[Google Sheets] Menggunakan data fallback website desa hosting.');
  return localHostedWebsitesFallback;
};

/**
 * Menambahkan data website desa yang sudah hosting ke Google Sheets
 */
export const appendHostedWebsiteToSheet = async (hostedData) => {
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'createHosted',
          sheet: 'WebDesa',
          data: hostedData,
        }),
        redirect: 'follow',
      });
      const json = await response.json();
      if (json.status === 'success') {
        return hostedData;
      }
    } catch (err) {
      console.error('[Google Apps Script Append Hosted Error]:', err.message);
    }
  }

  const sheets = await getSheetsClient();
  if (sheets) {
    const newRow = [
      hostedData.id,
      hostedData.nama_desa,
      hostedData.kecamatan,
      hostedData.kategori,
      hostedData.nama_templat,
      hostedData.link_hosting,
      hostedData.thumbnail_url || '',
      hostedData.tipe_database || 'Statis',
      hostedData.status || 'Aktif',
    ];
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: `${TAB_NAME_HOSTED}!A:I`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
      return hostedData;
    } catch (error) {
      console.error('[Google Sheets API Append Hosted Error]:', error.message);
    }
  }

  localHostedWebsitesFallback.push(hostedData);
  return hostedData;
};

import { WebsiteError } from './websiteError.js';

export const MICRO_PORTAL_TEMPLATE_ID = 'micro-portal-desa-v1';

export const MICRO_PORTAL_SCHEMA = {
  identitas: ['namaDesa', 'kecamatan', 'kabupaten', 'provinsi', 'kodeDesa', 'deskripsi', 'alamatKantor', 'email', 'telepon', 'kode_koneksi'],
  statistikMakro: ['totalPenduduk', 'luasWilayah', 'kepadatanPenduduk', 'jumlahRt', 'jumlahRw', 'jumlahKk'],
  potensiDesa: ['id', 'judulPotensi', 'kategori', 'deskripsi', 'lokasi', 'nilaiEkonomi', 'pengelola', 'urlFoto', 'deskripsiLengkap', 'keunggulanUtama', 'kontakPengelola'],
  mataPencaharian: ['kategori', 'jumlah', 'persentase'],
  dokumenPublikasi: ['id', 'judul', 'kategori', 'tahun', 'ukuran', 'deskripsi', 'urlDrive'],
  statusPenduduk: ['totalPenduduk', 'lakiLaki', 'perempuan', 'rasioJenisKelamin'],
  statistikSosial: ['pendudukMiskin', 'penerimaBansos', 'pendidikanDominan', 'fasilitasPendidikan', 'fasilitasKesehatan', 'penyandangDisabilitas'],
  statistikEkonomi: ['jumlahUmkm', 'jenisUsahaDominan', 'saranaPerdagangan', 'pendapatanRataRata', 'hargaKomoditasUtama', 'angkatanKerja'],
  pertanianPeternakan: ['luasLahanPertanian', 'luasPanen', 'produksiPadi', 'produksiJagung', 'produksiBawangMerah', 'produksiSayuran', 'produksiBuah', 'jumlahTernak', 'produksiTelurDaging', 'jumlahKelompokTani'],
};

const listTabFields = { potensiDesa: 'judulPotensi', mataPencaharian: 'kategori', dokumenPublikasi: 'judul' };
const optionalHeaders = new Set(['deskripsiLengkap', 'keunggulanUtama', 'kontakPengelola']);
const requiredIdentity = ['namaDesa', 'kecamatan', 'kabupaten', 'provinsi', 'deskripsi'];
const linkFields = new Set(['urlFoto', 'urlDrive']);
const maxListRows = 500;
const maxDataBytes = 512 * 1024;

// Read one extra row to detect overflow. Read only the columns used by the template.
export const MICRO_PORTAL_RANGES = Object.entries(MICRO_PORTAL_SCHEMA).map(([tab, headers]) => {
  const endColumn = String.fromCharCode(64 + headers.length);
  const endRow = Object.hasOwn(listTabFields, tab) ? maxListRows + 2 : 3;
  return `'${tab}'!A1:${endColumn}${endRow}`;
});

const cellText = value => String(value ?? '').trim();

function validateUrl(value, field, tab, rowNumber) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {}
  throw new WebsiteError(`Gunakan link HTTPS untuk ${field} di tab ${tab}, baris ${rowNumber}.`);
}

export function validateMicroPortalContent(valueRanges, code) {
  const data = {};
  Object.entries(MICRO_PORTAL_SCHEMA).forEach(([tab, headers], index) => {
    const rows = valueRanges[index]?.values || [];
    const columnNames = (rows[0] || []).map(cellText);
    for (const header of headers) {
      const column = columnNames.indexOf(header);
      if (column < 0 && !optionalHeaders.has(header)) {
        throw new WebsiteError(`Kolom ${header} belum ada di baris 1 tab ${tab}. Gunakan spreadsheet templat Micro-Portal.`);
      }
      if (column >= 0 && columnNames.lastIndexOf(header) !== column) {
        throw new WebsiteError(`Kolom ${header} muncul lebih dari satu kali di tab ${tab}.`);
      }
    }

    const requiredField = listTabFields[tab];
    const maxRows = requiredField ? maxListRows : 1;
    const fields = headers.map(field => [field, columnNames.indexOf(field)]).filter(([, column]) => column >= 0);
    const records = [];
    rows.slice(1).forEach((row, indexFromDataStart) => {
      const rowNumber = indexFromDataStart + 2;
      const record = {};
      for (const [field, column] of fields) {
        const value = cellText(row[column]);
        if (value.length > 4000) throw new WebsiteError(`Isi ${field} di tab ${tab}, baris ${rowNumber}, maksimal 4.000 karakter.`);
        if (value) record[field] = linkFields.has(field) ? validateUrl(value, field, tab, rowNumber) : value;
      }
      if (!Object.keys(record).length) return;
      if (rowNumber > maxRows + 1) {
        throw new WebsiteError(requiredField ? `Tab ${tab} maksimal ${maxListRows} baris data.` : `Isi data tab ${tab} pada baris 2 saja.`);
      }
      if (requiredField && !record[requiredField]) throw new WebsiteError(`Isi ${requiredField} di tab ${tab}, baris ${rowNumber}.`);
      records.push(record);
    });
    data[tab] = requiredField ? records : records[0] || {};
    if (tab === 'identitas') {
      if (!code || data.identitas.kode_koneksi !== code) {
        throw new WebsiteError('Kode koneksi tidak sesuai. Salin kode dari Website Saya ke kolom kode_koneksi, baris 2 di tab identitas.');
      }
      for (const field of requiredIdentity) {
        if (!data.identitas[field]) throw new WebsiteError(`Isi ${field} pada baris 2 tab identitas.`);
      }
      delete data.identitas.kode_koneksi;
    }
  });

  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > maxDataBytes) {
    throw new WebsiteError('Data website terlalu besar. Persingkat deskripsi dan kurangi baris yang tidak diperlukan.');
  }
  return data;
}

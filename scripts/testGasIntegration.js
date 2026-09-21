import 'dotenv/config';
import { fetchAllTemplatesFromSheet, appendTemplateToSheet } from '../config/sheets.js';

async function testGas() {
  console.log('=== TEST GOOGLE APPS SCRIPT INTEGRASI ===');
  console.log('GOOGLE_SCRIPT_URL:', process.env.GOOGLE_SCRIPT_URL);

  // 1. Fetch data dari Google Apps Script
  console.log('\n1. Mengambil data templat dari Google Apps Script...');
  const templates = await fetchAllTemplatesFromSheet();
  console.log(`Berhasil mengambil ${templates.length} templat!`);
  console.log(JSON.stringify(templates, null, 2));

  console.log('\n=== TEST SELESAI & SUKSES! ===');
}

testGas().catch(err => console.error('Error:', err));

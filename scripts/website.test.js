import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { SCHEMA, TEMPLATE_ID, validateContent, spreadsheetId, WebsiteError } from '../services/villageContent.js';
import { MICRO_PORTAL_SCHEMA, MICRO_PORTAL_TEMPLATE_ID, validateMicroPortalContent } from '../services/microPortalContent.js';
import { renderVillage } from '../services/renderVillage.js';

process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.NODE_ENV = 'test';
const { sequelize, AdminDesa, VillageWebsite } = await import('../models/index.js');
const { createWebsiteRouter, publicVillage } = await import('../routes/websiteRoutes.js');
const rows = (code, title = 'Desa Uji') => Object.entries(SCHEMA).map(([name, headers]) => ({ values: [headers,
  ...(name === 'Profil' ? [['kode_koneksi', code], ['nama_desa', title], ['kecamatan', 'Kecamatan Uji'], ['kabupaten', 'Kabupaten Uji'], ['provinsi', 'Provinsi Uji'], ['deskripsi', 'Profil desa untuk pengujian.']] : [])] }));

test('spreadsheet validation: ownership, structure, required fields, dates, row limits and URLs', () => {
  assert.equal(spreadsheetId('https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrst/edit'), 'abcdefghijklmnopqrst');
  for (const url of ['http://127.0.0.1/private', 'https://evil.test/spreadsheets/d/abcdefghijklmnopqrst', 'javascript:alert(1)']) assert.throws(() => spreadsheetId(url));
  const content = validateContent(rows('secret'), 'secret');
  assert.equal(content.profile.nama_desa, 'Desa Uji');
  assert.equal(content.profile.kode_koneksi, undefined);
  assert.throws(() => validateContent(rows('wrong'), 'secret'), /Kode koneksi/);
  const missing = rows('secret'); missing[1].values = []; assert.throws(() => validateContent(missing, 'secret'), /Header/);
  const incomplete = rows('secret'); incomplete[0].values.pop(); assert.throws(() => validateContent(incomplete, 'secret'), /deskripsi/);
  const badDate = rows('secret'); badDate[2].values.push(['Berita', '2026-02-31', 'Isi']); assert.throws(() => validateContent(badDate, 'secret'), /tanggal/);
  const big = rows('secret'); big[1].values.push(...Array(501).fill(['Nama', 'Jabatan'])); assert.throws(() => validateContent(big, 'secret'), /500/);
});

test('renderer escapes spreadsheet HTML and does not expose connection codes', () => {
  const content = validateContent(rows('private-code', '<script>alert(1)</script>'), 'private-code');
  const html = renderVillage(content);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('private-code'));
});

test('HTTP lifecycle: tenant isolation, draft/preview/publish, failures, stale writes, unpublish and disabled accounts', async t => {
  await sequelize.sync({ force: true });
  const owner = await AdminDesa.create({ nama_desa: 'Desa Uji', kecamatan: 'Kec', kabupaten: 'Kab', provinsi: 'Prov', nama_pic: 'PIC', email: 'one@example.test', password_hash: 'test', status: 'approved' });
  const other = await AdminDesa.create({ ...owner.toJSON(), id: undefined, email: 'two@example.test' });
  let fail = false; let title = 'Konten pertama'; let beforeReturn;
  const app = express(); app.use(express.json());
  const sheetOne = 'https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrst/edit';
  const sheetTwo = 'https://docs.google.com/spreadsheets/d/uvwxyzabcdefghijklmn/edit';
  app.use('/api/my-website', createWebsiteRouter(async (id, code, templateId) => {
    if (fail) throw new WebsiteError('Google tidak tersedia', 502);
    if (beforeReturn) await beforeReturn();
    if (templateId === MICRO_PORTAL_TEMPLATE_ID) {
      const name = id === spreadsheetId(sheetOne) ? 'Desa Sukamaju Uji' : 'Desa Mekarsari Uji';
      const values = { namaDesa: name, kecamatan: 'Kec', kabupaten: 'Kab', provinsi: 'Prov', deskripsi: 'Teks desa </script> utuh', kode_koneksi: code };
      const sheet = Object.entries(MICRO_PORTAL_SCHEMA).map(([tab, headers]) => ({ values: [headers,
        ...(tab === 'identitas' ? [headers.map(key => values[key] || '')] : []),
        ...(tab === 'dokumenPublikasi' ? [['1', `Profil ${name}`, 'Profil Wilayah', '2026', '', '', 'https://example.test/profil']] : []),
      ] }));
      return validateMicroPortalContent(sheet, code);
    }
    return validateContent(rows(code, title), code);
  }));
  app.get('/desa/:slug', publicVillage);
  app.get('/desa/:slug/dokumen', publicVillage);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await sequelize.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id, role = 'desa') => jwt.sign({ id, role }, process.env.JWT_SECRET);
  async function request(path = '', method = 'GET', body, auth = token(owner.id)) {
    const response = await fetch(base + '/api/my-website' + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { ...(await response.json()), status: response.status };
  }
  assert.equal((await request('', 'GET', undefined, null)).status, 401);
  assert.equal((await request('', 'GET', undefined, token(owner.id, 'bps'))).status, 403);
  assert.equal((await request()).data, null);
  assert.equal((await request('', 'PUT', { template_id: 'unknown' })).status, 400);
  let result = await request('', 'PUT', { template_id: TEMPLATE_ID });
  assert.equal(result.status, 200); let website = result.data;
  assert.ok(website.connection_code);
  assert.equal((await request('/sync', 'POST')).status, 400);
  assert.equal((await request('/publish', 'POST', { revision: website.revision })).status, 400);
  result = await request('', 'PUT', { template_id: TEMPLATE_ID, spreadsheet_url: 'https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrst/edit', revision: website.revision });
  assert.equal(result.status, 200); website = result.data;
  assert.equal((await request('', 'GET', undefined, token(other.id))).data, null);
  assert.equal((await request('/preview', 'GET', undefined, token(other.id))).status, 404);
  assert.equal((await fetch(base + website.public_url)).status, 404);
  result = await request('/sync', 'POST'); assert.equal(result.status, 200); website = result.data;
  const preview = await request('/preview'); assert.ok(preview.html.includes('Konten pertama'));
  assert.equal((await fetch(base + website.public_url)).status, 404);
  assert.equal((await request('/publish', 'POST', { revision: website.revision - 1 })).status, 409);
  result = await request('/publish', 'POST', { revision: website.revision }); assert.equal(result.status, 200); website = result.data;
  assert.ok((await (await fetch(base + website.public_url)).text()).includes('Konten pertama'));
  title = 'Konten kedua'; result = await request('/sync', 'POST'); website = result.data;
  assert.ok((await (await fetch(base + website.public_url)).text()).includes('Konten pertama'));
  assert.ok((await request('/preview')).html.includes('Konten kedua'));
  fail = true; assert.equal((await request('/sync', 'POST')).status, 502);
  assert.ok((await (await fetch(base + website.public_url)).text()).includes('Konten pertama'));
  fail = false;
  beforeReturn = async () => { await VillageWebsite.increment('revision', { where: { owner_id: owner.id } }); };
  assert.equal((await request('/sync', 'POST')).status, 409); beforeReturn = null;
  website = (await request()).data;
  result = await request('/publish', 'POST', { revision: website.revision }); website = result.data;
  assert.ok((await (await fetch(base + website.public_url)).text()).includes('Konten kedua'));
  await owner.update({ status: 'nonaktif' });
  assert.equal((await request()).status, 403); assert.equal((await fetch(base + website.public_url)).status, 404);
  await owner.update({ status: 'approved' });
  assert.equal((await request('/unpublish', 'POST', { revision: website.revision })).status, 200);
  assert.equal((await fetch(base + website.public_url)).status, 404);
  assert.equal((await request()).data.has_draft, true);

  const publishMicroPortal = async (auth, sheetUrl, oldRevision) => {
    const saved = await request('', 'PUT', { template_id: MICRO_PORTAL_TEMPLATE_ID, spreadsheet_url: sheetUrl, revision: oldRevision }, auth);
    assert.equal(saved.status, 200);
    assert.equal(saved.data.has_draft, false);
    const synced = await request('/sync', 'POST', undefined, auth);
    assert.equal(synced.status, 200);
    const preview = await request('/preview', 'GET', undefined, auth);
    assert.match(preview.html, /"preview":true/);
    assert.doesNotMatch(preview.html, new RegExp(saved.data.connection_code));
    assert.match(preview.html, /\\u003c\/script>/);
    const published = await request('/publish', 'POST', { revision: preview.revision }, auth);
    assert.equal(published.status, 200);
    return published.data;
  };

  const first = await publishMicroPortal(token(owner.id), sheetOne, (await request()).data.revision);
  const second = await publishMicroPortal(token(other.id), sheetTwo);
  assert.notEqual(first.public_url, second.public_url);
  for (const [site, title, otherTitle] of [[first, 'Desa Sukamaju Uji', 'Desa Mekarsari Uji'], [second, 'Desa Mekarsari Uji', 'Desa Sukamaju Uji']]) {
    const home = await fetch(base + site.public_url);
    const html = await home.text();
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
    assert.ok(html.includes(title));
    assert.ok(!html.includes(otherTitle));
    assert.ok(!html.includes(site.connection_code));
    const documents = await fetch(`${base}${site.public_url}/dokumen`);
    assert.equal(documents.status, 200);
    assert.match(await documents.text(), /"page":"dokumen"/);
  }

  // A template change clears the draft and preserves the last published layout until the next publish.
  assert.equal((await request('', 'PUT', { template_id: TEMPLATE_ID, revision: first.revision })).status, 200);
  assert.equal((await request('/preview')).status, 400);
  assert.match(await (await fetch(base + first.public_url)).text(), /Desa Sukamaju Uji/);

  // Existing websites published before template selection still use the original renderer.
  await VillageWebsite.update({ published_content: validateContent(rows('legacy', 'Publikasi Lama'), 'legacy') }, { where: { owner_id: owner.id } });
  assert.match(await (await fetch(base + first.public_url)).text(), /Publikasi Lama/);
  assert.equal((await fetch(base + first.public_url + '/dokumen')).status, 404);
});

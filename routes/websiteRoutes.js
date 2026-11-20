import express from 'express';
import { randomBytes } from 'node:crypto';
import { AdminDesa, VillageWebsite } from '../models/index.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { TEMPLATE_ID, SCHEMA, WebsiteError, spreadsheetId, sheetsConnection, readVillageContent } from '../services/villageContent.js';
import { MICRO_PORTAL_TEMPLATE_ID } from '../services/microPortalContent.js';
import { getVillageTemplate, serveVillageTemplate, villageTemplates } from '../services/villageTemplates.js';

// Dependency injection allows the full HTTP lifecycle to be tested without real Google credentials.
export function createWebsiteRouter(readContent = readVillageContent) {
  const router = express.Router();
  router.use(authenticateToken, authorizeRole('desa'));
  router.use(async (req, res, next) => {
    try {
      req.village = await AdminDesa.findByPk(req.user.id);
      if (!req.village || req.village.status !== 'approved') return res.status(403).json({ message: 'Akun desa belum aktif.' });
      res.set('Cache-Control', 'no-store');
      next();
    } catch (error) { next(error); }
  });
  const wrap = handler => async (req, res, next) => { try { await handler(req, res); } catch (error) { next(error); } };
  const owned = async req => {
    const website = await VillageWebsite.findOne({ where: { owner_id: req.user.id } });
    if (!website) throw new WebsiteError('Simpan pengaturan website terlebih dahulu.', 404);
    return website;
  };
  const view = website => website ? {
    id: website.id, slug: website.slug, template_id: website.template_id,
    spreadsheet_url: website.spreadsheet_id ? `https://docs.google.com/spreadsheets/d/${website.spreadsheet_id}/edit` : '',
    connection_code: website.connection_code, revision: website.revision,
    has_draft: !!website.draft_content, published: !!website.published_content,
    synced_at: website.synced_at, published_at: website.published_at,
    public_url: `/desa/${website.slug}`,
  } : null;

  router.get('/', wrap(async (req, res) => {
    res.json({ data: view(await VillageWebsite.findOne({ where: { owner_id: req.user.id } })),
      connection: sheetsConnection(), schema: SCHEMA,
      templates: villageTemplates });
  }));
  router.put('/', wrap(async (req, res) => {
    const template = getVillageTemplate(req.body.template_id);
    if (!template) throw new WebsiteError('Pilih templat yang tersedia.');
    const id = req.body.spreadsheet_url ? spreadsheetId(req.body.spreadsheet_url) : null;
    let website = await VillageWebsite.findOne({ where: { owner_id: req.user.id } });
    if (!website) {
      const base = req.village.nama_desa.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'desa';
      website = await VillageWebsite.create({ owner_id: req.user.id, slug: `${base}-${req.user.id}`, template_id: template.id, spreadsheet_id: id, connection_code: randomBytes(24).toString('hex') });
    } else {
      if (req.body.revision !== website.revision) throw new WebsiteError('Pengaturan telah berubah. Muat ulang halaman lalu coba lagi.', 409);
      if (website.spreadsheet_id !== id || website.template_id !== template.id) {
        const [updated] = await VillageWebsite.update({ template_id: template.id, spreadsheet_id: id, draft_content: null, synced_at: null, revision: website.revision + 1 },
          { where: { id: website.id, revision: req.body.revision } });
        if (!updated) throw new WebsiteError('Pengaturan telah berubah. Muat ulang halaman lalu coba lagi.', 409);
        await website.reload();
      }
    }
    res.json({ data: view(website), message: 'Pengaturan tersimpan. Lanjutkan dengan mengisi dan menyinkronkan spreadsheet.' });
  }));
  router.post('/sync', wrap(async (req, res) => {
    const website = await owned(req);
    if (!website.spreadsheet_id) throw new WebsiteError('Simpan link spreadsheet terlebih dahulu.');
    const content = await readContent(website.spreadsheet_id, website.connection_code, website.template_id);
    const [updated] = await VillageWebsite.update({ draft_content: content, synced_at: new Date(), revision: website.revision + 1 }, { where: { id: website.id, revision: website.revision } });
    if (!updated) throw new WebsiteError('Pengaturan berubah saat sinkronisasi. Coba lagi.', 409);
    res.json({ data: view(await website.reload()), message: 'Data berhasil diperiksa. Lihat pratinjau sebelum menerbitkan.' });
  }));
  router.get('/preview', wrap(async (req, res) => {
    const website = await owned(req);
    if (!website.draft_content) throw new WebsiteError('Sinkronkan spreadsheet terlebih dahulu.');
    const html = serveVillageTemplate(website.template_id, website.draft_content, { slug: website.slug, preview: true });
    res.json({ html, revision: website.revision });
  }));
  router.post('/publish', wrap(async (req, res) => {
    const website = await owned(req);
    if (!website.draft_content) throw new WebsiteError('Sinkronkan dan periksa pratinjau terlebih dahulu.');
    if (req.body.revision !== website.revision) throw new WebsiteError('Pratinjau telah berubah. Muat ulang dan periksa kembali sebelum terbit.', 409);
    const publication = { template_id: website.template_id, content: website.draft_content };
    const [updated] = await VillageWebsite.update({ published_content: publication, published_at: new Date(), revision: website.revision + 1 }, { where: { id: website.id, revision: req.body.revision } });
    if (!updated) throw new WebsiteError('Pratinjau telah berubah. Muat ulang dan periksa kembali sebelum terbit.', 409);
    res.json({ data: view(await website.reload()), message: 'Website berhasil diterbitkan.' });
  }));
  router.post('/unpublish', wrap(async (req, res) => {
    const website = await owned(req);
    if (req.body.revision !== website.revision) throw new WebsiteError('Website telah berubah. Muat ulang lalu coba lagi.', 409);
    const [updated] = await VillageWebsite.update({ published_content: null, published_at: null, revision: website.revision + 1 }, { where: { id: website.id, revision: req.body.revision } });
    if (!updated) throw new WebsiteError('Website telah berubah. Muat ulang lalu coba lagi.', 409);
    res.json({ data: view(await website.reload()), message: 'Website ditarik dari publik. Draf tetap tersimpan.' });
  }));
  router.use((error, req, res, next) => {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'Website sudah dibuat. Muat ulang halaman.' });
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Pengaturan website tidak dapat diproses. Coba lagi.' });
  });
  return router;
}

export async function publicVillage(req, res, next) {
  try {
    const website = await VillageWebsite.findOne({ where: { slug: req.params.slug } });
    const owner = website && await AdminDesa.findByPk(website.owner_id);
    const publication = website?.published_content;
    // Before template selection existed, saved publications were unwrapped Desa Informatif snapshots.
    const templateId = publication?.template_id || TEMPLATE_ID;
    const page = req.route.path.endsWith('/dokumen') ? 'dokumen' : 'home';
    res.set('Cache-Control', 'no-store');
    if (!publication || owner?.status !== 'approved' || (page === 'dokumen' && templateId !== MICRO_PORTAL_TEMPLATE_ID)) {
      return res.status(404).type('html').send('<!doctype html><html lang="id"><meta charset="utf-8"><title>Halaman tidak tersedia</title><h1>Halaman tidak tersedia</h1><p>Website belum diterbitkan, tidak aktif, atau halaman tidak ada.</p><a href="/">Kembali ke galeri</a></html>');
    }
    const resources = templateId === MICRO_PORTAL_TEMPLATE_ID
      ? "script-src 'self'; style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' https:;"
      : "style-src 'self';";
    res.set({ 'Content-Security-Policy': `default-src 'none'; ${resources} base-uri 'none'; frame-ancestors 'self'; form-action 'none'`, 'X-Content-Type-Options': 'nosniff' });
    res.type('html').send(serveVillageTemplate(templateId, publication.content || publication, { slug: website.slug, page }));
  } catch (error) { next(error); }
}

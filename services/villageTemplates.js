import { readFileSync } from 'node:fs';
import { TEMPLATE_ID, SCHEMA } from './villageContent.js';
import { MICRO_PORTAL_TEMPLATE_ID, MICRO_PORTAL_SCHEMA } from './microPortalContent.js';
import { renderVillage } from './renderVillage.js';

const microPortalShell = new URL('../public/templates/micro-portal/index.html', import.meta.url);

export const villageTemplates = [
  {
    id: TEMPLATE_ID,
    name: 'Desa Informatif',
    description: 'Profil, perangkat desa, berita, potensi, dan statistik dalam satu website.',
    workbook: '/templates/spreadsheet-desa.xlsx',
    connectionTab: 'Profil',
    schema: SCHEMA,
  },
  {
    id: MICRO_PORTAL_TEMPLATE_ID,
    name: 'Micro-Portal Desa Cantik',
    description: 'Profil desa, statistik kependudukan dan ekonomi, potensi, serta dokumen publikasi.',
    workbook: '/templates/spreadsheet-micro-portal.xlsx',
    connectionTab: 'identitas',
    schema: MICRO_PORTAL_SCHEMA,
  },
];

export function getVillageTemplate(id) {
  return villageTemplates.find(template => template.id === id);
}

export function serveVillageTemplate(templateId, content, { slug, preview = false, page = 'home' } = {}) {
  if (templateId !== MICRO_PORTAL_TEMPLATE_ID) return renderVillage(content, preview);

  const payload = JSON.stringify({ data: content, page, preview, sitePath: `/desa/${slug}` });
  // A JSON script element is still parsed as HTML. Escape '<' before embedding it.
  const safePayload = payload.replaceAll('<', '\\u003c');
  const shell = readFileSync(microPortalShell, 'utf8');
  return shell.replace('<!-- VILLAGE_DATA -->', () => `<script type="application/json" id="village-data">${safePayload}</script>`);
}

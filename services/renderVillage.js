const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export function renderVillage(content, preview = false) {
  const { profile: p, perangkat = [], berita = [], potensi = [], statistik = [] } = content;
  const section = (id, title, rows, render) => rows.length ? `<section id="${id}" class="v-section"><h2>${title}</h2><div class="v-grid">${rows.map(render).join('')}</div></section>` : '';
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(p.deskripsi.slice(0, 160))}"><title>${escape(p.nama_desa)} — Portal Desa</title><link rel="stylesheet" href="/village-site.css"></head><body>
    ${preview ? '<div class="v-preview">PRATINJAU · Konten ini belum tentu sama dengan website yang telah diterbitkan.</div>' : ''}
    <header class="v-header"><a href="#profil">${escape(p.nama_desa)}</a><nav aria-label="Navigasi desa"><a href="#profil">Profil</a>${berita.length ? '<a href="#berita">Berita</a>' : ''}${statistik.length ? '<a href="#statistik">Statistik</a>' : ''}<a href="#kontak">Kontak</a></nav></header>
    <main><section id="profil" class="v-hero"><p class="v-eyebrow">${escape(p.kabupaten)} / ${escape(p.provinsi)}</p><h1>${escape(p.nama_desa)}</h1><p class="v-lead">${escape(p.deskripsi)}</p><span>Kecamatan ${escape(p.kecamatan)}</span></section>
    ${section('statistik', 'Desa dalam angka', statistik, row => `<article class="v-stat"><p>${escape(row.indikator)}</p><strong>${escape(row.nilai)}</strong><span>${escape(row.satuan)} · ${escape(row.tahun)}</span></article>`)}
    ${section('berita', 'Kabar desa', berita, row => `<article><time datetime="${escape(row.tanggal)}">${escape(row.tanggal)}</time><h3>${escape(row.judul)}</h3><p class="v-text">${escape(row.isi)}</p></article>`)}
    ${section('potensi', 'Potensi desa', potensi, row => `<article><h3>${escape(row.nama)}</h3><p class="v-text">${escape(row.deskripsi)}</p></article>`)}
    ${section('perangkat', 'Perangkat desa', perangkat, row => `<article><h3>${escape(row.nama)}</h3><p>${escape(row.jabatan)}</p></article>`)}
    <section id="kontak" class="v-contact"><h2>Hubungi desa</h2>${[p.alamat, p.email, p.telepon].filter(Boolean).map(value => `<p>${escape(value)}</p>`).join('') || '<p>Informasi kontak belum ditambahkan.</p>'}</section></main><footer>${escape(p.nama_desa)} · ${escape(p.kabupaten)}</footer></body></html>`;
}

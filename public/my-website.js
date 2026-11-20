(() => {
  const panel = document.createElement('section');
  panel.id = 'my-website';
  panel.className = 'website-workspace';
  panel.hidden = true;
  document.querySelector('main').prepend(panel);
  let website = null;
  let connection = {};
  let templates = [];
  let selectedTemplateId = null;
  let gallerySelection = null;
  let loadedOwner = null;
  let busy = false;
  let dirty = false;
  let previewedRevision = null;
  let generation = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const selectedTemplate = () => templates.find(template => template.id === selectedTemplateId) || templates[0];
  const formatTime = value => value ? new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB' : 'Belum pernah';
  async function api(path = '', method = 'GET', body) {
    const response = await fetch('/api/my-website' + path, { method,
      headers: { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Permintaan gagal. Coba lagi.');
    return result;
  }
  function message(text, error = false) {
    const node = panel.querySelector('#website-message');
    if (!node) return;
    node.textContent = text;
    node.className = 'website-message' + (error ? ' is-error' : '');
    node.hidden = !text;
  }
  function controls() {
    panel.querySelectorAll('button, input, select').forEach(node => { node.disabled = busy; });
    const useButton = document.getElementById('use-micro-portal');
    if (useButton) useButton.disabled = busy;
    const disable = (action, condition) => { const button = panel.querySelector(`[data-action="${action}"]`); if (button) button.disabled = busy || condition; };
    disable('sync', !website?.spreadsheet_url || dirty || !connection.configured);
    disable('preview', !website?.has_draft || dirty);
    disable('publish', !website?.has_draft || dirty || previewedRevision !== website?.revision);
    disable('unpublish', !website?.published);
    panel.setAttribute('aria-busy', String(busy));
  }
  function render() {
    const template = selectedTemplate();
    const microPortal = template.id === 'micro-portal-desa-v1';
    const storedSheet = template.id === website?.template_id ? website.spreadsheet_url : '';
    const tabNames = Object.keys(template.schema).join(', ');
    const codeLocation = microPortal
      ? 'kolom <strong>kode_koneksi</strong> pada baris 2 tab <strong>identitas</strong>'
      : 'baris <strong>kode_koneksi</strong> di tab <strong>Profil</strong>';
    const status = website?.published ? 'Website sudah terbit' : website?.has_draft ? 'Draf siap ditinjau' : 'Belum diterbitkan';
    panel.innerHTML = `<div class="website-heading"><div><p class="website-eyebrow">RUANG KELOLA DESA</p><h2>Website Saya</h2><p>Pilih tampilan, isi spreadsheet, lalu terbitkan informasi desa Anda.</p></div><span class="website-status">${status}</span></div>
      <ol class="website-steps"><li class="${website ? 'done' : ''}">Pilih templat</li><li class="${website?.has_draft ? 'done' : ''}">Hubungkan data</li><li class="${website?.published ? 'done' : ''}">Tinjau & terbitkan</li></ol>
      <div id="website-message" class="website-message" role="status" aria-live="polite" hidden></div>
      <div class="website-columns"><div><form id="website-form" class="website-card">
        <h3>1. Tampilan website</h3><label for="website-template">Templat tersedia</label><select id="website-template" name="template_id">${templates.map(item => `<option value="${esc(item.id)}"${item.id === template.id ? ' selected' : ''}>${esc(item.name)}</option>`).join('')}</select>
        <p class="website-help">${esc(template.description)}</p>
        <h3>2. Hubungkan spreadsheet</h3><label for="website-sheet">Link Google Sheets desa</label><input id="website-sheet" name="spreadsheet_url" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value="${esc(storedSheet)}">
        <p class="website-help">Boleh dikosongkan saat pertama menyimpan untuk mendapatkan kode koneksi.</p>
        <button type="submit" class="btn btn-primary">Simpan pengaturan</button>
      </form><details class="website-card" ${dirty || !website?.has_draft ? 'open' : ''}><summary>Panduan menyiapkan spreadsheet</summary>
        <ol class="website-guide"><li><a href="${esc(template.workbook)}" download>Unduh spreadsheet ${esc(template.name)}</a>, unggah ke Google Drive, lalu buka dan simpan sebagai Google Sheets. Gunakan satu file untuk satu desa.</li>
        <li>Isi tab <strong>${esc(template.connectionTab)}</strong>. Pertahankan nama tab dan header pada file unduhan. Tab yang tersedia adalah ${esc(tabNames)}.</li>
        <li>Masukkan kode berikut pada ${codeLocation}.<code class="website-code">${esc(website?.connection_code || 'Simpan pengaturan untuk mendapatkan kode.')}</code></li>
        <li>Bagikan spreadsheet sebagai <strong>Pelihat</strong> kepada:<code class="website-code">${esc(connection.email || 'Email layanan belum disiapkan pengelola.')}</code>Tidak perlu membuka akses untuk semua orang.</li>
        <li>Salin link spreadsheet ke kolom di atas, simpan, lalu klik <strong>Sinkronkan data</strong>. Periksa pratinjau sebelum menerbitkan.</li></ol>
        <p class="website-help">${microPortal ? 'Isi hanya informasi yang boleh tampil ke publik. Pastikan tautan dokumen memang ditujukan untuk pengunjung.' : 'Gunakan tanggal berita dengan format YYYY-MM-DD. Masukkan angka statistik tanpa pemisah ribuan dan gunakan titik untuk desimal.'}</p>
      </details></div><aside class="website-card website-publication"><h3>3. Tinjau & terbitkan</h3>
        <dl><dt>Status koneksi layanan</dt><dd>${connection.configured ? 'Siap dihubungkan' : 'Menunggu konfigurasi pengelola'}</dd><dt>Sinkronisasi terakhir</dt><dd>${formatTime(website?.synced_at)}</dd><dt>Publikasi terakhir</dt><dd>${formatTime(website?.published_at)}</dd><dt>Alamat website</dt><dd>${website ? esc(website.public_url) : 'Tersedia setelah pengaturan disimpan'}</dd></dl>
        <p class="website-help">Perubahan spreadsheet baru tampil di website setelah disinkronkan dan diterbitkan.</p>
        <button type="button" data-action="sync" class="btn btn-secondary">Sinkronkan data</button><button type="button" data-action="preview" class="btn btn-secondary">Lihat pratinjau</button><button type="button" data-action="publish" class="btn btn-primary">Terbitkan website</button>
        <p class="website-help">Buka pratinjau untuk mengaktifkan tombol terbitkan.</p>
        ${website?.published ? `<a class="btn btn-secondary" href="${esc(website.public_url)}" target="_blank" rel="noopener">Buka website ↗</a><button type="button" data-action="unpublish" class="btn btn-danger">Tarik dari publik</button>` : ''}
      </aside></div><section id="website-preview-section" class="website-card" hidden><h3>Pratinjau website desa</h3><iframe id="website-preview" title="Pratinjau website desa" sandbox="${microPortal ? 'allow-scripts' : ''}" referrerpolicy="no-referrer"></iframe></section>`;
    controls();
  }
  async function load() {
    const ticket = ++generation;
    panel.hidden = false;
    panel.innerHTML = '<p role="status">Memuat Website Saya…</p>';
    try {
      const result = await api();
      if (ticket !== generation) return;
      website = result.data; connection = result.connection; templates = result.templates; previewedRevision = null;
      selectedTemplateId = gallerySelection || website?.template_id || templates[0].id;
      dirty = !!gallerySelection && website?.template_id !== gallerySelection;
      const fromGallery = !!gallerySelection;
      gallerySelection = null;
      render();
      if (fromGallery) focusSelection();
    } catch (error) {
      if (ticket !== generation) return;
      panel.innerHTML = `<p role="alert">${esc(error.message)}</p><button type="button" data-action="retry" class="btn btn-secondary">Coba lagi</button>`;
    }
  }
  async function run(action, body) {
    if (busy) return;
    busy = true; controls(); message('Memproses…');
    const ticket = generation;
    try {
      const result = await api(action === 'save' ? '' : '/' + action, action === 'save' ? 'PUT' : action === 'preview' ? 'GET' : 'POST', body);
      if (ticket !== generation) return;
      if (action === 'preview') {
        panel.querySelector('#website-preview').srcdoc = result.html;
        panel.querySelector('#website-preview-section').hidden = false;
        previewedRevision = result.revision;
        panel.querySelector('#website-preview-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        message('Periksa tampilan di bawah. Jika sudah sesuai, klik Terbitkan website.');
      } else {
        website = result.data; selectedTemplateId = website.template_id; dirty = false; previewedRevision = null; render(); message(result.message);
      }
    } catch (error) { if (ticket === generation) message(error.message, true); }
    finally { busy = false; if (ticket === generation) controls(); }
  }
  function focusSelection() {
    panel.scrollIntoView({ behavior: 'smooth' });
    panel.querySelector('#website-template')?.focus({ preventScroll: true });
  }
  function selectTemplate(id) {
    if (id === selectedTemplateId) return;
    selectedTemplateId = id;
    dirty = true;
    previewedRevision = null;
    render();
    message('Simpan pilihan templat dan hubungkan spreadsheet yang sesuai.');
  }
  panel.addEventListener('input', event => {
    if (event.target.id === 'website-sheet') { dirty = true; previewedRevision = null; controls(); message('Simpan perubahan pengaturan sebelum melanjutkan.'); }
  });
  panel.addEventListener('change', event => {
    if (event.target.id !== 'website-template') return;
    selectTemplate(event.target.value);
    panel.querySelector('#website-template')?.focus({ preventScroll: true });
  });
  panel.addEventListener('submit', event => {
    if (event.target.id !== 'website-form') return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    run('save', { ...values, revision: website?.revision });
  });
  panel.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'retry') { load(); return; }
    if (action === 'unpublish' && !window.confirm('Tarik website dari publik? Draf dan spreadsheet tetap tersimpan.')) return;
    run(action, ['publish', 'unpublish'].includes(action) ? { revision: website?.revision } : undefined);
  });
  document.getElementById('use-micro-portal')?.addEventListener('click', () => {
    const id = 'micro-portal-desa-v1';
    if (state.user?.role !== 'desa') {
      gallerySelection = id;
      if (state.user?.role === 'bps') return;
      openModal('modal-login-desa');
      return;
    }
    if (!templates.length) { gallerySelection = id; load(); return; }
    selectTemplate(id);
    focusSelection();
  });
  for (const host of ['nav-user-profile', 'drawer-user-profile']) {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary btn-sm website-nav'; button.textContent = 'Website Saya'; button.hidden = true;
    button.addEventListener('click', () => { document.getElementById('btn-close-drawer')?.click(); panel.scrollIntoView({ behavior: 'smooth' }); });
    document.getElementById(host)?.append(button);
  }
  window.addEventListener('village-auth-change', event => {
    const active = event.detail.loggedIn && state.user?.role === 'desa';
    document.querySelectorAll('.website-nav').forEach(button => { button.hidden = !active; });
    const useButton = document.getElementById('use-micro-portal');
    if (useButton) useButton.hidden = event.detail.loggedIn && state.user?.role === 'bps';
    panel.hidden = !active;
    if (!active) { generation++; website = null; templates = []; selectedTemplateId = null; loadedOwner = null; panel.innerHTML = ''; return; }
    if (loadedOwner !== state.user.id) { loadedOwner = state.user.id; load(); }
  });
})();

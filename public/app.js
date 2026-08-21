// State Aplikasi SPA
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  templates: [],
  villages: [],
  selectedCategory: '',
  searchQuery: '',
};

// Elements DOM
const elements = {
  // Navigasi
  navGuest: document.getElementById('nav-guest'),
  navUserProfile: document.getElementById('nav-user-profile'),
  userDisplayName: document.getElementById('user-display-name'),
  userDisplayRole: document.getElementById('user-display-role'),
  btnDashboard: document.getElementById('btn-dashboard'),
  btnLogout: document.getElementById('btn-logout'),

  // Galeri & Filter
  templateGrid: document.getElementById('template-grid'),
  searchInput: document.getElementById('search-input'),
  filterPills: document.getElementById('filter-pills'),

  // Admin Dashboard
  adminDashboardSection: document.getElementById('admin-dashboard-section'),
  tabVillages: document.getElementById('tab-villages'),
  tabTemplates: document.getElementById('tab-templates'),
  tabContentVillages: document.getElementById('tab-content-villages'),
  tabContentTemplates: document.getElementById('tab-content-templates'),
  tableVillagesBody: document.getElementById('table-villages-body'),
  tableTemplatesBody: document.getElementById('table-templates-body'),
  pendingCount: document.getElementById('pending-count'),

  // Buttons Modal Trigger
  btnOpenLoginDesa: document.getElementById('btn-open-login-desa'),
  btnOpenRegisterDesa: document.getElementById('btn-open-register-desa'),
  btnOpenLoginBps: document.getElementById('btn-open-login-bps'),
  btnOpenCreateTemplate: document.getElementById('btn-open-create-template'),

  // Modals
  modalLoginDesa: document.getElementById('modal-login-desa'),
  modalRegisterDesa: document.getElementById('modal-register-desa'),
  modalLoginBps: document.getElementById('modal-login-bps'),
  modalCreateTemplate: document.getElementById('modal-create-template'),

  // Forms
  formLoginDesa: document.getElementById('form-login-desa'),
  formRegisterDesa: document.getElementById('form-register-desa'),
  formLoginBps: document.getElementById('form-login-bps'),
  formCreateTemplate: document.getElementById('form-create-template'),
};

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthSession();
  loadTemplates();
});

// Event Listeners
function setupEventListeners() {
  // Modal Triggers
  elements.btnOpenLoginDesa?.addEventListener('click', () => openModal('modal-login-desa'));
  elements.btnOpenRegisterDesa?.addEventListener('click', () => openModal('modal-register-desa'));
  elements.btnOpenLoginBps?.addEventListener('click', () => openModal('modal-login-bps'));
  elements.btnOpenCreateTemplate?.addEventListener('click', () => openModal('modal-create-template'));

  // Close Modal Buttons
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Close modal when clicking outside card
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Forms Submit
  elements.formLoginDesa?.addEventListener('submit', handleLoginDesa);
  elements.formRegisterDesa?.addEventListener('submit', handleRegisterDesa);
  elements.formLoginBps?.addEventListener('submit', handleLoginBps);
  elements.formCreateTemplate?.addEventListener('submit', handleCreateTemplate);

  // Logout & Dashboard Scroll
  elements.btnLogout?.addEventListener('click', handleLogout);
  elements.btnDashboard?.addEventListener('click', () => {
    elements.adminDashboardSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Search & Filter
  let searchTimeout;
  elements.searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    state.searchQuery = e.target.value;
    searchTimeout = setTimeout(() => loadTemplates(), 300);
  });

  elements.filterPills?.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.filterPills.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedCategory = pill.getAttribute('data-category');
      loadTemplates();
    });
  });

  // Admin Dashboard Tabs
  elements.tabVillages?.addEventListener('click', () => switchAdminTab('villages'));
  elements.tabTemplates?.addEventListener('click', () => switchAdminTab('templates'));
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Auth State Check
async function checkAuthSession() {
  if (!state.token) {
    updateUIAuth(false);
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await res.json();

    if (data.status === 'success') {
      state.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUIAuth(true);
      if (state.user.role === 'bps') {
        loadAdminDashboardData();
      }
    } else {
      handleLogout();
    }
  } catch (err) {
    console.error('Session check error:', err);
    updateUIAuth(false);
  }
}

function updateUIAuth(isLoggedIn) {
  if (isLoggedIn && state.user) {
    elements.navGuest.style.display = 'none';
    elements.navUserProfile.style.display = 'flex';
    elements.userDisplayName.textContent = state.user.nama || state.user.nama_desa || state.user.email;
    elements.userDisplayRole.textContent = state.user.role.toUpperCase();

    if (state.user.role === 'bps') {
      elements.btnDashboard.style.display = 'inline-flex';
      elements.adminDashboardSection.style.display = 'block';
    } else {
      elements.btnDashboard.style.display = 'none';
      elements.adminDashboardSection.style.display = 'none';
    }
  } else {
    elements.navGuest.style.display = 'flex';
    elements.navUserProfile.style.display = 'none';
    elements.adminDashboardSection.style.display = 'none';
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateUIAuth(false);
  alert('Anda telah keluar (logout).');
}

// Fetch & Render Templates
async function loadTemplates() {
  try {
    elements.templateGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p style="margin-top: 1rem;">Memuat galeri templat website desa...</p>
      </div>`;

    let url = `/api/templates?kategori=${encodeURIComponent(state.selectedCategory)}&search=${encodeURIComponent(state.searchQuery)}`;
    if (state.user && state.user.role === 'bps') {
      url += '&includeAll=true';
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success') {
      state.templates = data.data;
      renderTemplateCards(data.data);
      if (state.user && state.user.role === 'bps') {
        renderAdminTemplatesTable(data.data);
      }
    } else {
      elements.templateGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Gagal memuat templat: ${data.message}</p>`;
    }
  } catch (err) {
    console.error('Fetch templates error:', err);
    elements.templateGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Koneksi terganggu. Gagal memuat galeri templat.</p>`;
  }
}

function renderTemplateCards(templates) {
  if (!templates || templates.length === 0) {
    elements.templateGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="glass">
        <i class="fa-solid fa-folder-open fa-3x" style="color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>Tidak Ada Templat Ditemukan</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
      </div>`;
    return;
  }

  elements.templateGrid.innerHTML = templates
    .map((t) => {
      const defaultImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600';
      const thumbnail = t.thumbnail_url || defaultImg;
      const statusBadge = t.status && t.status !== 'Aktif' 
        ? `<span class="card-badge" style="background: rgba(245,158,11,0.9); color: white;">${t.status}</span>`
        : `<span class="card-badge">${t.kategori}</span>`;

      return `
        <div class="template-card glass">
          <div class="card-thumb">
            <img src="${thumbnail}" alt="${t.nama_templat}" onerror="this.src='${defaultImg}'">
            ${statusBadge}
            <span class="card-db-badge">${t.tipe_database}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${t.nama_templat}</h3>
            <p class="card-desc">${t.deskripsi || 'Templat resmi website desa.'}</p>
            <div class="card-footer">
              <span style="font-size: 0.8rem; color: var(--text-dim);">ID: ${t.id}</span>
              <a href="${t.link_templat}" target="_blank" class="btn btn-primary btn-sm">
                Lihat Detail / Preview <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Handlers Registrasi & Login
async function handleRegisterDesa(e) {
  e.preventDefault();
  const formData = {
    nama_desa: document.getElementById('reg-nama-desa').value,
    kecamatan: document.getElementById('reg-kecamatan').value,
    kabupaten: document.getElementById('reg-kabupaten').value,
    provinsi: document.getElementById('reg-provinsi').value,
    nama_pic: document.getElementById('reg-nama-pic').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value,
  };

  try {
    const res = await fetch('/api/auth/register/desa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (res.status === 201) {
      alert(data.message);
      closeModal('modal-register-desa');
      elements.formRegisterDesa.reset();
    } else {
      alert(`Gagal Registrasi: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

async function handleLoginDesa(e) {
  e.preventDefault();
  const email = document.getElementById('login-desa-email').value;
  const password = document.getElementById('login-desa-password').value;

  try {
    const res = await fetch('/api/auth/login/desa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.status === 'success') {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUIAuth(true);
      closeModal('modal-login-desa');
      elements.formLoginDesa.reset();
      alert(`Selamat datang kembali, ${data.user.nama_desa}!`);
    } else {
      alert(`Login Gagal: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

async function handleLoginBps(e) {
  e.preventDefault();
  const email = document.getElementById('login-bps-email').value;
  const password = document.getElementById('login-bps-password').value;

  try {
    const res = await fetch('/api/auth/login/bps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.status === 'success') {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUIAuth(true);
      closeModal('modal-login-bps');
      loadAdminDashboardData();
      alert(`Selamat datang Admin BPS: ${data.user.nama}!`);
    } else {
      alert(`Login BPS Gagal: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

// Admin Dashboard Functions
async function loadAdminDashboardData() {
  if (!state.token || state.user?.role !== 'bps') return;

  try {
    const res = await fetch('/api/admin/villages', {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await res.json();

    if (data.status === 'success') {
      state.villages = data.data;
      renderAdminVillagesTable(data.data);
      const pendingCount = data.data.filter((v) => v.status === 'pending').length;
      if (elements.pendingCount) elements.pendingCount.textContent = pendingCount;
    }
  } catch (err) {
    console.error('Fetch villages error:', err);
  }
}

function renderAdminVillagesTable(villages) {
  if (!villages || villages.length === 0) {
    elements.tableVillagesBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada pendaftaran akun desa.</td></tr>`;
    return;
  }

  elements.tableVillagesBody.innerHTML = villages
    .map((v, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${v.nama_desa}</strong></td>
        <td>${v.kecamatan}, ${v.kabupaten}, ${v.provinsi}</td>
        <td>${v.nama_pic}</td>
        <td>${v.email}</td>
        <td><span class="status-badge status-${v.status}">${v.status === 'approved' ? 'Aktif' : v.status === 'nonaktif' ? 'Dinonaktifkan' : v.status}</span></td>
        <td>
          ${v.status === 'approved'
            ? `<button onclick="updateVillageStatus(${v.id}, 'nonaktif')" class="btn btn-secondary btn-sm" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3);"><i class="fa-solid fa-ban"></i> Nonaktifkan Sementara</button>`
            : v.status === 'nonaktif'
            ? `<button onclick="updateVillageStatus(${v.id}, 'approved')" class="btn btn-success btn-sm"><i class="fa-solid fa-check"></i> Aktifkan Kembali</button>`
            : `<button onclick="updateVillageStatus(${v.id}, 'approved')" class="btn btn-success btn-sm"><i class="fa-solid fa-check"></i> Aktifkan</button>
               <button onclick="updateVillageStatus(${v.id}, 'nonaktif')" class="btn btn-danger btn-sm"><i class="fa-solid fa-ban"></i> Nonaktifkan</button>`
          }
        </td>
      </tr>
    `)
    .join('');
}

window.updateVillageStatus = async (id, status) => {
  if (!confirm(`Ubah status akun desa ini menjadi "${status}"?`)) return;

  try {
    const res = await fetch(`/api/admin/villages/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert(data.message);
      loadAdminDashboardData();
    } else {
      alert(`Gagal: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
};

function renderAdminTemplatesTable(templates) {
  if (!templates || templates.length === 0) {
    elements.tableTemplatesBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada templat.</td></tr>`;
    return;
  }

  elements.tableTemplatesBody.innerHTML = templates
    .map((t) => `
      <tr>
        <td><code>${t.id}</code></td>
        <td><strong>${t.nama_templat}</strong></td>
        <td>${t.kategori}</td>
        <td>${t.tipe_database}</td>
        <td><span class="status-badge status-${t.status.toLowerCase()}">${t.status}</span></td>
        <td><a href="${t.link_templat}" target="_blank" style="color: #38bdf8;">Preview <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
        <td>
          <select onchange="updateTemplateStatus('${t.id}', this.value)" class="form-control" style="height: 32px; font-size: 0.8rem; padding: 0 4px; width: 110px;">
            <option value="Aktif" ${t.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
            <option value="Draft" ${t.status === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Nonaktif" ${t.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option>
          </select>
        </td>
      </tr>
    `)
    .join('');
}

window.updateTemplateStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/templates/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert(data.message);
      loadTemplates();
    } else {
      alert(`Gagal: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
};

async function handleCreateTemplate(e) {
  e.preventDefault();
  const templateData = {
    nama_templat: document.getElementById('tpl-nama').value,
    kategori: document.getElementById('tpl-kategori').value,
    tipe_database: document.getElementById('tpl-tipe-db').value,
    link_templat: document.getElementById('tpl-link').value,
    thumbnail_url: document.getElementById('tpl-thumbnail').value,
    deskripsi: document.getElementById('tpl-deskripsi').value,
    status: 'Aktif',
  };

  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(templateData),
    });
    const data = await res.json();

    if (res.status === 201) {
      alert(data.message);
      closeModal('modal-create-template');
      elements.formCreateTemplate.reset();
      loadTemplates();
    } else {
      alert(`Gagal membuat templat: ${data.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

function switchAdminTab(tab) {
  if (tab === 'villages') {
    elements.tabVillages.classList.add('active');
    elements.tabTemplates.classList.remove('active');
    elements.tabContentVillages.style.display = 'block';
    elements.tabContentTemplates.style.display = 'none';
  } else {
    elements.tabTemplates.classList.add('active');
    elements.tabVillages.classList.remove('active');
    elements.tabContentTemplates.style.display = 'block';
    elements.tabContentVillages.style.display = 'none';
  }
}

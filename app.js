// State Aplikasi SPA
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  templates: [],
  villages: [],
  hostedWebsites: [],
  activeMainTab: 'templates',
  selectedCategory: '',
  searchQuery: '',
  hostedSelectedCategory: '',
  hostedSearchQuery: '',
  activeReviewTemplateId: null,
  selectedRating: 5,
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

  // Navigasi Utama Tab Portal (Templat vs Web Desa Hosting)
  tabNavTemplates: document.getElementById('tab-nav-templates'),
  tabNavHosted: document.getElementById('tab-nav-hosted'),
  sectionTemplatesView: document.getElementById('section-templates-view'),
  sectionHostedView: document.getElementById('section-hosted-view'),

  // Galeri & Filter Templat Master
  templateGrid: document.getElementById('template-grid'),
  searchInput: document.getElementById('search-input'),
  filterPills: document.getElementById('filter-pills'),

  // Direktori Web Desa Hosting
  hostedGrid: document.getElementById('hosted-grid'),
  searchHostedInput: document.getElementById('search-hosted-input'),
  hostedFilterPills: document.getElementById('hosted-filter-pills'),
  hostedCount: document.getElementById('hosted-count'),
  btnSwitchToTemplates: document.getElementById('btn-switch-to-templates'),

  // Admin Dashboard
  adminDashboardSection: document.getElementById('admin-dashboard-section'),
  tabVillages: document.getElementById('tab-villages'),
  tabTemplates: document.getElementById('tab-templates'),
  tabHostedAdmin: document.getElementById('tab-hosted-admin'),
  tabContentVillages: document.getElementById('tab-content-villages'),
  tabContentTemplates: document.getElementById('tab-content-templates'),
  tabContentHostedAdmin: document.getElementById('tab-content-hosted-admin'),
  tableVillagesBody: document.getElementById('table-villages-body'),
  tableTemplatesBody: document.getElementById('table-templates-body'),
  tableHostedBody: document.getElementById('table-hosted-body'),
  adminHostedCount: document.getElementById('admin-hosted-count'),
  pendingCount: document.getElementById('pending-count'),

  // Buttons Modal Trigger
  btnOpenLoginDesa: document.getElementById('btn-open-login-desa'),
  btnOpenRegisterDesa: document.getElementById('btn-open-register-desa'),
  btnOpenLoginBps: document.getElementById('btn-open-login-bps'),
  btnOpenCreateTemplate: document.getElementById('btn-open-create-template'),
  btnOpenCreateHosted: document.getElementById('btn-open-create-hosted'),
  btnOpenCreateHostedSub: document.getElementById('btn-open-create-hosted-sub'),

  // Modals
  modalLoginDesa: document.getElementById('modal-login-desa'),
  modalRegisterDesa: document.getElementById('modal-register-desa'),
  modalLoginBps: document.getElementById('modal-login-bps'),
  modalCreateTemplate: document.getElementById('modal-create-template'),
  modalCreateHosted: document.getElementById('modal-create-hosted'),

  // Forms
  formLoginDesa: document.getElementById('form-login-desa'),
  formRegisterDesa: document.getElementById('form-register-desa'),
  formLoginBps: document.getElementById('form-login-bps'),
  formCreateTemplate: document.getElementById('form-create-template'),
  formCreateHosted: document.getElementById('form-create-hosted'),
};

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthSession();
  loadTemplates();
  checkAdminRoute();
  window.addEventListener('hashchange', checkAdminRoute);
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
  elements.formCreateHosted?.addEventListener('submit', handleCreateHosted);
  document.getElementById('form-submit-review')?.addEventListener('submit', handleReviewSubmit);

  // Navigasi Tab Utama Portal (Templat vs Web Desa Hosting)
  elements.tabNavTemplates?.addEventListener('click', () => switchMainPortalTab('templates'));
  elements.tabNavHosted?.addEventListener('click', () => switchMainPortalTab('hosted'));
  elements.btnSwitchToTemplates?.addEventListener('click', () => switchMainPortalTab('templates'));

  // Setup interactive star rating picker
  setupStarPicker();

  // Logout & Dashboard Scroll
  elements.btnLogout?.addEventListener('click', handleLogout);
  elements.btnDashboard?.addEventListener('click', () => {
    elements.adminDashboardSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Search & Filter Templat
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

  // Search & Filter Web Desa Hosting
  let searchHostedTimeout;
  elements.searchHostedInput?.addEventListener('input', (e) => {
    clearTimeout(searchHostedTimeout);
    state.hostedSearchQuery = e.target.value;
    searchHostedTimeout = setTimeout(() => loadHostedWebsites(), 300);
  });

  elements.hostedFilterPills?.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.hostedFilterPills.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.hostedSelectedCategory = pill.getAttribute('data-category');
      loadHostedWebsites();
    });
  });

  // Admin Dashboard Tabs
  elements.tabVillages?.addEventListener('click', () => switchAdminTab('villages'));
  elements.tabTemplates?.addEventListener('click', () => switchAdminTab('templates'));
  elements.tabHostedAdmin?.addEventListener('click', () => switchAdminTab('hosted'));

  // Admin Buttons Web Desa Hosting
  elements.btnOpenCreateHosted?.addEventListener('click', () => openModal('modal-create-hosted'));
  elements.btnOpenCreateHostedSub?.addEventListener('click', () => openModal('modal-create-hosted'));

  // Guest Benefits & Sticky Buttons
  document.getElementById('btn-benefit-register')?.addEventListener('click', () => openModal('modal-register-desa'));
  document.getElementById('btn-benefit-guide')?.addEventListener('click', () => {
    alert('Informasi Panduan & Syarat Akses Galeri Templat BPS Subang:\n\n1. Layanan terbuka untuk seluruh Pemerintahan Desa di Kabupaten Subang.\n2. Lakukan "Registrasi Akun Desa" untuk membuka akses review lengkap, telaah arsitektur, dan live demo.\n3. Pendampingan integrasi data dan pelatihan teknis disediakan oleh tim BPS Kabupaten Subang.');
  });
  document.getElementById('btn-sticky-register')?.addEventListener('click', () => openModal('modal-register-desa'));
  document.getElementById('btn-sticky-login')?.addEventListener('click', () => openModal('modal-login-desa'));
  document.getElementById('meta-status-badge')?.addEventListener('click', () => {
    if (!state.user) openModal('modal-login-desa');
  });

  // Clear input error highlight on typing
  ['login-desa-email', 'login-desa-password', 'login-bps-email', 'login-bps-password', 'reg-email', 'reg-password'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      e.target.classList.remove('input-error');
    });
  });

  // Akses Internal BPS via Link Footer
  document.getElementById('link-footer-admin-bps')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.token && state.user?.role === 'bps') {
      elements.adminDashboardSection?.scrollIntoView({ behavior: 'smooth' });
    } else {
      openModal('modal-login-bps');
    }
  });

  // Shortcut Keyboard Khusus Staf BPS: Ctrl + Shift + B
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
      e.preventDefault();
      if (state.token && state.user?.role === 'bps') {
        elements.adminDashboardSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        openModal('modal-login-bps');
      }
    }
  });

  // Akses Rahasia: Klik Logo BPS 3x Cepat
  let logoClickCount = 0;
  let logoClickTimer;
  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 800);
    if (logoClickCount >= 3) {
      e.preventDefault();
      logoClickCount = 0;
      if (state.token && state.user?.role === 'bps') {
        elements.adminDashboardSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        openModal('modal-login-bps');
      }
    }
  });

  // Mobile Drawer Navigation
  setupMobileDrawer();
}

// Pemeriksaan Rute /admin atau #admin
function checkAdminRoute() {
  const isUrlAdmin = window.location.pathname === '/admin' || window.location.hash === '#admin';
  if (isUrlAdmin) {
    if (state.token && state.user?.role === 'bps') {
      setTimeout(() => {
        elements.adminDashboardSection?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      setTimeout(() => {
        openModal('modal-login-bps');
      }, 150);
    }
  }
}

// Inisialisasi Mobile Drawer & Off-Canvas Menu
function setupMobileDrawer() {
  const btnHamburger = document.getElementById('btn-hamburger');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');
  const drawer = document.getElementById('mobile-drawer');

  function openDrawer() {
    drawer?.classList.add('open');
    drawerOverlay?.classList.add('open');
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    drawerOverlay?.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }

  btnHamburger?.addEventListener('click', openDrawer);
  btnCloseDrawer?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  // Drawer Auth Actions
  document.getElementById('btn-drawer-login-desa')?.addEventListener('click', () => {
    closeDrawer();
    openModal('modal-login-desa');
  });
  document.getElementById('btn-drawer-register-desa')?.addEventListener('click', () => {
    closeDrawer();
    openModal('modal-register-desa');
  });
  document.getElementById('btn-drawer-logout')?.addEventListener('click', () => {
    closeDrawer();
    handleLogout();
  });
  document.getElementById('btn-drawer-dashboard')?.addEventListener('click', () => {
    closeDrawer();
    elements.adminDashboardSection?.scrollIntoView({ behavior: 'smooth' });
  });

  // Drawer Page Links
  document.getElementById('drawer-nav-templates')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeDrawer();
    switchMainPortalTab('templates');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('drawer-nav-hosted')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeDrawer();
    switchMainPortalTab('hosted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('drawer-nav-benefits')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeDrawer();
    document.getElementById('benefits-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// Global modal helpers
window.openModal = openModal;
window.closeModal = closeModal;

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    modal.querySelectorAll('.auth-alert').forEach(clearAuthAlert);
    modal.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    modal.querySelectorAll('.auth-alert').forEach(clearAuthAlert);
    modal.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
  }
}

// Auth Alert Helpers with Countdown
let authAlertTimeouts = {};

function showAuthAlert(alertEl, type, title, message, durationMs = 3000) {
  if (!alertEl) return;
  const id = alertEl.id;
  if (authAlertTimeouts[id]) {
    clearTimeout(authAlertTimeouts[id]);
  }

  const isError = type === 'error';
  const icon = isError
    ? '<i class="fa-solid fa-circle-exclamation"></i>'
    : '<i class="fa-solid fa-circle-check"></i>';

  alertEl.className = `auth-alert ${isError ? 'auth-alert-error' : 'auth-alert-success'}`;
  alertEl.innerHTML = `
    ${icon}
    <div style="flex: 1;">
      <strong style="display: block; font-size: 0.95rem; margin-bottom: 2px;">${title}</strong>
      <div style="font-size: 0.85rem; line-height: 1.4;">${message}</div>
      ${isError && durationMs > 0 ? `<div class="auth-alert-timer"><div class="auth-alert-timer-bar" style="animation-duration: ${durationMs / 1000}s;"></div></div>` : ''}
    </div>
  `;
  alertEl.style.opacity = '1';
  alertEl.style.display = 'flex';

  if (durationMs > 0) {
    authAlertTimeouts[id] = setTimeout(() => {
      alertEl.style.opacity = '0';
      setTimeout(() => {
        alertEl.style.display = 'none';
        alertEl.style.opacity = '1';
      }, 350);
    }, durationMs);
  }
}

function clearAuthAlert(alertEl) {
  if (!alertEl) return;
  alertEl.style.display = 'none';
  if (authAlertTimeouts[alertEl.id]) {
    clearTimeout(authAlertTimeouts[alertEl.id]);
  }
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
  const guestNoticeBox = document.getElementById('guest-notice-box');
  const stickyBottomBar = document.getElementById('sticky-bottom-bar');
  const metaStatusBadge = document.getElementById('meta-status-badge');
  const benefitsSection = document.getElementById('benefits-section');

  const drawerGuest = document.getElementById('drawer-guest');
  const drawerUserProfile = document.getElementById('drawer-user-profile');
  const drawerUserName = document.getElementById('drawer-user-name');
  const drawerUserRole = document.getElementById('drawer-user-role');
  const btnDrawerDashboard = document.getElementById('btn-drawer-dashboard');

  if (isLoggedIn && state.user) {
    elements.navGuest.style.display = 'none';
    elements.navUserProfile.style.display = 'flex';
    elements.userDisplayName.textContent = state.user.nama || state.user.nama_desa || state.user.email;
    elements.userDisplayRole.textContent = state.user.role.toUpperCase();

    // Sync Mobile Drawer
    if (drawerGuest) drawerGuest.style.display = 'none';
    if (drawerUserProfile) drawerUserProfile.style.display = 'block';
    if (drawerUserName) drawerUserName.textContent = state.user.nama || state.user.nama_desa || state.user.email;
    if (drawerUserRole) drawerUserRole.textContent = state.user.role.toUpperCase();
    if (btnDrawerDashboard) {
      btnDrawerDashboard.style.display = (state.user.role === 'bps') ? 'flex' : 'none';
    }

    if (guestNoticeBox) guestNoticeBox.style.display = 'none';
    if (stickyBottomBar) stickyBottomBar.style.display = 'none';
    if (benefitsSection) benefitsSection.style.display = 'none';
    if (metaStatusBadge) {
      metaStatusBadge.textContent = 'Status: Akses Penuh Terbuka (' + state.user.role.toUpperCase() + ')';
      metaStatusBadge.style.color = '#16a34a';
      metaStatusBadge.style.borderBottom = 'none';
    }

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

    // Sync Mobile Drawer
    if (drawerGuest) drawerGuest.style.display = 'flex';
    if (drawerUserProfile) drawerUserProfile.style.display = 'none';

    if (guestNoticeBox) guestNoticeBox.style.display = 'flex';
    if (stickyBottomBar) stickyBottomBar.style.display = 'flex';
    if (benefitsSection) benefitsSection.style.display = 'block';
    if (metaStatusBadge) {
      metaStatusBadge.textContent = 'Status: Publik Terbatas';
      metaStatusBadge.style.color = 'var(--bps-blue)';
      metaStatusBadge.style.borderBottom = '1px dashed var(--bps-blue)';
    }
  }

  // Render ulang kartu templat agar tombol berubah sesuai status login
  if (state.templates && state.templates.length > 0) {
    renderTemplateCards(state.templates);
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
  const templateCountEl = document.getElementById('template-count');
  if (templateCountEl) {
    templateCountEl.textContent = templates ? templates.length : 0;
  }

  if (!templates || templates.length === 0) {
    elements.templateGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="controls-card">
        <i class="fa-solid fa-folder-open fa-3x" style="color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>Tidak Ada Templat Ditemukan</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
      </div>`;
    return;
  }

  const isGuest = !state.user;

  elements.templateGrid.innerHTML = templates
    .map((t) => {
      const defaultImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600';
      const thumbnail = formatThumbnailUrl(t.thumbnail_url);
      const totalReviews = typeof t.total_reviews === 'number' ? t.total_reviews : 0;
      const displayRating = t.rating ? Number(t.rating).toFixed(1) : '5.0';

      const statusBadge = t.status && t.status !== 'Aktif' 
        ? `<span class="card-badge" style="background: rgba(245,158,11,0.9); color: white;">${t.status}</span>`
        : `<span class="card-badge">${t.kategori}</span>`;

      const rightBadge = isGuest
        ? `<span class="badge-locked"><i class="fa-solid fa-lock"></i> Butuh Akun Desa</span>`
        : `<span class="card-db-badge">${t.tipe_database}</span>`;

      const actionButton = isGuest
        ? `<button onclick="openModal('modal-login-desa')" class="btn-locked-access">
             <i class="fa-solid fa-lock" style="color: #fbbf24;"></i> Login untuk Akses Review &amp; Demo
           </button>`
        : `<div class="card-actions-dual">
             <button onclick="openReviewModal('${t.id}', '${escapeHtml(t.nama_templat)}')" class="btn btn-secondary btn-sm" style="font-weight: 700; color: var(--bps-navy); justify-content: center;">
               <i class="fa-solid fa-star" style="color: #f59e0b;"></i> Ulasan (${totalReviews})
             </button>
             <a href="${t.link_templat}" target="_blank" class="btn btn-primary btn-sm" style="font-weight: 700; justify-content: center;">
               Live Demo <i class="fa-solid fa-arrow-up-right-from-square"></i>
             </a>
           </div>`;

      const ratingRow = isGuest
        ? `<div class="card-rating-row" style="cursor: pointer;" onclick="openReviewModal('${t.id}', '${escapeHtml(t.nama_templat)}')">
             <div class="stars">
               ${renderStarsHtml(t.rating || 5)}
               <span class="rating-text">(${totalReviews} Ulasan)</span>
             </div>
             <span class="lock-review-label"><i class="fa-solid fa-lock"></i> Review Terkunci</span>
           </div>`
        : `<div class="card-rating-row" style="cursor: pointer;" onclick="openReviewModal('${t.id}', '${escapeHtml(t.nama_templat)}')">
             <div class="stars">
               ${renderStarsHtml(t.rating || 5)}
               <span class="rating-text">(${totalReviews} Ulasan • ${displayRating}/5.0)</span>
             </div>
             <span style="color: #16a34a; font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-pen-to-square"></i> Beri Ulasan</span>
           </div>`;

      return `
        <div class="template-card">
          <div class="card-thumb">
            <img src="${thumbnail}" alt="${t.nama_templat}" onerror="this.src='${defaultImg}'">
            ${statusBadge}
            ${rightBadge}
          </div>
          <div class="card-body">
            <span class="card-id-tag">ID: ${t.id}</span>
            <h3 class="card-title">${t.nama_templat}</h3>
            <p class="card-desc">${t.deskripsi || 'Templat resmi website desa binaan BPS Kabupaten Subang.'}</p>
            ${ratingRow}
            <div class="card-footer" style="padding-top: 0; border-top: none;">
              ${actionButton}
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
  const alertEl = document.getElementById('register-desa-alert');
  const btnSubmit = elements.formRegisterDesa.querySelector('button[type="submit"]');
  const originalBtnText = btnSubmit.innerHTML;

  clearAuthAlert(alertEl);

  const formData = {
    nama_desa: document.getElementById('reg-nama-desa').value.trim(),
    kecamatan: document.getElementById('reg-kecamatan').value.trim(),
    kabupaten: document.getElementById('reg-kabupaten').value.trim(),
    provinsi: document.getElementById('reg-provinsi').value.trim(),
    nama_pic: document.getElementById('reg-nama-pic').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
  };

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftarkan desa...';

  try {
    const res = await fetch('/api/auth/register/desa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (res.status === 201) {
      showAuthAlert(alertEl, 'success', 'Registrasi Berhasil!', 'Akun desa Anda langsung aktif! Mengalihkan ke form login...', 2500);
      btnSubmit.innerHTML = '<i class="fa-solid fa-circle-check"></i> Berhasil Didaftarkan!';
      btnSubmit.style.background = '#16a34a';

      setTimeout(() => {
        closeModal('modal-register-desa');
        elements.formRegisterDesa.reset();
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.style.background = '';
        clearAuthAlert(alertEl);

        // Buka form login desa dengan email otomatis terisi
        openModal('modal-login-desa');
        const loginEmail = document.getElementById('login-desa-email');
        if (loginEmail) {
          loginEmail.value = formData.email;
          document.getElementById('login-desa-password')?.focus();
        }
      }, 1500);
    } else {
      showAuthAlert(alertEl, 'error', 'Registrasi Gagal', data.message || 'Gagal mendaftarkan akun desa.', 3000);
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  } catch (err) {
    showAuthAlert(alertEl, 'error', 'Gangguan Koneksi', 'Terjadi kesalahan jaringan.', 3000);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalBtnText;
  }
}

async function handleLoginDesa(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-desa-email');
  const passwordInput = document.getElementById('login-desa-password');
  const alertEl = document.getElementById('login-desa-alert');
  const btnSubmit = elements.formLoginDesa.querySelector('button[type="submit"]');
  const originalBtnText = btnSubmit.innerHTML;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Reset errors
  emailInput.classList.remove('input-error');
  passwordInput.classList.remove('input-error');
  clearAuthAlert(alertEl);

  if (!email || !password) {
    if (!email) emailInput.classList.add('input-error');
    if (!password) passwordInput.classList.add('input-error');
    showAuthAlert(alertEl, 'error', 'Data Belum Lengkap', 'Silakan masukkan email dan password akun desa Anda.', 3000);
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa data login...';

  try {
    const res = await fetch('/api/auth/login/desa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      btnSubmit.innerHTML = '<i class="fa-solid fa-circle-check"></i> Login Berhasil!';
      btnSubmit.style.background = '#16a34a';
      btnSubmit.style.borderColor = '#16a34a';
      showAuthAlert(alertEl, 'success', 'Login Berhasil!', `Selamat datang, ${data.user.nama_desa}. Membuka akses...`, 2000);

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        updateUIAuth(true);
        closeModal('modal-login-desa');
        elements.formLoginDesa.reset();
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.style.background = '';
        btnSubmit.style.borderColor = '';
        clearAuthAlert(alertEl);
      }, 1200);
    } else {
      // Login gagal: salah password atau email
      emailInput.classList.add('input-error');
      passwordInput.classList.add('input-error');

      let errorMsg = data.message || 'Email atau password yang Anda masukkan salah.';
      if (res.status === 401) {
        errorMsg = 'Email atau password yang Anda masukkan salah. Mohon periksa kembali.';
      }

      showAuthAlert(alertEl, 'error', 'Login Desa Gagal', errorMsg, 3000);

      btnSubmit.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Password / Email Salah';
      btnSubmit.style.background = '#dc2626';
      btnSubmit.style.borderColor = '#dc2626';

      setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.style.background = '';
        btnSubmit.style.borderColor = '';
      }, 2000);
    }
  } catch (err) {
    console.error('Login error:', err);
    showAuthAlert(alertEl, 'error', 'Gangguan Koneksi', 'Gagal terhubung ke server. Silakan periksa koneksi internet Anda.', 3000);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalBtnText;
  }
}

async function handleLoginBps(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-bps-email');
  const passwordInput = document.getElementById('login-bps-password');
  const alertEl = document.getElementById('login-bps-alert');
  const btnSubmit = elements.formLoginBps.querySelector('button[type="submit"]');
  const originalBtnText = btnSubmit.innerHTML;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  emailInput.classList.remove('input-error');
  passwordInput.classList.remove('input-error');
  clearAuthAlert(alertEl);

  if (!email || !password) {
    if (!email) emailInput.classList.add('input-error');
    if (!password) passwordInput.classList.add('input-error');
    showAuthAlert(alertEl, 'error', 'Data Belum Lengkap', 'Silakan masukkan email dan password Admin BPS.', 3000);
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa data login...';

  try {
    const res = await fetch('/api/auth/login/bps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      btnSubmit.innerHTML = '<i class="fa-solid fa-circle-check"></i> Login Berhasil!';
      btnSubmit.style.background = '#16a34a';
      btnSubmit.style.borderColor = '#16a34a';
      showAuthAlert(alertEl, 'success', 'Login Admin Berhasil!', `Selamat datang, ${data.user.nama}. Membuka panel...`, 2000);

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        updateUIAuth(true);
        closeModal('modal-login-bps');
        loadAdminDashboardData();
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.style.background = '';
        btnSubmit.style.borderColor = '';
        clearAuthAlert(alertEl);
      }, 1200);
    } else {
      emailInput.classList.add('input-error');
      passwordInput.classList.add('input-error');

      let errorMsg = data.message || 'Email atau password Admin BPS salah.';
      if (res.status === 401) {
        errorMsg = 'Email atau password Admin BPS yang Anda masukkan salah. Mohon periksa kembali.';
      }

      showAuthAlert(alertEl, 'error', 'Login Admin BPS Gagal', errorMsg, 3000);

      btnSubmit.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Password / Email Salah';
      btnSubmit.style.background = '#dc2626';
      btnSubmit.style.borderColor = '#dc2626';

      setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.style.background = '';
        btnSubmit.style.borderColor = '';
      }, 2000);
    }
  } catch (err) {
    console.error('Login BPS error:', err);
    showAuthAlert(alertEl, 'error', 'Gangguan Koneksi', 'Gagal terhubung ke server. Silakan coba sesaat lagi.', 3000);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalBtnText;
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
      loadHostedWebsites();
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
    elements.tabVillages?.classList.add('active');
    elements.tabTemplates?.classList.remove('active');
    elements.tabHostedAdmin?.classList.remove('active');
    if (elements.tabContentVillages) elements.tabContentVillages.style.display = 'block';
    if (elements.tabContentTemplates) elements.tabContentTemplates.style.display = 'none';
    if (elements.tabContentHostedAdmin) elements.tabContentHostedAdmin.style.display = 'none';
  } else if (tab === 'templates') {
    elements.tabTemplates?.classList.add('active');
    elements.tabVillages?.classList.remove('active');
    elements.tabHostedAdmin?.classList.remove('active');
    if (elements.tabContentTemplates) elements.tabContentTemplates.style.display = 'block';
    if (elements.tabContentVillages) elements.tabContentVillages.style.display = 'none';
    if (elements.tabContentHostedAdmin) elements.tabContentHostedAdmin.style.display = 'none';
  } else if (tab === 'hosted') {
    elements.tabHostedAdmin?.classList.add('active');
    elements.tabVillages?.classList.remove('active');
    elements.tabTemplates?.classList.remove('active');
    if (elements.tabContentHostedAdmin) elements.tabContentHostedAdmin.style.display = 'block';
    if (elements.tabContentVillages) elements.tabContentVillages.style.display = 'none';
    if (elements.tabContentTemplates) elements.tabContentTemplates.style.display = 'none';
    loadHostedWebsites();
  }
}

// ==========================================================================
// PORTAL MAIN TABS & HOSTED WEBSITES DIRECTORY
// ==========================================================================

function switchMainPortalTab(tab) {
  state.activeMainTab = tab;
  const tabNavTemplates = document.getElementById('tab-nav-templates');
  const tabNavHosted = document.getElementById('tab-nav-hosted');
  const sectionTemplates = document.getElementById('section-templates-view');
  const sectionHosted = document.getElementById('section-hosted-view');
  const heroDescription = document.getElementById('hero-description');

  if (tab === 'templates') {
    tabNavTemplates?.classList.add('active');
    tabNavHosted?.classList.remove('active');
    if (sectionTemplates) sectionTemplates.style.display = 'block';
    if (sectionHosted) sectionHosted.style.display = 'none';
    if (heroDescription) {
      heroDescription.textContent = 'Pilih dan gunakan templat website berstandar statistik nasional untuk mewujudkan Satu Data Desa di seluruh wilayah Kabupaten Subang. Terintegrasi, responsif, dan siap pakai.';
    }
    // Sync Drawer Nav Link
    document.getElementById('drawer-nav-templates')?.classList.add('active');
    document.getElementById('drawer-nav-hosted')?.classList.remove('active');
  } else {
    tabNavHosted?.classList.add('active');
    tabNavTemplates?.classList.remove('active');
    if (sectionTemplates) sectionTemplates.style.display = 'none';
    if (sectionHosted) sectionHosted.style.display = 'block';
    if (heroDescription) {
      heroDescription.textContent = 'Jelajahi direktori website desa di Kabupaten Subang yang telah memilih templat berstandar BPS dan sudah aktif di-hosting online.';
    }
    // Sync Drawer Nav Link
    document.getElementById('drawer-nav-hosted')?.classList.add('active');
    document.getElementById('drawer-nav-templates')?.classList.remove('active');
    loadHostedWebsites();
  }
}

async function loadHostedWebsites() {
  const hostedGrid = document.getElementById('hosted-grid');
  const hostedCount = document.getElementById('hosted-count');
  if (!hostedGrid) return;

  hostedGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
      <p style="margin-top: 1rem;">Memuat daftar website desa yang sudah hosting...</p>
    </div>`;

  try {
    let url = `/api/hosted-websites?kategori=${encodeURIComponent(state.hostedSelectedCategory)}&search=${encodeURIComponent(state.hostedSearchQuery)}`;
    if (state.user && state.user.role === 'bps') {
      url += '&includeAll=true';
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success') {
      state.hostedWebsites = data.data;
      renderHostedWebsites(data.data);
      if (state.user && state.user.role === 'bps') {
        renderAdminHostedTable(data.data);
      }
    } else {
      hostedGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Gagal memuat web desa: ${data.message}</p>`;
    }
  } catch (err) {
    console.error('Fetch hosted websites error:', err);
    hostedGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Koneksi terganggu. Gagal memuat daftar web desa terhosting.</p>`;
  }
}

function renderHostedWebsites(sites) {
  const hostedGrid = document.getElementById('hosted-grid');
  const hostedCount = document.getElementById('hosted-count');
  if (hostedCount) hostedCount.textContent = sites ? sites.length : 0;
  if (!hostedGrid) return;

  if (!sites || sites.length === 0) {
    hostedGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="controls-card">
        <i class="fa-solid fa-globe fa-3x" style="color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>Tidak Ada Website Desa Ditemukan</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Coba gunakan kata kunci pencarian nama desa atau kecamatan yang berbeda.</p>
      </div>`;
    return;
  }

  const defaultImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600';

  hostedGrid.innerHTML = sites.map((s) => {
    const defaultImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600';
    const thumb = formatThumbnailUrl(s.thumbnail_url);
    const dbBadge = s.tipe_database === 'Spreadsheet'
      ? `<span class="card-db-badge"><i class="fa-solid fa-table"></i> Spreadsheet</span>`
      : `<span class="card-db-badge"><i class="fa-solid fa-code"></i> Statis</span>`;

    return `
      <div class="template-card hosted-card">
        <div class="card-thumb">
          <img src="${thumb}" alt="${escapeHtml(s.nama_desa)}" onerror="this.src='${defaultImg}'">
          <span class="badge-live-online"><span class="beacon-dot"></span> Online / Live</span>
          <span class="card-badge" style="top: auto; bottom: 12px; left: 12px;">${escapeHtml(s.kategori)}</span>
          <span style="position: absolute; bottom: 12px; right: 12px;">${dbBadge}</span>
        </div>
        <div class="card-body">
          <span class="card-id-tag">ID: ${escapeHtml(s.id)}</span>
          <h3 class="card-title" style="margin-bottom: 4px;">${escapeHtml(s.nama_desa)}</h3>
          <div class="hosted-location-row">
            <i class="fa-solid fa-location-dot" style="color: var(--bps-orange);"></i> ${escapeHtml(s.kecamatan)}, Kab. Subang
          </div>
          <div class="hosted-meta-pill">
            <i class="fa-solid fa-layer-group" style="color: var(--bps-blue);"></i>
            <span>Templat: <strong>${escapeHtml(s.nama_templat)}</strong></span>
          </div>
          <div class="card-footer" style="padding-top: 0; border-top: none;">
            <a href="${s.link_hosting}" target="_blank" rel="noopener noreferrer" class="btn-visit-hosted">
              <i class="fa-solid fa-globe"></i> Kunjungi Website Resmi Desa <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8rem; margin-left: 4px;"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminHostedTable(sites) {
  const tableBody = document.getElementById('table-hosted-body');
  const countEl = document.getElementById('admin-hosted-count');
  if (countEl) countEl.textContent = sites ? sites.length : 0;
  if (!tableBody) return;

  if (!sites || sites.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Belum ada website desa yang didaftarkan ke direktori hosting.</td></tr>`;
    return;
  }

  tableBody.innerHTML = sites.map((s) => `
    <tr>
      <td><code>${escapeHtml(s.id)}</code></td>
      <td><strong>${escapeHtml(s.nama_desa)}</strong></td>
      <td>${escapeHtml(s.kecamatan)}</td>
      <td>${escapeHtml(s.kategori)}</td>
      <td>${escapeHtml(s.nama_templat)}</td>
      <td><span class="card-db-badge" style="font-size: 0.75rem;">${escapeHtml(s.tipe_database)}</span></td>
      <td><span class="status-badge status-approved">${escapeHtml(s.status)}</span></td>
      <td><a href="${s.link_hosting}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Website</a></td>
    </tr>
  `).join('');
}

async function handleCreateHosted(e) {
  e.preventDefault();
  const alertEl = document.getElementById('create-hosted-alert');
  clearAuthAlert(alertEl);

  const newHostedData = {
    nama_desa: document.getElementById('hosted-nama-desa').value.trim(),
    kecamatan: document.getElementById('hosted-kecamatan').value.trim(),
    kategori: document.getElementById('hosted-kategori').value,
    tipe_database: document.getElementById('hosted-tipe-db').value,
    nama_templat: document.getElementById('hosted-nama-templat').value.trim(),
    link_hosting: document.getElementById('hosted-link').value.trim(),
    thumbnail_url: document.getElementById('hosted-thumbnail').value.trim(),
    status: document.getElementById('hosted-status').value,
  };

  try {
    const res = await fetch('/api/hosted-websites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(newHostedData),
    });
    const data = await res.json();

    if (res.status === 201) {
      alert(data.message);
      closeModal('modal-create-hosted');
      document.getElementById('form-create-hosted').reset();
      loadHostedWebsites();
    } else {
      showAuthAlert(alertEl, 'error', 'Gagal Mendaftarkan', data.message, 3000);
    }
  } catch (err) {
    showAuthAlert(alertEl, 'error', 'Kesalahan Jaringan', 'Terjadi kesalahan saat menyimpan data website hosting.', 3000);
  }
}

// ==========================================================================
// THUMBNAIL & IMAGE FORMATTING HELPER
// ==========================================================================

function formatThumbnailUrl(url) {
  const defaultImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600';
  if (!url || typeof url !== 'string') return defaultImg;
  url = url.trim();

  // 1. Jika link Google Drive (mengubah link share biasa menjadi direct image URL)
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[1];
  }

  // 2. Jika rumus =IMAGE("...") dari Google Spreadsheet
  const formulaMatch = url.match(/=IMAGE\s*\(\s*["']([^"']+)["']/i);
  if (formulaMatch && formulaMatch[1]) {
    return formulaMatch[1];
  }

  // 3. Jika URL mengandung placeholder "..."
  if (url.includes('...')) {
    return defaultImg;
  }

  // 4. Jika link gambar lokal server (/gambar/...) atau URL web langsung (http:// atau https://)
  if (url.startsWith('/gambar/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return defaultImg;
}

// ==========================================================================
// REVIEW & RATING HELPERS
// ==========================================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderStarsHtml(rating) {
  const rounded = Math.round(Number(rating) || 5);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      html += '<i class="fa-solid fa-star"></i>';
    } else {
      html += '<i class="fa-regular fa-star" style="color: #cbd5e1;"></i>';
    }
  }
  return html;
}

function setupStarPicker() {
  const starBtns = document.querySelectorAll('#star-picker .star-btn');
  const labelEl = document.getElementById('star-picker-label');
  const inputEl = document.getElementById('input-rating-value');
  const starLabels = {
    1: '1 Bintang (Kurang)',
    2: '2 Bintang (Cukup)',
    3: '3 Bintang (Baik)',
    4: '4 Bintang (Sangat Baik)',
    5: '5 Bintang (Luar Biasa)'
  };

  const updateStars = (rating) => {
    starBtns.forEach((btn) => {
      const starVal = parseInt(btn.getAttribute('data-rating'), 10);
      if (starVal <= rating) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (labelEl) labelEl.textContent = starLabels[rating] || `${rating} Bintang`;
    if (inputEl) inputEl.value = rating;
    state.selectedRating = rating;
  };

  starBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'), 10);
      updateStars(rating);
    });

    btn.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(btn.getAttribute('data-rating'), 10);
      starBtns.forEach((b) => {
        const val = parseInt(b.getAttribute('data-rating'), 10);
        if (val <= hoverVal) {
          b.classList.add('hover-active');
        } else {
          b.classList.remove('hover-active');
        }
      });
    });

    btn.addEventListener('mouseleave', () => {
      starBtns.forEach((b) => b.classList.remove('hover-active'));
    });
  });

  updateStars(5);
}

async function openReviewModal(templateId, templateName) {
  state.activeReviewTemplateId = templateId;
  const modal = document.getElementById('modal-template-review');
  if (!modal) return;

  const tplIdEl = document.getElementById('review-modal-tpl-id');
  const titleEl = document.getElementById('review-modal-title');
  if (tplIdEl) tplIdEl.textContent = templateId;
  if (titleEl) titleEl.textContent = `Ulasan: ${templateName}`;

  const formSection = document.getElementById('review-form-container');
  const guestPrompt = document.getElementById('review-guest-prompt');
  const reviewerBadge = document.getElementById('reviewer-badge-info');
  const alertEl = document.getElementById('review-form-alert');
  clearAuthAlert(alertEl);

  if (state.user) {
    if (formSection) formSection.style.display = 'block';
    if (guestPrompt) guestPrompt.style.display = 'none';
    if (reviewerBadge) {
      const reviewerName = state.user.nama_desa || state.user.nama || 'Admin Desa';
      reviewerBadge.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> Mengulas sebagai: <strong>${escapeHtml(reviewerName)}</strong>`;
    }
  } else {
    if (formSection) formSection.style.display = 'none';
    if (guestPrompt) guestPrompt.style.display = 'flex';
  }

  openModal('modal-template-review');
  await loadTemplateReviews(templateId);
}
window.openReviewModal = openReviewModal;

async function loadTemplateReviews(templateId) {
  const reviewsContainer = document.getElementById('reviews-list-items');
  const countSpan = document.getElementById('reviews-list-count');
  const avgScoreEl = document.getElementById('review-modal-avg-score');
  const starsSummaryEl = document.getElementById('review-modal-stars-summary');
  const countTextEl = document.getElementById('review-modal-count-text');

  if (reviewsContainer) {
    reviewsContainer.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar ulasan dari database...
      </div>`;
  }

  try {
    const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}/reviews`);
    const json = await res.json();

    if (json.status === 'success' && json.data) {
      const { reviews, totalReviews, averageRating } = json.data;

      if (countSpan) countSpan.textContent = totalReviews;
      if (avgScoreEl) avgScoreEl.textContent = totalReviews > 0 ? Number(averageRating).toFixed(1) : '5.0';
      if (starsSummaryEl) starsSummaryEl.innerHTML = renderStarsHtml(totalReviews > 0 ? averageRating : 5);
      if (countTextEl) countTextEl.textContent = `Berdasarkan ${totalReviews} ulasan terverifikasi`;

      if (!reviews || reviews.length === 0) {
        if (reviewsContainer) {
          reviewsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-md);">
              <i class="fa-solid fa-star-half-stroke fa-2x" style="color: var(--text-dim); margin-bottom: 0.5rem;"></i>
              <p style="font-weight: 600;">Belum ada ulasan untuk templat ini.</p>
              <p style="font-size: 0.825rem; margin-top: 2px;">Jadilah desa pertama di Kabupaten Subang yang memberikan rating evaluasi!</p>
            </div>`;
        }
        return;
      }

      if (reviewsContainer) {
        reviewsContainer.innerHTML = reviews.map((r) => {
          const rawDate = r.createdAt || r.created_at;
          const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'Baru saja';

          return `
            <div class="review-item-card">
              <div class="review-item-header">
                <span class="review-author-name">
                  <i class="fa-solid fa-landmark"></i> ${escapeHtml(r.reviewer_name)}
                </span>
                <span class="review-date-text">${formattedDate}</span>
              </div>
              <div class="review-item-stars">
                ${renderStarsHtml(r.rating)}
                <span style="font-size: 0.78rem; font-weight: 700; color: #b45309; margin-left: 4px;">(${r.rating}/5)</span>
              </div>
              <div class="review-item-comment">
                ${r.komentar ? escapeHtml(r.komentar) : '<em style="color: var(--text-dim); font-size: 0.85rem;">Tidak ada komentar tertulis.</em>'}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Fetch reviews error:', err);
    if (reviewsContainer) {
      reviewsContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Gagal memuat ulasan.</p>`;
    }
  }
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  if (!state.user || !state.token) {
    alert('Silakan login terlebih dahulu untuk memberikan ulasan.');
    openModal('modal-login-desa');
    return;
  }

  const templateId = state.activeReviewTemplateId;
  const rating = state.selectedRating || parseInt(document.getElementById('input-rating-value')?.value || '5', 10);
  const komentar = document.getElementById('input-review-comment')?.value.trim();
  const alertEl = document.getElementById('review-form-alert');
  const btnSubmit = document.getElementById('btn-submit-review');
  const originalBtnText = btnSubmit ? btnSubmit.innerHTML : 'Kirim Ulasan';

  clearAuthAlert(alertEl);

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan ke DB...';
  }

  try {
    const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ rating, komentar })
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      showAuthAlert(alertEl, 'success', 'Ulasan Berhasil Disimpan!', 'Terima kasih atas ulasan dan evaluasi Anda untuk templat ini.', 3000);

      const commentInput = document.getElementById('input-review-comment');
      if (commentInput) commentInput.value = '';

      await loadTemplateReviews(templateId);
      loadTemplates();

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tersimpan!';
        setTimeout(() => {
          btnSubmit.innerHTML = originalBtnText;
        }, 2000);
      }
    } else {
      showAuthAlert(alertEl, 'error', 'Gagal Menyimpan Ulasan', data.message || 'Terjadi kesalahan saat menyimpan ulasan.', 3000);
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
      }
    }
  } catch (err) {
    console.error('Submit review error:', err);
    showAuthAlert(alertEl, 'error', 'Gangguan Koneksi', 'Gagal terhubung ke server database.', 3000);
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  }
}

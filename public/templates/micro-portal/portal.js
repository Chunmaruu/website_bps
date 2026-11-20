(() => {
    'use strict';

    const get = id => document.getElementById(id);
    const show = (id, visible) => get(id).classList.toggle('hidden', !visible);
    const set = (id, value, fallback = '—') => { get(id).textContent = display(value, fallback); };
    const display = (value, fallback = '—') => {
        if (typeof value === 'number') return new Intl.NumberFormat('id-ID').format(value);
        return String(value ?? '').trim() || fallback;
    };
    const list = value => Array.isArray(value) ? value : [];
    const record = value => (Array.isArray(value) ? value[0] : value) || {};
    const node = (tag, className = '', content) => {
        const element = document.createElement(tag);
        element.className = className;
        if (content !== undefined) element.textContent = content;
        return element;
    };

    function httpsUrl(value) {
        try {
            const url = new URL(value);
            if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
        } catch {}
        return '';
    }

    function readPayload() {
        try { return JSON.parse(get('village-data')?.textContent || 'null'); }
        catch { return null; }
    }

    const payload = readPayload();
    const data = payload?.data;
    const profile = record(data?.identitas);
    if (!profile.namaDesa) {
        show('load-error', true);
        return;
    }

    const preview = payload.preview === true;
    const sitePath = /^\/desa\/[a-z0-9-]+$/.test(payload.sitePath || '') ? payload.sitePath : '';
    const villageName = /^desa\s/i.test(profile.namaDesa) ? profile.namaDesa : `Desa ${profile.namaDesa}`;
    const region = [profile.kecamatan, profile.kabupaten, profile.provinsi].filter(Boolean).join(', ');
    const potentials = list(data.potensiDesa);
    const documents = list(data.dokumenPublikasi);
    const headings = {
        home: 'Publikasi Data & Potensi',
        potensi: 'Potensi & Keunggulan Wilayah',
        'potensi-detail': 'Rincian Potensi & Keunggulan Wilayah',
        dokumen: 'Pusat Dokumen & Publikasi',
    };
    const navigationLabels = { home: 'Beranda Utama', potensi: 'Galeri Potensi', dokumen: 'Pusat Dokumen' };
    let activeView = 'home';

    set('header-village-tag', villageName);
    set('hero-village-name', villageName);
    set('hero-description', profile.deskripsi, '');
    set('hero-district', region);
    set('hero-code', profile.kodeDesa);
    set('footer-village-desc', `Portal data statistik ${villageName}${region ? `, ${region}` : ''}.`);
    set('footer-address', profile.alamatKantor);
    set('footer-email', profile.email);
    set('footer-phone', profile.telepon);
    show('preview-notice', preview);

    for (const image of document.querySelectorAll('[data-image-fallback]')) {
        const showFallback = () => {
            image.hidden = true;
            const fallback = get(image.dataset.imageFallback);
            fallback.classList.remove('hidden');
            fallback.classList.add('inline-flex');
        };
        image.addEventListener('error', showFallback, { once: true });
        if (image.complete && !image.naturalWidth) showFallback();
    }

    if (preview) {
        for (const link of document.querySelectorAll('a[target="_blank"]')) link.removeAttribute('href');
    }

    const macro = record(data.statistikMakro);
    set('stat-penduduk', macro.totalPenduduk);
    set('stat-luas', macro.luasWilayah);
    set('stat-kepadatan', macro.kepadatanPenduduk);
    set('stat-rtrw', `${display(macro.jumlahRt)} / ${display(macro.jumlahRw)}`);
    set('stat-kk-text', `${display(macro.jumlahKk)} KK`);

    const statisticTabs = {
        demografi: [
            { totalPenduduk: macro.totalPenduduk, ...record(data.statusPenduduk) },
            { totalPenduduk: 'Total penduduk', lakiLaki: 'Laki-laki', perempuan: 'Perempuan', rasioJenisKelamin: 'Rasio jenis kelamin' },
        ],
        sosial: [record(data.statistikSosial), {
            pendudukMiskin: 'Penduduk miskin', penerimaBansos: 'Penerima bantuan sosial',
            pendidikanDominan: 'Pendidikan dominan', fasilitasPendidikan: 'Fasilitas pendidikan',
            fasilitasKesehatan: 'Fasilitas kesehatan', penyandangDisabilitas: 'Penyandang disabilitas',
        }],
        ekonomi: [record(data.statistikEkonomi), {
            jumlahUmkm: 'Jumlah UMKM', jenisUsahaDominan: 'Jenis usaha dominan', saranaPerdagangan: 'Sarana perdagangan',
            pendapatanRataRata: 'Pendapatan rata-rata', hargaKomoditasUtama: 'Harga komoditas utama', angkatanKerja: 'Angkatan kerja',
        }],
        pertanian: [record(data.pertanianPeternakan), {
            luasLahanPertanian: 'Luas lahan pertanian', luasPanen: 'Luas panen', produksiPadi: 'Produksi padi',
            produksiJagung: 'Produksi jagung', produksiBawangMerah: 'Produksi bawang merah', produksiSayuran: 'Produksi sayuran',
            produksiBuah: 'Produksi buah', jumlahTernak: 'Jumlah ternak', produksiTelurDaging: 'Produksi telur dan daging',
            jumlahKelompokTani: 'Jumlah kelompok tani',
        }],
    };

    function facts(values, labels) {
        const items = node('dl', 'facts-grid');
        for (const [key, label] of Object.entries(labels)) {
            if (typeof values[key] !== 'number' && !display(values[key], '')) continue;
            const item = node('div', 'fact');
            item.append(node('dt', '', label), node('dd', '', display(values[key])));
            items.append(item);
        }
        return items;
    }

    for (const [tab, [values, labels]] of Object.entries(statisticTabs)) {
        const content = facts(values, labels);
        get(`container-stat-${tab}`).append(content.childElementCount ? content : node('p', 'empty-state', 'Data statistik belum tersedia.'));
    }

    function switchStatistics(tab) {
        if (!Object.hasOwn(statisticTabs, tab)) return;
        for (const name of Object.keys(statisticTabs)) {
            show(`stat-tab-content-${name}`, tab === name);
            get(`stat-tab-btn-${name}`).setAttribute('aria-pressed', String(tab === name));
        }
    }

    function menuOpen(open) {
        show('mobile-menu', open);
        get('mobile-menu-btn').setAttribute('aria-expanded', String(open));
        get('menu-icon').classList.toggle('fa-bars', !open);
        get('menu-icon').classList.toggle('fa-xmark', open);
    }

    function switchView(view, { updateUrl = true, scroll = true } = {}) {
        if (!Object.hasOwn(headings, view)) return;
        activeView = view;
        const nav = view === 'potensi-detail' ? 'potensi' : view;
        for (const name of Object.keys(headings)) show(`view-${name}`, name === view);
        for (const name of Object.keys(navigationLabels)) {
            for (const id of [`nav-tab-${name}`, `mobile-btn-${name}`]) {
                if (name === nav) get(id).setAttribute('aria-current', 'page');
                else get(id).removeAttribute('aria-current');
            }
        }
        set('hero-heading', headings[view]);
        set('menu-view-badge', navigationLabels[nav]);
        document.title = `${headings[view]} | ${villageName}`;
        if (updateUrl && !preview && sitePath && view !== 'potensi-detail') {
            const path = { home: sitePath, potensi: `${sitePath}#potensi`, dokumen: `${sitePath}/dokumen` }[view];
            if (path !== location.pathname + location.hash) history.pushState({}, '', path);
        }
        if (scroll) window.scrollTo(0, 0);
    }

    function initialView() {
        if (!preview && sitePath && location.pathname.replace(/\/$/, '') === `${sitePath}/dokumen`) return 'dokumen';
        if (!preview && sitePath && location.hash === '#potensi') return 'potensi';
        return preview && payload.page === 'dokumen' ? 'dokumen' : 'home';
    }

    function categoriesFor(items) {
        return [...new Set(items.map(item => display(item.kategori, '')).filter(Boolean))];
    }

    function renderPaged({ items, grid, filterBar, pagination, search, render, pageSize, empty }) {
        let category = '';
        let query = '';
        let page = 1;
        const filters = [['', 'Semua'], ...categoriesFor(items).map(value => [value, value])];
        filterBar.replaceChildren(...filters.map(([value, label]) => {
            const button = node('button', 'filter-button', label);
            button.type = 'button';
            button.dataset.filter = value;
            button.addEventListener('click', () => { category = value; page = 1; update(); });
            return button;
        }));
        if (search) search.addEventListener('input', () => {
            query = search.value.trim().toLocaleLowerCase('id');
            page = 1;
            update();
        });

        function update() {
            const matches = items.filter(item => (!category || item.kategori === category) && (
                !query || [item.judulPotensi, item.judul, item.kategori, item.deskripsi, item.tahun]
                    .some(value => String(value ?? '').toLocaleLowerCase('id').includes(query))
            ));
            for (const button of filterBar.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
            const pageCount = Math.ceil(matches.length / pageSize);
            const pageItems = matches.slice((page - 1) * pageSize, page * pageSize);
            render(grid, pageItems, matches.length ? '' : empty);
            pagination.classList.toggle('hidden', pageCount <= 1);
            const actions = node('div', 'pagination-actions');
            for (const [label, step, disabled] of [['Sebelumnya', -1, page === 1], ['Berikutnya', 1, page >= pageCount]]) {
                const button = node('button', 'filter-button', label);
                button.type = 'button';
                button.disabled = disabled;
                button.addEventListener('click', () => { page += step; update(); });
                actions.append(button);
            }
            pagination.replaceChildren(node('span', '', `Halaman ${page} dari ${pageCount}`), actions);
        }

        update();
    }

    function potentialPhoto(item) {
        const wrapper = node('div', 'potential-photo');
        const url = httpsUrl(item.urlFoto);
        if (url) {
            const photo = node('img');
            photo.alt = item.judulPotensi;
            photo.referrerPolicy = 'no-referrer';
            photo.loading = 'lazy';
            photo.addEventListener('error', () => photo.remove(), { once: true });
            photo.src = url;
            wrapper.append(photo);
        }
        return wrapper;
    }

    function showPotential(item) {
        const section = get('view-potensi-detail');
        const card = node('article', 'resource-card');
        const content = node('div', 'resource-content');
        const back = node('button', 'filter-button', 'Kembali ke galeri');
        back.type = 'button';
        back.addEventListener('click', () => switchView('potensi'));
        content.append(node('span', 'resource-badge', display(item.kategori, 'Potensi')), node('h3', '', item.judulPotensi),
            node('p', '', display(item.deskripsiLengkap || item.deskripsi, '')),
            facts(item, { lokasi: 'Lokasi', nilaiEkonomi: 'Nilai ekonomi', pengelola: 'Pengelola', keunggulanUtama: 'Keunggulan utama', kontakPengelola: 'Kontak pengelola' }));
        card.append(potentialPhoto(item), content);
        section.replaceChildren(back, card);
        switchView('potensi-detail', { updateUrl: false });
    }

    function renderPotentials(grid, items, empty) {
        grid.replaceChildren(...(items.length ? items.map(item => {
            const card = node('article', 'resource-card');
            const body = node('div', 'resource-content');
            const button = node('button', 'filter-button', 'Lihat detail');
            button.type = 'button';
            button.addEventListener('click', () => showPotential(item));
            body.append(node('span', 'resource-badge', display(item.kategori, 'Potensi')), node('h3', '', item.judulPotensi),
                node('p', 'resource-summary', display(item.deskripsi, '')), button);
            card.append(potentialPhoto(item), body);
            return card;
        }) : [node('p', 'empty-state', empty)]));
    }

    function documentLink(item) {
        const url = httpsUrl(item.urlDrive);
        if (!url || preview) return node('span', 'text-slate-500', url ? 'Tersedia setelah terbit' : 'Tautan belum tersedia');
        const link = node('a', 'filter-button document-link', 'Buka dokumen');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        return link;
    }

    function renderDocuments(grid, items, empty) {
        const mobile = get('document-mobile-cards');
        if (!items.length) {
            const tr = node('tr');
            const td = node('td', 'empty-state', empty);
            td.colSpan = 5;
            tr.append(td);
            grid.replaceChildren(tr);
            mobile.replaceChildren(node('p', 'empty-state', empty));
            return;
        }
        grid.replaceChildren(...items.map(item => {
            const row = node('tr');
            const title = node('td');
            title.append(node('strong', '', item.judul), node('p', 'text-slate-500', display(item.deskripsi, '')));
            const link = node('td');
            link.append(documentLink(item));
            row.append(title, node('td', '', display(item.kategori)), node('td', '', display(item.tahun)), node('td', '', display(item.ukuran)), link);
            return row;
        }));
        mobile.replaceChildren(...items.map(item => {
            const card = node('article', 'resource-card resource-content');
            card.append(node('span', 'resource-badge', display(item.kategori, 'Dokumen')), node('h3', '', item.judul),
                node('p', '', display(item.deskripsi, '')),
                node('p', '', [item.tahun, item.ukuran].filter(Boolean).join(' · ')), documentLink(item));
            return card;
        }));
    }

    for (const [suffix, pageSize, search] of [['', 3, null], ['-view', 9, get('potensi-search')]]) {
        renderPaged({ items: potentials, grid: get(`potensi${suffix}-grid`), filterBar: get(`potensi${suffix}-filter-bar`),
            pagination: get(`potensi${suffix}-pagination-container`), search, render: renderPotentials,
            pageSize, empty: 'Belum ada potensi desa yang cocok.' });
    }
    renderPaged({ items: documents, grid: get('document-table-body'), filterBar: get('doc-category-filter-bar'),
        pagination: get('document-pagination-container'), search: get('document-search'), render: renderDocuments,
        pageSize: 10, empty: 'Belum ada dokumen yang cocok.' });

    function numberId(value) {
        if (typeof value === 'number') return value;
        const raw = String(value ?? '').replace(/[%\s]/g, '');
        if (!raw) return 0;
        const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/\.(?=\d{3}(?:\.|$))/g, '');
        const number = Number(normalized);
        return Number.isFinite(number) && number > 0 ? number : 0;
    }

    function renderJobs(items) {
        const chart = get('jobChart');
        const legend = get('job-legend-list');
        const colors = ['#005baa', '#059669', '#d97706', '#0e7490', '#805ad5', '#b42360'];
        const total = items.reduce((sum, item) => sum + numberId(item.jumlah), 0);
        const weights = items.map(item => numberId(total ? item.jumlah : item.persentase));
        const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
        if (!items.length) {
            chart.hidden = true;
            legend.append(node('p', 'empty-state', 'Data mata pencaharian belum tersedia.'));
            return;
        }
        const ctx = chart.getContext('2d');
        let start = -Math.PI / 2;
        if (!weightTotal) chart.hidden = true;
        for (const [index, item] of items.entries()) {
            const color = colors[index % colors.length];
            if (ctx && weights[index]) {
                const portion = weights[index] / weightTotal * Math.PI * 2;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 30;
                ctx.arc(130, 130, 99, start, start + portion);
                ctx.stroke();
                start += portion;
            }
            const details = node('div', 'job-row');
            const percentage = numberId(item.persentase) || (weightTotal ? weights[index] / weightTotal * 100 : 0);
            const text = item.jumlah !== '' && item.jumlah !== undefined ? `${display(item.jumlah)} · ${display(Math.round(percentage * 10) / 10)}%` : `${display(Math.round(percentage * 10) / 10)}%`;
            details.append(node('strong', `job-label job-color-${index % colors.length}`, item.kategori), node('span', '', text));
            legend.append(details);
        }
    }

    renderJobs(list(data.mataPencaharian));
    switchStatistics('demografi');
    switchView(initialView(), { updateUrl: false, scroll: false });
    document.querySelector('main').hidden = false;
    if (!preview) window.addEventListener('popstate', () => switchView(initialView(), { updateUrl: false }));

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-view], [data-menu-toggle], [data-menu-close], [data-stat]');
        if (!button) return;
        if (button.dataset.view) {
            const anchor = button.getAttribute('href');
            if (anchor?.startsWith('#')) {
                event.preventDefault();
                if (activeView !== 'home') switchView(button.dataset.view, { scroll: false });
                get(anchor.slice(1)).scrollIntoView();
            } else switchView(button.dataset.view);
        } else if (button.hasAttribute('data-menu-toggle')) {
            menuOpen(get('mobile-menu').classList.contains('hidden'));
        } else if (button.dataset.stat) switchStatistics(button.dataset.stat);
        if (button.hasAttribute('data-menu-close')) {
            if (!button.dataset.view && button.getAttribute('href') === '#footer-section') {
                event.preventDefault();
                get('footer-section').scrollIntoView();
            }
            menuOpen(false);
        }
    });
})();

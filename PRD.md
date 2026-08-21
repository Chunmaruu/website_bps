# Product Requirements Document (PRD)
## Platform Galeri Templat Website Desa

---

## 1. Ringkasan Produk

### 1.1 Latar Belakang
Badan Pusat Statistik (BPS) membutuhkan sebuah platform yang menjadi wadah bagi berbagai templat website desa. Setiap desa di seluruh Indonesia dapat melihat pilihan templat yang tersedia, kemudian memilih dan menggunakan templat tersebut untuk website resmi desanya.

### 1.2 Tujuan Produk
Membangun platform sederhana berbasis web yang memungkinkan:
- **Admin BPS (Pusat)** mengelola daftar templat website desa dan akun desa yang terdaftar.
- **Admin Desa (User)** melihat galeri templat dalam bentuk preview, lalu diarahkan langsung ke link templat aslinya saat memilih untuk melihat detail.

### 1.3 Skala MVP
Fokus MVP adalah fitur inti: manajemen templat, manajemen user desa, autentikasi, dan galeri templat dengan redirect. Fitur monitoring/analytics dan logging aktivitas **tidak termasuk dalam MVP** dan dapat menjadi pengembangan fase berikutnya.

---

## 2. Aktor & Role

| Role | Deskripsi |
|---|---|
| **Admin BPS (Pusat)** | Mengelola data templat dan mengelola akun desa (approval, aktivasi) |
| **Admin Desa (User)** | Melihat galeri templat dan memilih templat untuk digunakan |

---

## 3. Arsitektur Data

Platform ini menggunakan **dua sumber data terpisah** sesuai kebutuhan masing-masing:

### 3.1 Database Relasional (MySQL/PostgreSQL) — Autentikasi
Digunakan khusus untuk data akun dan proses login, karena membutuhkan keamanan dan performa yang stabil (tidak cocok disimpan di spreadsheet).

### 3.2 Google Spreadsheet (Spreadsheet Master) — Data Templat
Digunakan sebagai sumber data galeri templat, dikelola oleh Admin BPS melalui form CRUD di web (bukan diedit manual di spreadsheet). Backend membaca dan menulis data ke spreadsheet ini melalui Google Sheets API.

### 3.3 Spreadsheet Milik Templat Individual
Sebagian templat website desa menggunakan spreadsheet sebagai database kontennya sendiri (di luar platform ini). Platform **tidak mengakses isi spreadsheet tersebut**, hanya menyimpan referensinya (Sheet ID/link) sebagai metadata di Spreadsheet Master.

---

## 4. Skema Data

### 4.1 Database — Tabel `admins_bps`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| nama | VARCHAR | Nama admin |
| email | VARCHAR (unique) | Email login |
| password_hash | VARCHAR | Password ter-hash (bcrypt) |
| status | ENUM | aktif / nonaktif |
| created_at | TIMESTAMP | Waktu pembuatan akun |

### 4.2 Database — Tabel `admins_desa`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| nama_desa | VARCHAR | Nama desa |
| kecamatan | VARCHAR | Kecamatan |
| kabupaten | VARCHAR | Kabupaten |
| provinsi | VARCHAR | Provinsi |
| nama_pic | VARCHAR | Nama penanggung jawab |
| email | VARCHAR (unique) | Email login |
| password_hash | VARCHAR | Password ter-hash (bcrypt) |
| status | ENUM | pending / approved / rejected / nonaktif |
| created_at | TIMESTAMP | Waktu registrasi |

### 4.3 Spreadsheet Master — Tab `Templates`
| Kolom | Keterangan |
|---|---|
| id | ID unik templat |
| nama_templat | Nama templat |
| kategori | Kategori (misal: Desa Wisata, Desa Agraris, dll) |
| thumbnail_url | URL gambar preview |
| deskripsi | Deskripsi singkat templat |
| link_templat | Link menuju templat asli (tujuan redirect) |
| tipe_database | Statis / Spreadsheet |
| sheet_id_referensi | Sheet ID milik templat (diisi jika tipe_database = Spreadsheet) |
| status | Aktif / Nonaktif / Draft |

---

## 5. Daftar Fitur

### 5.1 Dashboard Admin BPS (Pusat)

**A. Autentikasi**
- Login admin BPS

**B. Manajemen Templat**
- Tambah templat baru (nama, kategori, thumbnail, deskripsi, link templat, tipe database, status)
- Edit data templat
- Hapus templat
- Ubah status templat (Aktif/Nonaktif/Draft)
- Preview thumbnail sebelum publish
- Data tersimpan otomatis ke Spreadsheet Master melalui Google Sheets API

**C. Manajemen User Desa**
- Melihat daftar akun desa yang terdaftar
- Approve/reject pendaftaran akun desa baru
- Aktivasi/nonaktifkan akun desa
- Melihat detail profil desa (nama desa, kecamatan, kabupaten, provinsi, PIC)

**D. Pengaturan Sistem**
- Konfigurasi koneksi Google Sheets API (Sheet ID master, service account)
- Manajemen akun admin BPS lain (jika multi-admin)
- Membuat pengumuman untuk seluruh admin desa

---

### 5.2 Dashboard Admin Desa (User)

**A. Autentikasi**
- Registrasi akun desa (menunggu approval BPS)
- Login admin desa

**B. Galeri Templat**
- Menampilkan daftar templat dalam bentuk grid/card (thumbnail, nama, kategori)
- Filter templat berdasarkan kategori
- Pencarian templat berdasarkan nama
- Data dibaca langsung dari Spreadsheet Master

**C. Preview & Redirect**
- Klik card templat → membuka `link_templat` pada tab baru
- Tidak ada halaman detail internal; preview dilakukan langsung di link templat aslinya

**D. Profil Desa**
- Melihat dan mengedit data profil desa sendiri (nama desa, kecamatan, kabupaten, PIC)

**E. Notifikasi**
- Melihat pengumuman yang dibuat oleh Admin BPS

---

## 6. Alur Pengguna (User Flow)

### 6.1 Alur Admin Desa
1. Desa melakukan registrasi akun → status `pending`
2. Admin BPS melakukan approval → status `approved`
3. Desa login ke dashboard
4. Desa melihat galeri templat, dapat memfilter/mencari
5. Desa klik card templat yang diminati → redirect ke `link_templat` di tab baru

### 6.2 Alur Admin BPS
1. Admin BPS login ke dashboard
2. Admin BPS menambah/mengedit templat melalui form CRUD → data tersimpan ke Spreadsheet Master
3. Admin BPS meninjau pendaftaran akun desa baru dan melakukan approve/reject
4. Admin BPS dapat membuat pengumuman untuk seluruh desa

---

## 7. Teknologi

| Komponen | Teknologi |
|---|---|
| Backend | Node.js + Express |
| Autentikasi | JWT (JSON Web Token) |
| Database Auth | MySQL / PostgreSQL |
| Sumber Data Templat | Google Sheets API (Spreadsheet Master) |
| Password Security | bcrypt |

---

## 8. Batasan (Out of Scope untuk MVP)
- Logging/monitoring aktivitas klik templat oleh desa
- Analytics templat terpopuler
- Akses langsung ke isi spreadsheet milik masing-masing templat individual
- Multi-bahasa

---

## 9. Rencana Pengembangan Selanjutnya (Next Phase)
- Fitur logging aktivitas klik templat (untuk kebutuhan analytics BPS)
- Dashboard statistik templat terpopuler
- Notifikasi real-time (email/push) saat status akun desa berubah
- Fitur cek status koneksi spreadsheet milik templat individual (opsional, untuk troubleshooting)
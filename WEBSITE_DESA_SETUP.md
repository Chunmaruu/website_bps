# Website Saya

Portal menyediakan dua desain untuk website terbit: **Desa Informatif** dan **Micro-Portal Desa Cantik**. Buka **Gunakan Templat** pada kartu Micro-Portal di galeri atau pilih desain dari menu **Website Saya**. Setiap desa menghubungkan salinan Google Sheets miliknya sendiri dan memperoleh alamat `/desa/<slug>`.

## Menjalankan

1. Konfigurasi database aplikasi dan `JWT_SECRET` seperti sebelumnya. Saat server dimulai, `sequelize.sync()` membuat tabel baru `village_websites`; tabel akun tetap digunakan. Gunakan MySQL/PostgreSQL persisten untuk hosting, bukan SQLite sementara di serverless.
2. Aktifkan Google Sheets API pada proyek Google Cloud dan buat service account.
3. Isi `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_PRIVATE_KEY` pada environment server. Private key hanya di server. Integrasi konten desa menggunakan Sheets API langsung; `GOOGLE_SCRIPT_URL` lama tetap untuk galeri.
4. Jalankan `npm start`, login sebagai admin desa, lalu buka **Website Saya**. Konfigurasi service account ditampilkan sebagai siap/belum siap tanpa mengekspos private key.

## Alur pihak desa

1. Pilih desain dan simpan pengaturan untuk mendapatkan alamat website serta kode koneksi.
2. Unduh spreadsheet desain yang dipilih melalui dashboard, unggah ke Drive, buka, lalu simpan sebagai Google Sheets. Setiap desa memiliki file sendiri.
3. Isi identitas dan salin kode koneksi dari dashboard. Untuk Micro-Portal, gunakan kolom `kode_koneksi` di baris 2 tab `identitas`. Isi `namaDesa`, `kecamatan`, `kabupaten`, `provinsi`, dan `deskripsi`. Untuk Desa Informatif, kode masuk pada baris `kode_koneksi` di tab `Profil`.
4. Pertahankan nama tab dan header. Tab lain boleh dibiarkan kosong. Untuk Micro-Portal, isi masing-masing tab statistik ringkasan hanya di baris 2. Tab `potensiDesa`, `mataPencaharian`, dan `dokumenPublikasi` dapat memuat hingga 500 baris. Tautan foto dan dokumen harus menggunakan HTTPS. Untuk Desa Informatif, gunakan tanggal berita berbentuk teks YYYY-MM-DD dan angka statistik tanpa pemisah ribuan.
5. Bagikan file ke email service account sebagai Pelihat; tidak perlu publish-to-web atau akses publik. Masukkan link Google Sheets, lalu simpan.
6. Sinkronkan data, buka pratinjau, kemudian terbitkan. Website tersedia pada `/desa/<slug>`. Alamat ditetapkan saat pertama membuat website.
7. Setiap pembaruan spreadsheet perlu sinkronisasi dan publikasi ulang. Mengganti templat atau link spreadsheet membatalkan draf sebelumnya. Versi publik tetap memakai desain dan isi dari publikasi terakhir. Tarik dari publik untuk menonaktifkan website tanpa menghapus draf.

## Perilaku dan batas versi awal

- Akun desa hanya dapat mengelola website miliknya. Akun nonaktif tidak dapat mengelola atau menayangkan website.
- Kode koneksi tidak disertakan dalam hasil publikasi. Kode membuktikan akses edit file yang dibaca oleh layanan bersama.
- Publik membaca salinan JSON terakhir yang terbit dari database; tidak menghubungi Google pada setiap kunjungan. Kegagalan sinkronisasi tidak mengganti versi publik.
- Perubahan bersamaan ditolak melalui revision check agar draf lama tidak menimpa konfigurasi atau publikasi baru.
- Micro-Portal mendukung link foto potensi dan halaman dokumen `/desa/<slug>/dokumen`. Gunakan hanya foto dan dokumen yang ditujukan untuk publik.
- Spreadsheet belum dibuat otomatis di akun Google. Domain khusus dan penambahan otomatis website terbit ke direktori galeri belum tersedia.
- Hosting aplikasi tetap perlu dijalankan dan dikonfigurasi oleh pengelola. Implementasi lokal ini tidak otomatis men-deploy proyek.

## Verifikasi

`node --test scripts/website.test.js scripts/security.test.js`

Pengujian website menggunakan SQLite in-memory serta respons Google Sheets pengganti. Uji integrasi Google asli dilakukan setelah kredensial valid dan spreadsheet yang dibagikan tersedia.

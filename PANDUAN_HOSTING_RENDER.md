# Panduan Lengkap Hosting Aplikasi di Render (Web Service + PostgreSQL)

Aplikasi ini menggunakan **Node.js (Express + Vite)** untuk frontend/backend dan **PostgreSQL** untuk database. Saat di-deploy ke Render, ada 2 komponen yang harus dibuat di Render:
1. **Render PostgreSQL** (Layanan Database)
2. **Render Web Service** (Layanan Aplikasi Node.js)

---

## Mengapa Sebelumnya Laporan / Laba Rugi Tidak Muncul Setelah Deploy di Render?
1. **Variabel `DATABASE_URL` Belum Dimasukkan di Render**: Jika Render Web Service belum diberikan environment variable `DATABASE_URL`, aplikasi berjalan tanpa database cloud terhubung (`localhost:5432` kosong pada container Render).
2. **Database Baru di Render Masih Kosong (0 Tabel)**: Saat database baru dibuat di Render, seluruh tabel PostgreSQL belum ada. Sistem kini sudah diperbarui dengan **Auto-Bootstrap Table Creation** yang otomatis mendeteksi database kosong dan membuat 33 tabel secara instan saat server menyala.
3. **Inisialisasi Data Transaksi Awal**: Sistem kini otomatis mengisi transaksi awal (rekam medis khitan, invoice lunas, jasa medis dokter, dan mutasi stok obat) sehingga menu **Laporan Laba Rugi & Keuangan** langsung terisi dan tersinkronisasi, baik pada filter *Hari Ini*, *Bulan Ini*, maupun *Semua Waktu*.
4. **Hak Akses Admin & Owner**: Hak akses melihat omset & laba rugi kini aktif secara default untuk peran **Owner** dan **Admin Operasional**.

---

## Langkah demi Langkah Menjalankan Aplikasi di Render

### Langkah 1: Buat Database PostgreSQL di Render
1. Buka dashboard Render di [https://dashboard.render.com](https://dashboard.render.com).
2. Klik tombol **New +** di kanan atas, pilih **PostgreSQL**.
3. Isi data berikut:
   - **Name**: `nano-clinic-db`
   - **Database**: `nano_clinic` *(atau biarkan default)*
   - **User**: `postgres` *(atau biarkan default)*
   - **Region**: Pilih yang terdekat (misal: **Singapore**).
   - **Instance Type / Plan**: Pilih **Free** (atau Starter).
4. Klik **Create Database**.
5. Tunggu sekitar 1-2 menit hingga statusnya menjadi **Available**.
6. Pada halaman detail database tersebut, cari bagian **Connections**:
   - Temukan **Internal Database URL** *(formatnya: `postgresql://user:password@dpg-xxxxxx-a/database_name`)*.
   - Klik tombol **Copy** pada **Internal Database URL** ini. *(Catatan: Gunakan Internal URL jika Web Service dan Database berada di akun Render yang sama karena koneksinya lebih cepat dan gratis kuota bandwidth).*

---

### Langkah 2: Buat atau Konfigurasi Web Service di Render
Jika Anda sudah membuat Web Service sebelumnya:
1. Buka Web Service Anda di dashboard Render.
2. Masuk ke menu **Settings**:
   - Pastikan **Build Command**: `npm install && npm run build`
   - Pastikan **Start Command**: `npm start`
3. Masuk ke menu **Environment** (di sidebar kiri):
   - Klik **Add Environment Variable**.
   - Masukkan:
     - **Key**: `DATABASE_URL`
     - **Value**: *[Paste Internal Database URL yang Anda salin dari Langkah 1]*
   - Tambahkan lagi variabel berikut:
     - **Key**: `NODE_ENV`
     - **Value**: `production`
   - *(Opsional)* Jika menggunakan fitur Gemini AI:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: *[API Key Gemini Anda]*
4. Klik **Save Changes**.

*(Catatan: Render akan otomatis melakukan redeploy setelah environment variable disimpan).*

---

### Langkah 3: Verifikasi Otomatis & Pembuatan Tabel
Aplikasi ini sudah dilengkapi dengan **Auto-Bootstrap & Auto-Healing** otomatis:
- Begitu Web Service terhubung ke `DATABASE_URL`, server akan:
  1. Otomatis membuat seluruh 33 tabel relasional PostgreSQL (Users, Branches, Guardians, Patients, Bookings, Procedures, Invoices, Payments, Doctor Fees, Products, dll).
  2. Otomatis mengisi data akun bawaan:
     - **Akun Owner/Super Admin**: `owner@nanocircumcision.com` (Password: `owner123`)
     - **Akun Admin Operasional**: `admin@nanocircumcision.com` (Password: `admin123`)
     - **Akun Staff Kasir**: `staff@nanocircumcision.com` (Password: `staff123`)
  3. Otomatis mengisi master cabang, paket khitan modern, master obat/alkes, dan dokter.
  4. Otomatis mengisi data transaksi operasional awal sehingga **Laporan Laba Rugi, Rekap Tindakan, dan Pengeluaran Obat** langsung tampil tersinkronisasi.

---

### Langkah 4: Cek Status Koneksi Database
Anda dapat mengecek kesehatan server dan koneksi database secara langsung melalui URL aplikasi Anda:
- Buka di browser: `https://[nama-aplikasi-anda].onrender.com/api/health`
- Jika berhasil, outputnya akan berstatus **ok**:
  ```json
  {
    "status": "ok",
    "service": "Nano Circumcision API",
    "database": {
      "status": "connected",
      "tables": 33,
      "users": 3,
      "bookings": 4,
      "invoices": 4,
      "mode": "DATABASE_URL",
      "urlConfigured": true
    }
  }
  ```

---

### Langkah 5: Cara Melakukan Sinkronisasi dari Halaman Laporan
Jika di kemudian hari Anda menambahkan data atau ingin memastikan rekonsiliasi kas kasir:
1. Buka menu **Laporan** -> **Laba Rugi & Keuangan**.
2. Klik tombol **"Sinkronkan Data"** (ikon refresh biru di kanan atas).
3. Server akan otomatis merekonsiliasi pembayaran invoice kasir, pemotongan stok obat, dan jasa medis dokter secara menyeluruh!


# EDMS Frontend

Frontend Employee Directory & Management System menggunakan React + Vite. Versi ini sepenuhnya lokal: **belum memanggil HTTP API atau terhubung ke backend**.

## Menjalankan

```sh
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite. Untuk memeriksa kode dan build:

```sh
npm run lint
npm run build
npm run preview
```

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | admin@edms.co.id | Admin123! |
| Karyawan | karyawan@edms.co.id | Karyawan123! |

Klik salah satu akun di halaman login untuk mengisi kredensial, lalu klik **Masuk ke aplikasi**. Kredensial ini merupakan data contoh publik, bukan akun backend.

## Fitur

- Login simulasi, logout, dan sesi per tab menggunakan sessionStorage.
- Layout responsif: header, sidebar kiri, konten, footer; navigasi mobile.
- Dashboard dengan jumlah karyawan, karyawan aktif, departemen, cuti, komposisi tim, dan anggota terbaru berdasarkan tanggal bergabung.
- Employee Directory: pencarian nama/email/jabatan/departemen/ID, filter departemen/status, urutan nama/tanggal bergabung, pagination, dan profil karyawan.
- Khusus Admin: tambah, edit, dan hapus dengan dialog konfirmasi. Karyawan hanya melihat direktori dan profil.
- Validasi field wajib, format email, email unik, status kosong, dan notifikasi hasil.
- Data awal 14 karyawan. Perubahan disimpan di localStorage browser dengan key `edms-employees-v1`, sehingga bertahan setelah refresh. Hapus key tersebut untuk mengembalikan data awal.
- Tidak ada aset, font, atau layanan eksternal yang diperlukan saat runtime.

## Alasan pemilihan teknologi

React memudahkan pemisahan komponen, pengelolaan state form/filter, dan pembatasan tampilan berdasarkan peran. Vite menyediakan development server dan build produksi dengan konfigurasi minimal. CSS biasa menjaga ukuran dependensi kecil dan memberi kendali penuh atas layout responsif. Stack ini melanjutkan fondasi proyek yang tersedia.

## Persiapan integrasi backend berikutnya

`src/services/mock.js` memisahkan login dan operasi data lokal dari antarmuka. Saat integrasi diminta, ganti lapisan tersebut dengan HTTP API dan tambahkan state loading, error jaringan, serta penanganan sesi kedaluwarsa. Komponen utama saat ini menggunakan operasi sinkron; pemanggil perlu disesuaikan menjadi async.

**Pembatasan peran di versi ini adalah simulasi UI, bukan keamanan.** Data dan sesi browser dapat diubah pengguna. Saat backend dihubungkan, backend wajib memverifikasi autentikasi dan role pada setiap request tambah/edit/hapus, serta mengembalikan 401/403 untuk request yang tidak berhak. Frontend tidak dapat menggantikan pemeriksaan tersebut. Password demo tidak disimpan dalam sesi.

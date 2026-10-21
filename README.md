# EDMS Frontend

React + Vite, terhubung ke API Laravel di proyek sebelah `../EDMS-api`.

## Menjalankan

```sh
npm install
npm run dev
```

Backend Sail harus berjalan di `http://localhost`. Vite meneruskan `/api` ke backend tersebut untuk development dan preview. Jika alamat backend berbeda, salin `.env.example` menjadi `.env.local`, ubah `API_PROXY_TARGET`, lalu restart Vite.

Untuk produksi, sediakan reverse proxy `/api` ke Laravel atau set `VITE_API_BASE_URL` saat build ke URL API yang mengizinkan origin frontend melalui CORS. Jangan memasukkan password/token ke variabel build.

## Login dan akses

Gunakan akun yang terdaftar di database API. Akun Admin lokal yang ditemukan saat integrasi adalah `admin@example.com`; gunakan password akun tersebut. Akun simulasi frontend sebelumnya tidak digunakan lagi.

- `POST /api/login` mengembalikan token Bearer dan profil pengguna.
- Token disimpan per tab di sessionStorage; password tidak disimpan.
- Refresh memverifikasi sesi melalui `GET /api/user` sebelum menampilkan aplikasi.
- Logout memanggil `POST /api/logout` untuk mencabut token. Jika request gagal, aplikasi menampilkan error dan sesi bisa dicoba logout kembali.
- Respons 401 pada request terautentikasi menghapus sesi dan mengarahkan pengguna ke login. Respons 403 menampilkan pesan tidak berhak.

## Fitur

- Dashboard tetap menampilkan WELCOME sesuai desain terakhir.
- Employee Directory mengambil seluruh halaman pagination dari `GET /api/employees`, lalu menyediakan pencarian nama/email/jabatan/departemen/ID, filter departemen, urutan, pagination tampilan, dan profil.
- Form tambah/edit mengirim nama, email, telepon, departemen, dan jabatan. Status dan tanggal bergabung tidak ditampilkan karena belum tersedia dalam kontrak API.
- Tambah/edit/hapus hanya tampil untuk role `admin`. Operasi memakai POST, PUT, dan DELETE `/api/employees` dengan token Bearer; tidak lagi memakai data localStorage.
- Backend yang tersedia sudah membatasi create/update melalui FormRequest + EmployeePolicy dan delete melalui Gate. Pengguna `karyawan` ditolak oleh backend meskipun mengirim request langsung.
- Loading, error jaringan, retry daftar, validasi API, dan pencegahan submit ganda ditampilkan dalam UI.

## Pemeriksaan

```sh
npm run lint
npm run build
npm test
```

Pengujian service meliputi token autentikasi, pagination API, CRUD, validasi, 401, 403, dan kegagalan jaringan. Pengujian ini menggunakan respons HTTP terkontrol, bukan database produksi.

Pengujian kontrak backend dapat dijalankan dari direktori frontend saat container Sail aktif:

```sh
docker compose -f ../EDMS-api/compose.yaml exec -T laravel.test php < tests/backend-contract.php
```

Script tersebut membuat database SQLite dalam memori beserta akun uji, lalu memeriksa login, CRUD Admin, penolakan 401/403, pencarian, validasi, dan pencabutan token. Script tidak memakai atau mengubah akun/database aplikasi yang sudah ada.

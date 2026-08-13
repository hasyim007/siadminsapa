# Panduan Deploy SIADMINSAPA — Satu Worker (Frontend + Backend Jadi Satu)

Struktur project ini sudah diubah supaya **tampilan (frontend) dan API (backend) jadi satu Cloudflare Worker**, satu URL, satu kali deploy — tidak perlu Cloudflare Pages lagi.

Cara kerjanya: folder `public/` (isi: `index.html`, `css/`, `js/`) dilayani otomatis oleh Cloudflare sebagai file statis. Request ke `/api/*` diteruskan ke kode di `worker/index.js`. Ini diatur lewat `[assets]` di `wrangler.toml`.

Karena frontend & API sekarang satu origin, kamu **tidak perlu lagi mengisi `API_BASE`** di `js/api.js` — dibiarkan kosong (`''`) memang sudah benar.

---

## Yang perlu disiapkan
- [Node.js](https://nodejs.org) (untuk menjalankan `npx wrangler`) — versi LTS mana saja sudah cukup.
- Akun Cloudflare (gratis) — daftar di https://dash.cloudflare.com kalau belum punya.
- Buka terminal / Command Prompt di folder project `siadminsapa-workers`.

## 1. Login ke Cloudflare lewat CLI
```
npx wrangler login
```
Browser akan terbuka, klik **Allow** untuk mengizinkan Wrangler mengakses akun Cloudflare kamu.

## 2. Buat database D1
```
npx wrangler d1 create siadminsapa-db
```
Perintah ini menampilkan `database_id`. **Copy** nilai itu, lalu buka `wrangler.toml` dan tempel menggantikan `REPLACE_WITH_D1_DATABASE_ID`.

## 3. Isi struktur tabel
```
npx wrangler d1 execute siadminsapa-db --remote --file=worker/schema.sql
```

## 4. Buat akun admin
```
npx wrangler d1 execute siadminsapa-db --remote --command "INSERT INTO admin (username, password_hash, nama_lengkap) VALUES ('admin', 'admin123', 'Admin SDN 01 Papahan');"
```
Password `admin123` di atas masih teks biasa — sistem butuh hash SHA-256. Buka https://emn178.github.io/online-tools/sha256.html, generate hash dari password yang kamu mau pakai (boleh ganti dari `admin123`), lalu jalankan (ganti `HASIL_HASH`):
```
npx wrangler d1 execute siadminsapa-db --remote --command "UPDATE admin SET password_hash = 'HASIL_HASH' WHERE username = 'admin';"
```
Catat baik-baik username & password ASLI (bukan hash-nya) untuk login nanti.

## 5. Set secrets
```
npx wrangler secret put JWT_SECRET
```
Saat diminta, ketik string acak panjang (boleh generate di https://randomkeygen.com).

`GDRIVE_SA_JSON` boleh dilewati dulu, isi belakangan setelah setup Google Drive (lihat Tahap 4 di `PANDUAN-DEPLOY-TANPA-CLI.md`, langkah-langkah Google Cloud-nya masih sama persis — cuma cara paste secret-nya lewat CLI):
```
npx wrangler secret put GDRIVE_SA_JSON
```
(paste seluruh isi file JSON service account saat diminta)

## 6. Deploy
```
npx wrangler deploy
```
Setelah selesai, Wrangler menampilkan URL Worker kamu, contoh:
```
https://siadminsapa.NAMA-SUBDOMAIN-KAMU.workers.dev
```
Buka URL itu — halaman depan SIADMINSAPA langsung muncul, dan dashboard admin ada di `.../#/login`. Tidak ada langkah upload/zip terpisah untuk frontend — semuanya sudah ikut ter-deploy dalam satu perintah ini.

## 7. Setiap kali ada perubahan kode
Edit file apa pun (di `public/` maupun `worker/`), lalu jalankan lagi:
```
npx wrangler deploy
```

## 8. Sambungkan Google Drive
Ikuti persis **Tahap 4** di `PANDUAN-DEPLOY-TANPA-CLI.md` (bagian Google Cloud Console-nya sama saja) — bedanya cuma cara memasukkan `GDRIVE_SA_JSON` ke Worker, pakai perintah `wrangler secret put GDRIVE_SA_JSON` di atas, bukan lewat dashboard.

---

## Troubleshooting singkat
| Gejala | Penyebab & solusi |
|---|---|
| `wrangler: command not found` | Pastikan Node.js sudah terinstall, lalu pakai `npx wrangler ...` (bukan `wrangler ...` langsung) supaya tidak perlu install global. |
| Halaman depan blank | Cek Console browser (klik kanan → Inspect → Console). Biasanya karena `wrangler deploy` belum dijalankan ulang setelah edit file di `public/`. |
| Tidak bisa login admin | Cek ulang langkah 4 — pastikan hash SHA-256 yang di-`UPDATE` berasal dari password yang sama dengan yang kamu ketik saat login. |
| Setelah login langsung ke-logout lagi | Secret `JWT_SECRET` belum di-set — ulangi langkah 5. |
| Upload file / Drive error | Cek `GDRIVE_SA_JSON`, folder Drive sudah di-share ke `client_email` dengan akses Editor, dan Folder ID sudah diisi di menu Pengaturan Situs. |

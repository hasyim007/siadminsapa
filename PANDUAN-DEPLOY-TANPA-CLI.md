# Panduan Deploy SIADMINSAPA Tanpa CLI
Semua lewat dashboard/browser — tidak perlu install Node.js, wrangler, atau buka terminal sama sekali.

Ada 4 tahap: **(1) Database D1 → (2) Backend Worker → (3) Frontend (Pages) → (4) Google Drive**. Urutannya penting karena tahap 2–3 butuh ID/URL dari tahap sebelumnya.

---

## 0. Siapkan akun
1. Buka **https://dash.cloudflare.com** → daftar/login (gratis, tidak perlu kartu kredit untuk paket free Workers/Pages/D1).
2. Di sidebar kiri, kamu akan pakai 3 menu: **Workers & Pages**, **D1** (biasanya di dalam menu Workers & Pages → sub-menu "D1 SQL Database" atau menu "Storage & Databases"), dan nanti **Google Cloud Console** untuk Drive.

---

## 1. Buat Database D1

1. Dashboard Cloudflare → **Workers & Pages** → tab **D1** (atau cari "D1" di search bar atas) → **Create database**.
2. Nama database: `siadminsapa-db` → **Create**.
3. Setelah masuk ke halaman database, buka tab **Console** (query editor berbasis browser, tidak perlu CLI).
4. Buka file `worker/schema.sql` dari project (isi lengkapnya sudah saya siapkan) → **copy semua isinya** → paste ke kotak Console → klik **Execute**.
5. Cek tab **Tables** di sebelahnya — harus muncul 9 tabel (`admin`, `site_settings`, `services`, `form_fields`, `pengajuan`, `status_log`, `pengajuan_files`, `pdf_templates`, `wa_templates`), dan `wa_templates` sudah terisi 4 baris default.
6. **Buat 1 akun admin** lewat Console juga (schema belum otomatis mengisi ini karena password perlu di-hash). Jalankan query ini di Console (ganti `admin123` dengan password pilihanmu — untuk sekarang pakai plain text dulu, nanti langkah 2.6 akan jelaskan soal hashing):
   ```sql
   INSERT INTO admin (username, password_hash, nama_lengkap) VALUES ('admin', 'admin123', 'Admin SDN 01 Papahan');
   ```
7. Catat **Database ID** di halaman overview database ini (bentuknya UUID panjang) — dipakai di langkah 2.3.

> Catatan soal password: kode Worker di langkah 2 memakai SHA-256 untuk mencocokkan password (lihat fungsi `sha256()`), jadi idealnya kolom `password_hash` diisi hasil SHA-256 dari password, bukan plain text. Cara paling gampang tanpa CLI: buka https://emn178.github.io/online-tools/sha256.html, masukkan password pilihanmu, copy hasil hash-nya, lalu jalankan lagi query UPDATE di Console D1:
> ```sql
> UPDATE admin SET password_hash = 'HASIL_HASH_DI_SINI' WHERE username = 'admin';
> ```

---

## 2. Deploy Backend (Worker)

1. Dashboard Cloudflare → **Workers & Pages** → **Create** → pilih **Workers** → **Create Worker**.
2. Beri nama, misal `siadminsapa-api` → **Deploy** (ini men-deploy Worker kosong dulu, isinya kita ganti berikutnya).
3. Setelah deploy, klik **Edit code** (masuk ke online code editor, tanpa install apa pun).
4. **Hapus semua isi default**, lalu paste isi file **`worker/index.dashboard.js`** yang sudah saya siapkan (ini versi gabungan — kode API + integrasi Google Drive jadi satu file, karena editor dashboard hanya menerima satu file, beda dengan `worker/index.js` + `worker/drive.js` yang terpisah untuk yang pakai CLI/wrangler).
5. Klik **Save and deploy**.
6. Sambungkan ke database D1:
   - Kembali ke halaman Worker → tab **Settings** → **Bindings** → **Add binding** → pilih **D1 database**.
   - Variable name: `DB` (harus persis ini, sesuai kode).
   - Database: pilih `siadminsapa-db` yang dibuat di langkah 1.
   - **Save**.
7. Tambahkan secret (variabel rahasia), masih di tab **Settings** → **Variables and Secrets** → **Add**:
   - `JWT_SECRET` → tipe **Secret** → isi dengan string acak panjang (contoh: buka https://randomkeygen.com, pakai salah satu "CodeIgniter Encryption Keys").
   - `GDRIVE_SA_JSON` → tipe **Secret** → isinya diisi setelah langkah 4 (Google Drive) selesai — boleh dilewati dulu, upload file publik/feedback baru akan gagal sebelum ini diisi.
   - **Save and deploy**.
8. Catat **URL Worker** kamu — muncul di halaman overview Worker, formatnya `https://siadminsapa-api.<subdomain-kamu>.workers.dev`. Ini dipakai di langkah 3.

---

## 3. Deploy Frontend (Cloudflare Pages — drag & drop)

Tidak perlu GitHub/git, tinggal upload folder langsung dari komputer.

1. **Sebelum upload**, buka file `js/api.js` di komputer kamu pakai text editor apa pun (Notepad/VS Code/dsb — cukup edit teks biasa, bukan CLI), cari baris:
   ```js
   const API_BASE = '';
   ```
   Ganti jadi URL Worker dari langkah 2.8, contoh:
   ```js
   const API_BASE = 'https://siadminsapa-api.namamu.workers.dev';
   ```
   `js/api.js` sudah tersambung penuh ke Worker lewat `fetch()` (bukan mode demo/localStorage lagi) — jadi cukup isi baris ini saja, tidak ada lagi yang perlu diubah.
2. Simpan file, lalu **compress folder `siadminsapa` jadi .zip** (klik kanan folder → "Compress"/"Send to > Compressed folder", tanpa CLI).
3. Dashboard Cloudflare → **Workers & Pages** → **Create** → tab **Pages** → **Upload assets** (bukan "Connect to Git").
4. Beri nama project, misal `siadminsapa` → **Create project**.
5. Drag & drop file `.zip` tadi (atau drag folder-nya langsung kalau browser mendukung) → **Deploy site**.
6. Setelah selesai, Cloudflare kasih URL publik, contoh `https://siadminsapa.pages.dev` — ini alamat sekolahmu bisa mulai dipakai.
7. Setiap kali ada perubahan file di folder, ulangi dari langkah 2 (zip ulang → buka project Pages → tab **Deployments** → **Create deployment** → upload ulang).

---

## 4. Setup Google Drive (Service Account) — juga tanpa CLI

1. Buka **https://console.cloud.google.com** → login pakai akun Google sekolah/pribadi.
2. Buat project baru: klik dropdown project di kiri atas → **New Project** → nama `siadminsapa` → **Create**.
3. Aktifkan Drive API: search bar atas ketik "Google Drive API" → buka hasilnya → **Enable**.
4. Buat Service Account: menu ☰ → **IAM & Admin** → **Service Accounts** → **Create Service Account**.
   - Nama: `siadminsapa-drive` → **Create and Continue** → role boleh dilewati (skip) → **Done**.
5. Buat key untuk service account itu: klik service account yang baru dibuat → tab **Keys** → **Add Key** → **Create new key** → pilih **JSON** → **Create**. File `.json` otomatis ke-download ke komputer — **ini rahasia, jangan disebar/di-commit ke mana pun**.
6. Buka file `.json` itu pakai text editor, **copy seluruh isinya**.
7. Kembali ke Cloudflare dashboard → Worker `siadminsapa-api` → **Settings** → **Variables and Secrets** → edit `GDRIVE_SA_JSON` (yang tadi dilewati di langkah 2.7) → paste seluruh isi JSON tadi → **Save and deploy**.
8. Buka Google Drive (drive.google.com) pakai akun yang sama → buat folder baru, misal "SIADMINSAPA Files".
9. Klik kanan folder → **Share** → di file JSON tadi cari field `"client_email"` (bentuknya seperti `siadminsapa-drive@siadminsapa.iam.gserviceaccount.com`) → paste ke kolom share, beri akses **Editor** → **Send**.
10. Buka folder itu di Drive, lihat URL-nya di address bar, contoh:
    `https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz`
    → bagian setelah `/folders/` itu **Folder ID**-nya.
11. Login ke dashboard admin SIADMINSAPA kamu (`https://situs-kamu.pages.dev/#/login`) → menu **Pengaturan Situs** → isi **ID Folder Google Drive Tujuan** dengan Folder ID tadi → **Simpan**.

---

## Ringkasan urutan
1. D1 → jalankan `schema.sql` lewat Console browser, buat akun admin.
2. Worker → paste `worker/index.dashboard.js`, sambungkan binding `DB`, isi secret `JWT_SECRET`.
3. Pages → upload folder frontend (setelah `API_BASE` di `js/api.js` diisi URL Worker).
4. Google Cloud → buat service account, download JSON, isi ke secret `GDRIVE_SA_JSON`, share folder Drive ke email service account, isi Folder ID di Pengaturan Situs.

Semua langkah di atas murni klik-klik di browser (Cloudflare dashboard + Google Cloud Console + Drive) — tidak ada satu pun perintah terminal.

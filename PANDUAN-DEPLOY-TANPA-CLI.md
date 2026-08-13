> ⚠️ **Catatan:** Sejak project ini digabung jadi satu Cloudflare Worker (frontend + backend satu deploy), panduan ini **sudah tidak dipakai untuk Tahap 1–3** (Database, Worker, Pages) — ikuti `PANDUAN-DEPLOY-WORKERS.md` untuk itu. Bagian di bawah ini masih relevan untuk **Tahap 4 (Sambungkan ke Google Drive)** — semua langkah di Google Cloud Console-nya sama persis, hanya cara memasukkan `GDRIVE_SA_JSON` ke Worker yang beda (pakai `wrangler secret put`, lihat panduan baru).

# Panduan Deploy SIADMINSAPA — Tanpa CLI (Untuk Pemula)

Panduan ini ditulis selengkap mungkin, klik demi klik. Tidak perlu install apa pun di komputer — semuanya lewat website (dashboard/browser). Kalau ada istilah asing, baca dulu bagian **"Istilah Penting"** di bawah supaya tidak bingung saat baca langkah-langkahnya.

---

## Daftar Isi
1. Istilah Penting (baca ini dulu)
2. Yang perlu disiapkan
3. Tahap 1 — Buat Database (D1)
4. Tahap 2 — Buat Backend (Worker)
5. Tahap 3 — Upload Tampilan Website (Pages)
6. Tahap 4 — Sambungkan ke Google Drive
7. Cara Mengecek Semuanya Sudah Benar
8. Troubleshooting (kalau ada yang error)

---

## 1. Istilah Penting

Supaya panduan ini tidak terasa seperti bahasa asing, ini penjelasan sederhananya:

| Istilah | Penjelasan gampangnya |
|---|---|
| **Cloudflare** | Perusahaan penyedia layanan gratis yang kita pakai buat "menghidupkan" website SIADMINSAPA. Ibarat kita numpang server gratis di tempat mereka. |
| **Dashboard** | Halaman kontrol berbasis website (bukan aplikasi yang di-install). Semua pengaturan dilakukan dengan klik-klik di sini. |
| **D1 Database** | Tempat menyimpan semua DATA — daftar layanan, pengajuan warga, dsb. Ibarat lemari arsip digital. |
| **Worker** | "Otak" di belakang layar yang memproses permintaan — misalnya saat ada yang mengajukan legalisir, Worker inilah yang menyimpannya ke database. Ibarat petugas TU yang memproses berkas. |
| **Pages** | Tempat menaruh TAMPILAN website (yang dilihat pengunjung) — halaman depan, tombol, form, dsb. |
| **API** | Cara Worker dan tampilan website "ngobrol" satu sama lain. Tidak perlu dipahami detail, cukup tahu bahwa keduanya perlu "disambungkan" pakai sebuah alamat/URL. |
| **Service Account (Google)** | Semacam "akun robot" milik Google yang diberi izin khusus untuk menyimpan file ke folder Google Drive tertentu, mewakili aplikasi kita (bukan akun pribadimu). |
| **Secret / Environment Variable** | Kunci rahasia (mirip password) yang disimpan di pengaturan Worker, supaya kode program bisa "login" ke Google Drive dll tanpa kunci itu terlihat di kode publik. |
| **Deploy** | Istilah untuk "menerbitkan" / "menayangkan" — sama seperti klik "Publish" atau "Terbitkan". |

---

## 2. Yang Perlu Disiapkan

- [ ] Email aktif (buat daftar Cloudflare & Google Cloud)
- [ ] Folder project **`siadminsapa`** (hasil download dari chat ini) sudah ada di komputer
- [ ] Browser (Chrome/Edge/Firefox) — semua langkah dikerjakan lewat browser
- [ ] Waktu luang ±30–45 menit untuk pertama kali setup

Tidak perlu: Node.js, terminal/CMD, Git, atau software developer apa pun.

**Urutan tahap penting** — jangan diloncat, karena tahap 2 & 3 butuh informasi dari tahap sebelumnya:
```
Tahap 1 (Database)  →  Tahap 2 (Worker/Backend)  →  Tahap 3 (Tampilan Website)  →  Tahap 4 (Google Drive)
```

---

## 3. Tahap 1 — Buat Database (D1)

### 3.1 Daftar/masuk ke Cloudflare
1. Buka **https://dash.cloudflare.com** di browser.
2. Kalau belum punya akun: klik **Sign up**, isi email + password, verifikasi lewat email.
3. Kalau sudah: **Log in**.
4. Setelah masuk, kamu akan melihat halaman utama dashboard dengan menu-menu di sebelah kiri layar.

### 3.2 Membuat database
1. Di sidebar kiri, cari dan klik menu **Workers & Pages**.
2. Di halaman itu, cari tab/menu bertuliskan **D1 SQL Database** (kadang muncul di sidebar kiri sebagai menu terpisah bernama **D1**, kadang di dalam menu "Storage & Databases" — tergantung tampilan Cloudflare saat kamu akses, posisinya bisa sedikit beda tapi selalu ada tulisan "D1").
3. Klik tombol **Create Database** (biasanya tombol biru di kanan atas).
4. Di kolom nama, ketik: `siadminsapa-db`
5. Klik **Create**.
6. Tunggu beberapa detik — kamu akan diarahkan ke halaman database yang baru dibuat. Halaman ini kosong (belum ada tabel), itu wajar.

### 3.3 Mengisi struktur tabel (schema)
1. Masih di halaman database `siadminsapa-db`, cari tab bertuliskan **Console** (letaknya di bagian atas halaman, sejajar dengan tab "Overview", "Tables", dll).
2. Klik tab **Console** — akan muncul kotak kosong besar tempat kamu bisa mengetik/menempel perintah.
3. Sekarang buka file **`worker/schema.sql`** dari folder project `siadminsapa` di komputermu (buka pakai Notepad, atau klik dua kali kalau ada aplikasi teks default).
4. **Select All** (Ctrl+A) isi file itu → **Copy** (Ctrl+C).
5. Kembali ke tab Console di Cloudflare → klik di dalam kotak kosong → **Paste** (Ctrl+V).
6. Klik tombol **Execute** atau **Run** (biasanya di bawah/samping kotak teks).
7. Tunggu sebentar. Kalau berhasil, biasanya muncul tulisan hijau semacam "Query executed successfully" atau daftar hasil di bawahnya.
8. **Cara mengecek berhasil**: klik tab **Tables** di sebelah "Console" tadi. Kamu harus melihat daftar 9 tabel: `admin`, `site_settings`, `services`, `form_fields`, `pengajuan`, `status_log`, `pengajuan_files`, `pdf_templates`, `wa_templates`.

   > **Kalau tab Tables masih kosong / error saat Execute:** kemungkinan ada bagian dari `schema.sql` yang tidak ter-copy lengkap. Ulangi dari langkah 4 — pastikan copy dari baris paling atas (`-- ====...`) sampai baris paling bawah file.

### 3.4 Membuat akun admin (supaya kamu bisa login ke dashboard admin nanti)
1. Masih di tab **Console**, hapus dulu isi kotaknya (select all → delete), lalu ketik/paste perintah ini:
   ```sql
   INSERT INTO admin (username, password_hash, nama_lengkap) VALUES ('admin', 'admin123', 'Admin SDN 01 Papahan');
   ```
2. Klik **Execute**.
3. **PENTING soal password** — sistem login membandingkan password dalam bentuk "hash" (kode acak), bukan teks biasa. Supaya password `admin123` di atas benar-benar bisa dipakai login, kita perlu ganti isi `password_hash`-nya dengan hasil enkripsi SHA-256:
   - Buka tab browser baru → kunjungi **https://emn178.github.io/online-tools/sha256.html** (situs pihak ketiga gratis untuk generate hash, aman dipakai untuk keperluan ini).
   - Di kolom input, ketik password yang kamu mau, misal `admin123` (atau ganti dengan password lain yang kamu inginkan — makin unik makin aman).
   - Situs itu otomatis menampilkan hasil hash-nya (deretan huruf-angka panjang) — **copy hasil itu**.
   - Kembali ke tab Console Cloudflare D1, jalankan (ganti `HASIL_HASH_DI_SINI` dengan yang kamu copy tadi):
     ```sql
     UPDATE admin SET password_hash = 'HASIL_HASH_DI_SINI' WHERE username = 'admin';
     ```
   - Klik **Execute**.
4. **Catat baik-baik**: username (`admin`) dan password ASLI yang kamu masukkan ke situs hash tadi (bukan hasil hash-nya) — ini yang akan dipakai login ke dashboard admin nanti.

### 3.5 Catat Database ID
1. Klik tab **Overview** (di halaman database yang sama).
2. Cari tulisan **Database ID** — bentuknya deretan huruf-angka panjang dengan tanda strip, contoh: `a1b2c3d4-e5f6-...`.
3. **Copy dan simpan** ID ini di Notepad sementara — tidak dipakai langsung di tahap ini, tapi bagus untuk dicatat sebagai arsip.

✅ **Tahap 1 selesai** kalau: tabel sudah 9 buah, ada 1 baris di tabel `admin`, dan kamu sudah catat password aslinya.

---

## 4. Tahap 2 — Buat Backend (Worker)

### 4.1 Membuat Worker kosong
1. Dashboard Cloudflare → menu **Workers & Pages** di sidebar kiri.
2. Klik tombol **Create** (biasanya di kanan atas).
3. Akan muncul pilihan jenis project — pilih **Workers** (bukan Pages, itu untuk tahap 3 nanti).
4. Klik **Create Worker** (atau kadang ada opsi "Start from Hello World" — pilih itu kalau ditawarkan).
5. Beri nama Worker-nya, contoh: `siadminsapa-api`. Nama ini akan jadi bagian dari alamat website Worker-mu nanti.
6. Klik **Deploy**. Cloudflare akan menerbitkan Worker versi default/contoh dulu (isinya belum kode kita) — ini normal, akan kita ganti di langkah berikutnya.

### 4.2 Mengganti isi kode Worker
1. Setelah deploy selesai, cari dan klik tombol **Edit code** (biasanya muncul di halaman overview Worker, atau lewat tab **Deployments** → ada opsi edit).
2. Kamu akan masuk ke halaman **editor kode online** — mirip Notepad tapi di browser, dengan panel kode di tengah.
3. **Hapus semua kode default** yang sudah ada (klik di area kode → Ctrl+A → Delete).
4. Buka file **`worker/index.dashboard.js`** dari folder project di komputermu pakai Notepad → **Select All (Ctrl+A)** → **Copy (Ctrl+C)**.

   > ⚠️ **Penting**: pakai file `index.dashboard.js`, BUKAN `index.js`. File `index.dashboard.js` adalah versi yang sudah digabung jadi satu file lengkap (kode API + kode Google Drive jadi satu), karena editor Cloudflare di dashboard cuma bisa menerima satu file kode. File `index.js` terpisah dari `drive.js` dan hanya dipakai kalau kamu pakai CLI/wrangler.

5. Kembali ke editor Cloudflare → klik di area kode kosong tadi → **Paste (Ctrl+V)**.
6. Cari tombol **Save and deploy** (biasanya di kanan atas atau kanan bawah editor) → klik.
7. Tunggu proses selesai (beberapa detik), biasanya muncul notifikasi sukses.

### 4.3 Menyambungkan Worker ke Database D1
Worker sudah punya kode, tapi belum tahu di mana database-nya. Ini langkah menyambungkannya:
1. Dari halaman Worker `siadminsapa-api`, klik tab **Settings** (di bagian atas halaman).
2. Cari sub-menu/tab **Bindings** (kadang disebut "Variables and Bindings" atau terpisah sendiri).
3. Klik **Add binding** (atau **+ Add**).
4. Pilih tipe binding: **D1 database**.
5. Di kolom **Variable name**, ketik persis: `DB` (huruf besar semua, ini WAJIB sama persis karena kode program mencari nama ini).
6. Di kolom **D1 database**, pilih `siadminsapa-db` dari daftar dropdown (database yang kamu buat di Tahap 1).
7. Klik **Save** / **Deploy**.

### 4.4 Menambahkan kunci rahasia (Secret)
1. Masih di tab **Settings** Worker → cari sub-menu **Variables and Secrets** (kadang gabung dengan Bindings, kadang terpisah).
2. Klik **Add** / **Add variable**.
3. Buat variable pertama:
   - Nama: `JWT_SECRET`
   - Tipe: pilih **Secret** (bukan "Text biasa" — supaya nilainya disembunyikan/dienkripsi).
   - Nilai: ketik string acak sembarang yang panjang, minimal 20 karakter. Kalau bingung bikin sendiri, buka **https://randomkeygen.com** di tab baru, copy salah satu kode acak dari sana (misal dari bagian "CodeIgniter Encryption Keys"), lalu paste di sini.
4. Klik **Save**.
5. Untuk secret kedua (`GDRIVE_SA_JSON`), **lewati dulu** — ini baru diisi setelah Tahap 4 (Google Drive) selesai, karena isinya berasal dari file yang baru akan kita buat di sana. Aplikasi tetap bisa dipakai tanpa ini, hanya fitur upload file yang belum akan berfungsi sampai tahap 4 selesai.
6. Klik **Save and deploy** untuk menyimpan semua perubahan.

### 4.5 Mencatat alamat (URL) Worker-mu
1. Kembali ke halaman **Overview** Worker `siadminsapa-api`.
2. Cari alamat URL yang biasanya tertulis besar di bagian atas halaman, formatnya seperti:
   ```
   https://siadminsapa-api.NAMA-SUBDOMAIN-KAMU.workers.dev
   ```
3. **Copy dan simpan** alamat ini di Notepad — ini akan dipakai di Tahap 3.

✅ **Tahap 2 selesai** kalau: Worker sudah ter-deploy, binding `DB` sudah tersambung, secret `JWT_SECRET` sudah terisi, dan kamu sudah catat URL Worker-nya.

---

## 5. Tahap 3 — Upload Tampilan Website (Pages)

### 5.1 Mengisi alamat Worker ke file tampilan
1. Di komputer, buka folder project `siadminsapa` → masuk folder `js` → buka file **`api.js`** pakai Notepad (klik kanan → Open with → Notepad, atau aplikasi teks apa pun — jangan pakai Microsoft Word).
2. Cari baris di bagian paling atas yang bertuliskan:
   ```js
   const API_BASE = '';
   ```
3. Ganti jadi (paste URL Worker dari langkah 4.5 tadi, di antara tanda kutip):
   ```js
   const API_BASE = 'https://siadminsapa-api.namamu.workers.dev';
   ```
   Pastikan **tidak ada garis miring `/` di akhir URL**.
4. **Save** file (Ctrl+S). Kalau Notepad menawarkan pilihan format, pilih **All Files** dan pastikan nama tetap `api.js` (bukan `api.js.txt`).

### 5.2 Mengubah folder jadi file .zip
1. Di komputer, cari folder **`siadminsapa`** (folder utama project, yang di dalamnya ada folder `css`, `js`, `worker`, dan file `index.html`).
2. **Windows**: klik kanan folder `siadminsapa` → **Send to** → **Compressed (zipped) folder**. Akan muncul file baru `siadminsapa.zip`.
   **Mac**: klik kanan folder `siadminsapa` → **Compress "siadminsapa"**. Akan muncul file `siadminsapa.zip`.
3. Pastikan hasil file `.zip`-nya ada dan bisa ditemukan (biasanya muncul di lokasi yang sama dengan folder aslinya).

### 5.3 Upload ke Cloudflare Pages
1. Dashboard Cloudflare → **Workers & Pages** → klik **Create**.
2. Kali ini pilih tab **Pages** (bukan Workers).
3. Cari dan klik opsi **Upload assets** (biasanya ada pilihan lain "Connect to Git" — JANGAN pilih itu, kita pakai cara upload langsung).
4. Beri nama project, contoh: `siadminsapa` → lanjut.
5. Akan muncul kotak untuk **drag & drop** file. Seret file `siadminsapa.zip` dari file explorer/finder ke kotak itu (atau klik kotaknya untuk browse file secara manual).
6. Setelah file ke-upload, klik **Deploy site**.
7. Tunggu proses (biasanya 30 detik–2 menit). Setelah selesai, Cloudflare menampilkan alamat website kamu, formatnya:
   ```
   https://siadminsapa.pages.dev
   ```
8. Klik/buka alamat itu — website SIADMINSAPA kamu sudah bisa diakses publik!

### 5.4 Kalau nanti ada perubahan file
Setiap kali kamu edit file apa pun di folder project (misalnya ganti warna, ganti teks), ulangi:
1. Zip ulang foldernya (langkah 5.2).
2. Buka project Pages `siadminsapa` di dashboard → tab **Deployments**.
3. Klik **Create deployment** (atau tombol serupa untuk upload versi baru).
4. Upload ulang file `.zip` yang baru.

✅ **Tahap 3 selesai** kalau: website sudah bisa dibuka di alamat `.pages.dev`, halaman depan (landing page) muncul dengan benar.

---

## 6. Tahap 4 — Sambungkan ke Google Drive

Tahap ini supaya file yang diupload warga (scan ijazah, dll) tersimpan ke Google Drive sekolah, bukan hilang.

### 6.1 Buat project di Google Cloud
1. Buka **https://console.cloud.google.com**, login pakai akun Google (bisa akun sekolah atau pribadi, yang penting kamu yang pegang aksesnya).
2. Di bagian atas halaman, ada dropdown nama project (biasanya tulisan "Select a project"). Klik itu.
3. Klik **New Project**.
4. Nama project: `siadminsapa` → klik **Create**.
5. Tunggu beberapa detik sampai project selesai dibuat, lalu pastikan project ini yang aktif/terpilih (cek di dropdown nama project bagian atas).

### 6.2 Mengaktifkan Google Drive API
1. Di kotak pencarian bagian atas halaman (ikon kaca pembesar), ketik: `Google Drive API`.
2. Klik hasil pencarian **Google Drive API**.
3. Klik tombol **Enable**.
4. Tunggu sampai statusnya berubah jadi aktif.

### 6.3 Membuat "akun robot" (Service Account)
1. Klik ikon menu ☰ di kiri atas → cari **IAM & Admin** → klik **Service Accounts**.
2. Klik **+ Create Service Account** (di bagian atas).
3. Isi:
   - Service account name: `siadminsapa-drive`
   - (Kolom lain boleh dibiarkan default)
4. Klik **Create and Continue**.
5. Di bagian "Grant this service account access to project" — ini boleh **dilewati/skip** saja (klik **Continue** tanpa pilih role).
6. Klik **Done**.

### 6.4 Membuat kunci (key) untuk akun robot itu
1. Di daftar Service Accounts, klik nama `siadminsapa-drive` yang baru dibuat.
2. Klik tab **Keys**.
3. Klik **Add Key** → **Create new key**.
4. Pilih tipe **JSON** → klik **Create**.
5. File `.json` akan otomatis ke-download ke komputer kamu (biasanya masuk folder **Downloads**). Ini isinya seperti kunci rahasia — **jangan dikirim ke orang lain atau di-upload ke tempat umum**.

### 6.5 Menempelkan isi file JSON ke Worker
1. Buka file `.json` yang baru di-download tadi pakai Notepad.
2. **Select All (Ctrl+A) → Copy (Ctrl+C)** seluruh isinya (dari tanda `{` paling awal sampai `}` paling akhir).
3. Kembali ke dashboard Cloudflare → buka Worker `siadminsapa-api` → tab **Settings** → **Variables and Secrets**.
4. Cari/edit variable `GDRIVE_SA_JSON` yang sebelumnya dilewati di langkah 4.4. Kalau belum ada, klik **Add**:
   - Nama: `GDRIVE_SA_JSON`
   - Tipe: **Secret**
   - Nilai: **Paste** seluruh isi file JSON tadi.
5. Klik **Save and deploy**.

### 6.6 Membuat folder Google Drive & memberi izin akses
1. Buka **https://drive.google.com** (pakai akun Google yang sama dengan yang dipakai di Google Cloud Console).
2. Buat folder baru, misalnya kasih nama **"SIADMINSAPA Files"**.
3. Klik kanan folder itu → **Share** (Bagikan).
4. Buka lagi file `.json` tadi di Notepad, cari baris yang mengandung `"client_email"` — nilainya berbentuk email aneh, contoh:
   ```
   siadminsapa-drive@siadminsapa-123456.iam.gserviceaccount.com
   ```
5. **Copy** email itu (hanya bagian di antara tanda kutip, tanpa `"client_email":`).
6. Paste email itu ke kotak "Share" di Google Drive tadi.
7. Pastikan levelnya **Editor** (bukan "Viewer").
8. Klik **Send** / **Share**.

### 6.7 Mencatat Folder ID
1. Buka folder "SIADMINSAPA Files" tadi (double click, sampai masuk ke dalamnya).
2. Lihat alamat URL di address bar browser, formatnya:
   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
3. Bagian setelah `/folders/` (yaitu `1AbCdEfGhIjKlMnOpQrStUvWxYz` pada contoh) adalah **Folder ID**-nya. Copy bagian itu saja.

### 6.8 Memasukkan Folder ID ke dashboard admin SIADMINSAPA
1. Buka website SIADMINSAPA kamu (dari Tahap 3) → tambahkan `#/login` di akhir alamat, contoh:
   ```
   https://siadminsapa.pages.dev/#/login
   ```
2. Login pakai username & password yang kamu buat di langkah 3.4.
3. Di menu sidebar, klik **Pengaturan Situs**.
4. Cari kolom **ID Folder Google Drive Tujuan** → paste Folder ID dari langkah 6.7.
5. Klik **Simpan**.

✅ **Tahap 4 selesai** kalau: kolom Folder ID sudah terisi dan tersimpan tanpa error.

---

## 7. Cara Mengecek Semuanya Sudah Benar

Lakukan urutan tes ini di website kamu (`https://siadminsapa.pages.dev`):

1. **Buka halaman depan** — pastikan judul, daftar layanan, dan tombol-tombol muncul normal (bukan halaman putih kosong).
2. **Coba ajukan salah satu layanan** (isi form, submit) — harus muncul nomor resi setelah submit berhasil.
3. **Coba cek status** pakai nomor resi yang barusan didapat — harus muncul detail pengajuannya.
4. **Login ke dashboard admin** (`/#/login`) pakai akun dari Tahap 1 — harus berhasil masuk ke halaman Ringkasan.
5. **Buka menu Manajemen Pengajuan** — pengajuan yang tadi kamu submit harus muncul di daftar.
6. **Coba upload file feedback** dari halaman detail pengajuan — kalau berhasil tanpa error, berarti sambungan ke Google Drive (Tahap 4) sudah benar.

Kalau semua langkah di atas lancar tanpa pesan error merah — instalasi sudah selesai dan siap dipakai.

---

## 8. Troubleshooting (Kalau Ada yang Error)

| Gejala | Kemungkinan penyebab & solusi |
|---|---|
| Halaman depan blank/putih polos | Buka Console browser (klik kanan halaman → Inspect → tab Console) untuk lihat pesan error. Biasanya karena `API_BASE` di `js/api.js` salah ketik atau belum di-zip ulang & upload ulang setelah diedit. |
| Muncul tulisan "Gagal terhubung ke server" | Cek lagi `API_BASE` di `js/api.js` — pastikan sama persis dengan URL Worker (tanpa garis miring di akhir), dan Worker-nya sudah ter-deploy (Tahap 2). |
| Tidak bisa login admin ("Username atau password salah") padahal sudah benar | Kemungkinan hash password di database belum diganti dengan benar (lihat ulang langkah 3.4) — pastikan hasil SHA-256 yang di-paste ke `UPDATE admin SET ...` sudah dari password yang sama dengan yang kamu masukkan sekarang. |
| Setelah login langsung ke-logout sendiri / diarahkan ke halaman login lagi | Cek apakah secret `JWT_SECRET` di Worker sudah terisi (langkah 4.4). |
| Error saat submit pengajuan/upload file: berkaitan dengan Drive | Cek lagi: (a) `GDRIVE_SA_JSON` sudah di-paste lengkap dan benar di Worker, (b) folder Drive sudah di-share ke `client_email` dengan akses Editor, (c) Folder ID sudah benar di menu Pengaturan Situs. |
| Setelah edit `schema.sql`/query D1 tidak ada perubahan | Pastikan klik **Execute** setelah paste, dan cek tab **Tables** untuk konfirmasi datanya benar-benar tersimpan. |
| Sudah upload ulang .zip tapi perubahan tidak muncul di website | Coba refresh browser dengan **Ctrl+Shift+R** (hard refresh, supaya tidak pakai file lama yang ke-cache), atau cek di tab **Deployments** Pages apakah upload terbaru statusnya sudah "Success". |

---

Kalau masih ada langkah yang bikin bingung atau errornya tidak ada di tabel di atas, kasih tahu saya **di bagian mana** dan **pesan error apa yang muncul** (boleh screenshot/copy teksnya) — saya bantu telusuri dari situ.

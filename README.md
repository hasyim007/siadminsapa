# SIADMINSAPA
Sistem Informasi Administrasi SDN 01 Papahan — v1.0 (SPA)

## Status
`js/api.js` sudah tersambung penuh ke Worker via `fetch()` (bukan mode demo/localStorage). Supaya jalan, backend (D1 + Worker) harus sudah di-deploy dan `API_BASE` di `js/api.js` sudah diisi URL Worker-nya.

**Login admin default (setelah setup):** `admin` / `admin123` (di-hash SHA-256 saat dibuat, lihat panduan).

## Cara deploy — dua opsi
- **Tanpa CLI (drag & drop lewat dashboard Cloudflare + Google Cloud Console):** ikuti `PANDUAN-DEPLOY-TANPA-CLI.md` — semua lewat browser.
- **Pakai CLI (wrangler):**
  1. `wrangler d1 create siadminsapa-db`, tempel `database_id` ke `wrangler.toml`.
  2. `wrangler d1 execute siadminsapa-db --file=worker/schema.sql`
  3. `wrangler secret put JWT_SECRET`
  4. `wrangler secret put GDRIVE_SA_JSON` (isi: seluruh isi file JSON service account GCP)
  5. `wrangler deploy`
  6. Isi `API_BASE` di `js/api.js` dengan URL Worker hasil deploy.

## Struktur folder
Lihat brief proyek untuk detail skema database & fitur per modul.

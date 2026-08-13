# SIADMINSAPA
Sistem Informasi Administrasi SDN 01 Papahan — v1.0 (SPA)

## Status
Frontend (`public/`) dan backend (`worker/`) sekarang di-deploy sebagai **satu Cloudflare Worker** (bukan Worker + Pages terpisah lagi). `js/api.js` fetch ke `/api/...` secara relatif (same-origin) — `API_BASE` sengaja dibiarkan kosong.

**Login admin default (setelah setup):** `admin` / `admin123` (di-hash SHA-256 saat dibuat, lihat panduan).

## Cara deploy
Ikuti **`PANDUAN-DEPLOY-WORKERS.md`** — pakai `wrangler` CLI (butuh Node.js), langkah-langkahnya:
1. `wrangler d1 create siadminsapa-db`, tempel `database_id` ke `wrangler.toml`.
2. `wrangler d1 execute siadminsapa-db --remote --file=worker/schema.sql`
3. `wrangler secret put JWT_SECRET`
4. `wrangler secret put GDRIVE_SA_JSON` (isi: seluruh isi file JSON service account GCP)
5. `wrangler deploy` — frontend & API ikut ter-deploy sekaligus, satu URL.

## Struktur folder
```
wrangler.toml       — konfigurasi Worker + static assets (D1 binding, dsb)
worker/              — kode backend (API), dijalankan sebagai Worker script
  index.js
  drive.js
  schema.sql
public/              — kode frontend (SPA), dilayani sebagai static assets
  index.html
  css/
  js/
```

Lihat brief proyek untuk detail skema database & fitur per modul.

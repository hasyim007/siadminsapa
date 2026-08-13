-- ============================================================
-- SIADMINSAPA — Skema Cloudflare D1 (SQLite)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama_lengkap TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pdf_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_template TEXT NOT NULL,
  service_id INTEGER,
  konten_html TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  icon TEXT,
  warna_tema TEXT,
  urutan INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT 1,
  perlu_cetak_pdf BOOLEAN DEFAULT 0,
  template_pdf_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_pdf_id) REFERENCES pdf_templates(id)
);

CREATE TABLE IF NOT EXISTS form_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('text','number','date','select','textarea','tel','file')),
  placeholder TEXT,
  opsi_select TEXT,
  wajib BOOLEAN DEFAULT 0,
  urutan INTEGER DEFAULT 0,
  helper_text TEXT,
  file_max_size_mb INTEGER,
  file_allowed_types TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pengajuan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  nomor_resi TEXT UNIQUE NOT NULL,
  data_form TEXT,
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diproses','selesai','ditolak')),
  catatan_admin TEXT,
  no_wa_pemohon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS status_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pengajuan_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pengajuan_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pengajuan_id INTEGER NOT NULL,
  field_key TEXT,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('publik','admin')),
  nama_file TEXT,
  drive_file_id TEXT,
  drive_view_link TEXT,
  tipe_file TEXT,
  ukuran_kb INTEGER,
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wa_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT UNIQUE NOT NULL CHECK (status IN ('baru','diproses','selesai','ditolak')),
  template_pesan TEXT
);

-- Indeks untuk pencarian yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_service ON pengajuan(service_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_resi ON pengajuan(nomor_resi);
CREATE INDEX IF NOT EXISTS idx_formfields_service ON form_fields(service_id);
CREATE INDEX IF NOT EXISTS idx_statuslog_pengajuan ON status_log(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_files_pengajuan ON pengajuan_files(pengajuan_id);

-- Seed default
INSERT OR IGNORE INTO wa_templates (status, template_pesan) VALUES
  ('baru', 'Halo {{nama_pemohon}}, pengajuan {{nama_layanan}} Anda dengan resi *{{nomor_resi}}* telah kami terima.'),
  ('diproses', 'Halo {{nama_pemohon}}, pengajuan {{nama_layanan}} (resi {{nomor_resi}}) sedang kami proses.'),
  ('selesai', 'Halo {{nama_pemohon}}, pengajuan {{nama_layanan}} (resi {{nomor_resi}}) sudah *selesai*. Catatan: {{catatan_admin}}'),
  ('ditolak', 'Halo {{nama_pemohon}}, mohon maaf pengajuan {{nama_layanan}} (resi {{nomor_resi}}) belum bisa kami proses. Catatan: {{catatan_admin}}');

/* ============================================================
   worker/index.js — entry Cloudflare Worker (API routes)
   ------------------------------------------------------------
   BELUM DI-DEPLOY. Ini kerangka kerja routing + query D1 yang
   signature-nya dibuat SEJAJAR dengan fungsi-fungsi di js/api.js,
   supaya saat frontend disambungkan tinggal ganti isi tiap
   fungsi di api.js dengan fetch(API_BASE + endpoint_ini).

   Bindings yang perlu diset di wrangler.toml:
     - DB              (D1 database, lihat schema.sql)
     - JWT_SECRET       (string acak untuk sign token admin)
     - GDRIVE_SA_JSON    (isi file service-account.json, sebagai secret)

   Jalankan lokal: wrangler dev
   Deploy:          wrangler deploy
   ============================================================ */

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method;

    try {
      // ---------- PUBLIC ----------
      if (path === '/api/site-settings' && method === 'GET') return json(await getSiteSettings(env));
      if (path === '/api/services' && method === 'GET') return json(await getServices(env, true));
      if (path === '/api/stats' && method === 'GET') return json(await getStats(env)); // publik: dipakai landing page & dashboard admin
      if (path === '/api/pengajuan' && method === 'POST') return json(await createPengajuan(env, await request.json()));
      if (path.match(/^\/api\/status\/[^/]+$/) && method === 'GET') return json(await getStatusByResi(env, decodeURIComponent(path.split('/').pop())));

      // ---------- ADMIN AUTH ----------
      if (path === '/api/admin/login' && method === 'POST') return json(await adminLogin(env, await request.json()));

      // Semua rute /api/admin/* di bawah ini butuh token valid
      if (path.startsWith('/api/admin/')) {
        const authed = await verifyAdminToken(request, env);
        if (!authed) return json({ error: 'Unauthorized' }, 401);
      }

      if (path === '/api/admin/account' && method === 'PUT') return json(await updateAdminAccount(env, await request.json()));

      if (path === '/api/admin/services' && method === 'GET') return json(await getServices(env, false));
      if (path === '/api/admin/services' && method === 'POST') return json(await createService(env, await request.json()));
      if (path.match(/^\/api\/admin\/services\/\d+$/) && method === 'PUT') return json(await updateService(env, idFromPath(path), await request.json()));
      if (path.match(/^\/api\/admin\/services\/\d+$/) && method === 'DELETE') return json(await deleteService(env, idFromPath(path)));
      if (path.match(/^\/api\/admin\/services\/\d+\/fields$/) && method === 'PUT') return json(await saveFormFields(env, idFromPath(path.replace('/fields', '')), await request.json()));

      if (path === '/api/admin/pengajuan' && method === 'GET') return json(await listPengajuan(env, url.searchParams));
      if (path.match(/^\/api\/admin\/pengajuan\/\d+$/) && method === 'GET') return json(await getPengajuanDetail(env, idFromPath(path)));
      if (path.match(/^\/api\/admin\/pengajuan\/\d+\/status$/) && method === 'PUT') return json(await updateStatus(env, idFromPath(path.replace('/status', '')), await request.json()));
      if (path.match(/^\/api\/admin\/pengajuan\/\d+\/feedback-file$/) && method === 'POST') return json(await uploadFeedbackFile(env, idFromPath(path.replace('/feedback-file', '')), request));

      if (path === '/api/admin/wa-templates' && method === 'GET') return json(await getWaTemplates(env));
      if (path.match(/^\/api\/admin\/wa-templates\/[^/]+$/) && method === 'PUT') return json(await saveWaTemplate(env, path.split('/').pop(), await request.json()));

      if (path === '/api/admin/pdf-templates' && method === 'GET') return json(await getPdfTemplates(env));
      if (path === '/api/admin/pdf-templates' && method === 'POST') return json(await savePdfTemplate(env, null, await request.json()));
      if (path.match(/^\/api\/admin\/pdf-templates\/\d+$/) && method === 'PUT') return json(await savePdfTemplate(env, idFromPath(path), await request.json()));

      if (path === '/api/admin/site-settings' && method === 'PUT') return json(await updateSiteSettings(env, await request.json()));
      if (path === '/api/admin/stats' && method === 'GET') return json(await getStats(env));
      if (path === '/api/admin/export-csv' && method === 'GET') return await exportCsv(env);

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'Internal error', detail: String(err) }, 500);
    }
  },
};

function idFromPath(path) { return Number(path.split('/').pop()); }

/* ---------- Helpers: auth ---------- */
async function adminLogin(env, { username, password }) {
  const row = await env.DB.prepare('SELECT * FROM admin WHERE username = ?').bind(username).first();
  if (!row) return { ok: false, error: 'Username atau password salah.' };
  const hash = await sha256(password);
  if (hash !== row.password_hash) return { ok: false, error: 'Username atau password salah.' };
  const token = await signToken({ sub: row.id, username: row.username }, env.JWT_SECRET);
  return { ok: true, token, username: row.username, nama_lengkap: row.nama_lengkap };
}

async function updateAdminAccount(env, { username, password }) {
  const updates = [];
  const binds = [];
  if (username) { updates.push('username = ?'); binds.push(username); }
  if (password) { updates.push('password_hash = ?'); binds.push(await sha256(password)); }
  if (updates.length === 0) return { ok: true };
  await env.DB.prepare(`UPDATE admin SET ${updates.join(', ')} WHERE id = 1`).bind(...binds).run();
  return { ok: true };
}

async function verifyAdminToken(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  return verifyToken(token, env.JWT_SECRET);
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// JWT sederhana (HMAC-SHA256) — cukup untuk 1 akun admin. Untuk produksi
// yang lebih ketat, pertimbangkan expiry pendek + refresh token.
async function signToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${enc(header)}.${enc({ ...payload, iat: Date.now() })}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sigB64}`;
}

async function verifyToken(token, secret) {
  try {
    const [h, p, s] = token.split('.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sig = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${h}.${p}`));
  } catch { return false; }
}

/* ---------- Site settings ---------- */
async function getSiteSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
  return Object.fromEntries(results.map(r => [r.key, r.value]));
}
async function updateSiteSettings(env, patch) {
  const stmts = Object.entries(patch).map(([k, v]) =>
    env.DB.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP').bind(k, v)
  );
  await env.DB.batch(stmts);
  return { ok: true };
}

/* ---------- Services ---------- */
async function getServices(env, onlyActive) {
  const q = onlyActive ? 'SELECT * FROM services WHERE aktif = 1 ORDER BY urutan' : 'SELECT * FROM services ORDER BY urutan';
  const { results: services } = await env.DB.prepare(q).all();
  const { results: fields } = await env.DB.prepare('SELECT * FROM form_fields ORDER BY urutan').all();
  return services.map(s => ({ ...s, fields: fields.filter(f => f.service_id === s.id) }));
}
async function createService(env, payload) {
  const r = await env.DB.prepare(`INSERT INTO services (slug, nama, deskripsi, icon, warna_tema, urutan, aktif, perlu_cetak_pdf) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(payload.slug, payload.nama, payload.deskripsi || '', payload.icon || '', payload.warna_tema || '#0F7A68', payload.urutan || 0, payload.aktif ?? 1, payload.perlu_cetak_pdf ?? 0).run();
  return { id: r.meta.last_row_id, ...payload };
}
async function updateService(env, id, payload) {
  const fields = Object.keys(payload);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await env.DB.prepare(`UPDATE services SET ${setClause} WHERE id = ?`).bind(...fields.map(f => payload[f]), id).run();
  return { ok: true };
}
async function deleteService(env, id) {
  await env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
  return { ok: true };
}
async function saveFormFields(env, serviceId, fields) {
  await env.DB.prepare('DELETE FROM form_fields WHERE service_id = ?').bind(serviceId).run();
  const stmts = fields.map((f, i) => env.DB.prepare(
    `INSERT INTO form_fields (service_id, label, field_key, tipe, placeholder, opsi_select, wajib, urutan, helper_text, file_max_size_mb, file_allowed_types) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(serviceId, f.label, f.field_key, f.tipe, f.placeholder || '', f.opsi_select || null, f.wajib ? 1 : 0, i + 1, f.helper_text || '', f.file_max_size_mb || null, f.file_allowed_types || null));
  if (stmts.length) await env.DB.batch(stmts);
  return { ok: true };
}

/* ---------- Pengajuan (publik) ---------- */
function generateResi() {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `SAPA-${y}-${rand}`; // Catatan: di produksi, cek uniqueness ke DB / pakai counter transaksional
}

async function createPengajuan(env, body) {
  const { serviceId, dataForm, noWaPemohon, files = [] } = body;
  const nomor_resi = generateResi();
  const r = await env.DB.prepare(`INSERT INTO pengajuan (service_id, nomor_resi, data_form, status, no_wa_pemohon) VALUES (?,?,?, 'baru', ?)`)
    .bind(serviceId, nomor_resi, JSON.stringify(dataForm), noWaPemohon || '').run();
  const pengajuanId = r.meta.last_row_id;
  await env.DB.prepare(`INSERT INTO status_log (pengajuan_id, status, catatan) VALUES (?, 'baru', 'Pengajuan diterima sistem.')`).bind(pengajuanId).run();

  // Upload file ke Google Drive lalu simpan referensinya (lihat drive.js)
  for (const f of files) {
    const uploaded = await uploadToDrive(env, f);
    await env.DB.prepare(`INSERT INTO pengajuan_files (pengajuan_id, field_key, uploaded_by, nama_file, drive_file_id, drive_view_link, tipe_file, ukuran_kb) VALUES (?,?, 'publik', ?,?,?,?,?)`)
      .bind(pengajuanId, f.field_key, uploaded.name, uploaded.id, uploaded.viewLink, f.tipe_file, f.ukuran_kb).run();
  }
  return { nomor_resi, id: pengajuanId };
}

async function getStatusByResi(env, resi) {
  const p = await env.DB.prepare('SELECT * FROM pengajuan WHERE nomor_resi = ?').bind(resi).first();
  if (!p) return null;
  const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(p.service_id).first();
  const { results: logs } = await env.DB.prepare('SELECT * FROM status_log WHERE pengajuan_id = ? ORDER BY id').bind(p.id).all();
  const { results: files } = await env.DB.prepare('SELECT * FROM pengajuan_files WHERE pengajuan_id = ?').bind(p.id).all();
  return { ...p, service, logs, files };
}

/* ---------- Pengajuan (admin) ---------- */
async function listPengajuan(env, params) {
  const status = params.get('status') || 'semua';
  const serviceId = params.get('serviceId') || 'semua';
  let q = 'SELECT p.*, s.nama as service_nama FROM pengajuan p LEFT JOIN services s ON s.id = p.service_id WHERE 1=1';
  const binds = [];
  if (status !== 'semua') { q += ' AND p.status = ?'; binds.push(status); }
  if (serviceId !== 'semua') { q += ' AND p.service_id = ?'; binds.push(Number(serviceId)); }
  q += ' ORDER BY p.created_at DESC';
  const { results } = await env.DB.prepare(q).bind(...binds).all();
  return results.map(r => ({ ...r, service: r.service_nama ? { nama: r.service_nama } : null }));
}
async function getPengajuanDetail(env, id) {
  const p = await env.DB.prepare('SELECT * FROM pengajuan WHERE id = ?').bind(id).first();
  if (!p) return null;
  const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(p.service_id).first();
  const { results: logs } = await env.DB.prepare('SELECT * FROM status_log WHERE pengajuan_id = ? ORDER BY id').bind(id).all();
  const { results: files } = await env.DB.prepare('SELECT * FROM pengajuan_files WHERE pengajuan_id = ?').bind(id).all();
  return { ...p, service, logs, files };
}
async function updateStatus(env, id, { status, catatan_admin }) {
  await env.DB.prepare('UPDATE pengajuan SET status = ?, catatan_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, catatan_admin || '', id).run();
  await env.DB.prepare('INSERT INTO status_log (pengajuan_id, status, catatan) VALUES (?,?,?)').bind(id, status, catatan_admin || '').run();
  return { ok: true };
}
async function uploadFeedbackFile(env, pengajuanId, request) {
  const form = await request.formData();
  const file = form.get('file');
  const uploaded = await uploadToDrive(env, { nama_file: file.name, tipe_file: file.type, blob: file });
  await env.DB.prepare(`INSERT INTO pengajuan_files (pengajuan_id, field_key, uploaded_by, nama_file, drive_file_id, drive_view_link, tipe_file) VALUES (?, 'admin_feedback', 'admin', ?,?,?,?)`)
    .bind(pengajuanId, uploaded.name, uploaded.id, uploaded.viewLink, file.type).run();
  return { ok: true };
}

/* ---------- WA templates ---------- */
async function getWaTemplates(env) {
  const { results } = await env.DB.prepare('SELECT * FROM wa_templates').all();
  return results;
}
async function saveWaTemplate(env, status, { template_pesan }) {
  await env.DB.prepare('UPDATE wa_templates SET template_pesan = ? WHERE status = ?').bind(template_pesan, status).run();
  return { ok: true };
}

/* ---------- PDF templates ---------- */
async function getPdfTemplates(env) {
  const { results } = await env.DB.prepare('SELECT * FROM pdf_templates').all();
  return results;
}
async function savePdfTemplate(env, id, payload) {
  if (id) {
    const fields = Object.keys(payload);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await env.DB.prepare(`UPDATE pdf_templates SET ${setClause} WHERE id = ?`).bind(...fields.map(f => payload[f]), id).run();
    return { ok: true, id };
  }
  const r = await env.DB.prepare('INSERT INTO pdf_templates (nama_template, service_id, konten_html) VALUES (?,?,?)')
    .bind(payload.nama_template, payload.service_id || null, payload.konten_html || '').run();
  return { ok: true, id: r.meta.last_row_id };
}

/* ---------- Stats & export ---------- */
async function getStats(env) {
  const total = (await env.DB.prepare('SELECT COUNT(*) as c FROM pengajuan').first()).c;
  const { results: byStatusRows } = await env.DB.prepare('SELECT status, COUNT(*) as c FROM pengajuan GROUP BY status').all();
  const { results: byServiceRows } = await env.DB.prepare(
    'SELECT s.nama as nama, COUNT(*) as c FROM pengajuan p JOIN services s ON s.id = p.service_id GROUP BY p.service_id'
  ).all();
  const { results: byMonthRows } = await env.DB.prepare(
    `SELECT substr(created_at, 1, 7) as bulan, COUNT(*) as c FROM pengajuan GROUP BY bulan ORDER BY bulan`
  ).all();
  const servicesActive = (await env.DB.prepare('SELECT COUNT(*) as c FROM services WHERE aktif = 1').first()).c;
  return {
    total,
    byStatus: Object.fromEntries(byStatusRows.map(r => [r.status, r.c])),
    byService: Object.fromEntries(byServiceRows.map(r => [r.nama, r.c])),
    byMonth: Object.fromEntries(byMonthRows.map(r => [r.bulan, r.c])),
    servicesActive,
  };
}
async function exportCsv(env) {
  const { results } = await env.DB.prepare(
    `SELECT p.nomor_resi, s.nama as layanan, p.status, p.no_wa_pemohon, p.created_at, p.catatan_admin
     FROM pengajuan p LEFT JOIN services s ON s.id = p.service_id ORDER BY p.created_at DESC`
  ).all();
  const rows = [['Resi', 'Layanan', 'Status', 'No WA', 'Tanggal', 'Catatan Admin'], ...results.map(r => [r.nomor_resi, r.layanan, r.status, r.no_wa_pemohon, r.created_at, r.catatan_admin || ''])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="pengajuan.csv"', 'Access-Control-Allow-Origin': '*' } });
}

/* ============================================================
   --- digabung dari worker/drive.js (supaya bisa di-paste sebagai
   satu file di Cloudflare dashboard, tanpa CLI/wrangler) ---
   ============================================================ */

/* ============================================================
   worker/drive.js — integrasi Google Drive API via Service Account
   ------------------------------------------------------------
   Alur:
   1. Buat JWT ditandatangani dengan private key service account
      (RS256), lalu tukar ke Google OAuth token endpoint untuk
      dapat access_token (Bearer).
   2. Pakai access_token itu untuk upload file (multipart) ke
      Drive API, ke folder yang di-share ke email service account
      (ID folder disimpan di site_settings.gdrive_folder_id).
   3. Set permission file supaya bisa diakses lewat link (untuk
      ditampilkan/diunduh dari halaman cek status & dashboard admin).

   env.GDRIVE_SA_JSON berisi seluruh isi file JSON service account
   (disimpan sebagai secret Worker, BUKAN di-commit ke repo).
   ============================================================ */

let _cachedToken = null; // { access_token, exp }

async function getAccessToken(env) {
  if (_cachedToken && _cachedToken.exp > Date.now() / 1000 + 30) {
    return _cachedToken.access_token;
  }
  const sa = JSON.parse(env.GDRIVE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64url(header)}.${b64url(claim)}`;

  const key = await importPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsigned}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gagal ambil token Google: ' + JSON.stringify(data));

  _cachedToken = { access_token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

async function importPrivateKey(pem) {
  const pemBody = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binary.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

/**
 * Upload satu file ke Google Drive.
 * @param {object} env - Worker environment (butuh GDRIVE_SA_JSON + DB untuk baca folder tujuan)
 * @param {{ nama_file: string, tipe_file: string, blob?: Blob, dataUrl?: string }} file
 * @returns {{ id: string, name: string, viewLink: string }}
 */
async function uploadToDrive(env, file) {
  const accessToken = await getAccessToken(env);
  const folderRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'gdrive_folder_id'").first();
  const folderId = folderRow?.value;
  if (!folderId) throw new Error('gdrive_folder_id belum diatur di Pengaturan Situs.');

  const blob = file.blob || dataUrlToBlob(file.dataUrl, file.tipe_file);
  const metadata = { name: file.nama_file, parents: [folderId] };

  const boundary = '-------siadminsapa' + Date.now();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${file.tipe_file || 'application/octet-stream'}\r\n\r\n`;
  const bodyBytes = new Blob([body, blob, `\r\n--${boundary}--`]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: bodyBytes,
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gagal upload ke Drive: ' + JSON.stringify(data));

  // Beri akses "anyone with link can view" supaya bisa dibuka dari halaman cek status publik
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return { id: data.id, name: data.name, viewLink: data.webViewLink };
}

function dataUrlToBlob(dataUrl, mime) {
  const [, b64] = dataUrl.split(',');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

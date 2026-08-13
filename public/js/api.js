/* ============================================================
   api.js — wrapper ke Worker API (TERSAMBUNG, bukan mode demo)
   ------------------------------------------------------------
   Semua fungsi di sini fetch() ke Worker sungguhan. Sejak frontend
   ini dilayani dari Worker yang SAMA (lihat wrangler.toml — [assets]
   + main worker/index.js jadi satu deployment), API_BASE dibiarkan
   kosong ('') supaya request ke /api/... otomatis same-origin —
   tidak perlu diisi URL apa pun, dan tidak ada masalah CORS.
   Token admin diambil otomatis dari STATE.session.token (state.js)
   dan disisipkan sebagai header Authorization di tiap request admin.
   ============================================================ */

const API_BASE = ''; // sengaja kosong: frontend & Worker API satu origin

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body) headers['Content-Type'] = 'application/json';
  if (STATE.session && STATE.session.token) headers['Authorization'] = 'Bearer ' + STATE.session.token;

  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (err) {
    toast('Gagal terhubung ke server. Cek koneksi / API_BASE di js/api.js.');
    throw err;
  }

  if (res.status === 401) {
    setSession(null);
    if (location.hash.startsWith('#/dashboard')) location.hash = '#/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    let msg = `Terjadi kesalahan (${res.status})`;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch (e) { /* bukan JSON */ }
    toast(msg);
    throw new Error(msg);
  }

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('text/csv')) return res.text();
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function dataUrlToBlob(dataUrl, mime) {
  const [, b64] = dataUrl.split(',');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const api = {

  /* ---------- Publik ---------- */
  async getSiteSettings() {
    return apiFetch('/api/site-settings');
  },

  async getServices({ onlyActive = true } = {}) {
    if (onlyActive) return apiFetch('/api/services');
    return this.adminGetServices();
  },

  async getServiceBySlug(slug) {
    const list = await this.getServices({ onlyActive: true });
    return list.find(s => s.slug === slug) || null;
  },

  async submitPengajuan({ serviceId, dataForm, noWaPemohon, files = [] }) {
    return apiFetch('/api/pengajuan', {
      method: 'POST',
      body: JSON.stringify({ serviceId, dataForm, noWaPemohon, files }),
    });
  },

  async checkStatus(nomorResi) {
    return apiFetch('/api/status/' + encodeURIComponent(String(nomorResi).trim()));
  },

  /* ---------- Admin: auth ---------- */
  async login(username, password) {
    return apiFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },

  async updateAdminAccount({ username, password }) {
    return apiFetch('/api/admin/account', { method: 'PUT', body: JSON.stringify({ username, password }) });
  },

  /* ---------- Admin: services + form builder ---------- */
  async adminGetServices() {
    return apiFetch('/api/admin/services');
  },

  async createService(payload) {
    return apiFetch('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateService(id, payload) {
    return apiFetch(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteService(id) {
    return apiFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
  },

  async saveFormFields(serviceId, fields) {
    return apiFetch(`/api/admin/services/${serviceId}/fields`, { method: 'PUT', body: JSON.stringify(fields) });
  },

  /* ---------- Admin: pengajuan ---------- */
  async adminListPengajuan({ status = 'semua', serviceId = 'semua' } = {}) {
    const params = new URLSearchParams({ status: String(status), serviceId: String(serviceId) });
    return apiFetch('/api/admin/pengajuan?' + params.toString());
  },

  async adminGetPengajuanDetail(id) {
    return apiFetch(`/api/admin/pengajuan/${id}`);
  },

  async updatePengajuanStatus(id, { status, catatan_admin }) {
    return apiFetch(`/api/admin/pengajuan/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, catatan_admin }) });
  },

  async uploadAdminFeedbackFile(pengajuanId, { nama_file, tipe_file, ukuran_kb, dataUrl }) {
    const blob = dataUrlToBlob(dataUrl, tipe_file);
    const form = new FormData();
    form.append('file', blob, nama_file);
    return apiFetch(`/api/admin/pengajuan/${pengajuanId}/feedback-file`, { method: 'POST', body: form });
  },

  async exportPengajuanCSV() {
    return apiFetch('/api/admin/export-csv');
  },

  /* ---------- Admin: WA templates ---------- */
  async getWaTemplates() {
    return apiFetch('/api/admin/wa-templates');
  },
  async saveWaTemplate(status, template_pesan) {
    return apiFetch(`/api/admin/wa-templates/${status}`, { method: 'PUT', body: JSON.stringify({ template_pesan }) });
  },

  /* ---------- Admin: PDF templates ---------- */
  async getPdfTemplates() {
    return apiFetch('/api/admin/pdf-templates');
  },
  async savePdfTemplate(id, payload) {
    if (id) return apiFetch(`/api/admin/pdf-templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return apiFetch('/api/admin/pdf-templates', { method: 'POST', body: JSON.stringify(payload) });
  },

  /* ---------- Admin: site settings ---------- */
  async updateSiteSettings(patch) {
    return apiFetch('/api/admin/site-settings', { method: 'PUT', body: JSON.stringify(patch) });
  },

  /* ---------- Stats (publik, dipakai landing page & dashboard admin) ---------- */
  async getStats() {
    return apiFetch('/api/stats');
  },
};

/* ============================================================
   state.js — app state, session admin, cache
   Sumber kebenaran sementara untuk UI. Data aktual datang dari
   api.js (yang saat ini membaca/menulis localStorage sebagai
   pengganti Worker API — lihat catatan di api.js).
   ============================================================ */

const STATE = {
  session: null,        // { username, token } | null
  siteSettings: {},      // dari tabel site_settings
  services: [],           // dari tabel services (+ form_fields)
  pengajuanCache: [],     // cache terakhir untuk dashboard admin
};

const SESSION_KEY = 'siadminsapa_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    STATE.session = raw ? JSON.parse(raw) : null;
  } catch (e) {
    STATE.session = null;
  }
  return STATE.session;
}

function setSession(session) {
  STATE.session = session;
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!(STATE.session && STATE.session.token);
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

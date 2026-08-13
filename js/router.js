/* ============================================================
   router.js — hash router + route guard
   Route yang didukung:
     #/                          -> publicHome
     #/login                     -> adminLogin
     #/dashboard                 -> adminDashboard (ringkasan)
     #/dashboard/pengajuan       -> adminPengajuan
     #/dashboard/pengajuan/:id   -> adminPengajuan (detail)
     #/dashboard/layanan         -> adminServices
     #/dashboard/wa              -> adminWaTemplate
     #/dashboard/pengaturan      -> adminSettings
   ============================================================ */

const routes = [];

function registerRoute(pattern, handler) {
  // pattern: '#/dashboard/pengajuan/:id' -> regex + param names
  const paramNames = [];
  const regexStr = pattern.replace(/:[a-zA-Z]+/g, (m) => {
    paramNames.push(m.slice(1));
    return '([^/]+)';
  });
  routes.push({ regex: new RegExp('^' + regexStr + '$'), paramNames, handler });
}

function matchRoute(hash) {
  for (const r of routes) {
    const m = hash.match(r.regex);
    if (m) {
      const params = {};
      r.paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
      return { handler: r.handler, params };
    }
  }
  return null;
}

function currentHash() {
  return (location.hash || '#/').split('?')[0];
}

function isAdminRoute(hash) {
  return hash.startsWith('#/dashboard');
}

async function handleRoute() {
  let hash = currentHash();
  if (!hash || hash === '#') hash = '#/';

  // Guard: rute admin butuh session valid
  if (isAdminRoute(hash) && !isLoggedIn()) {
    location.hash = '#/login';
    return;
  }
  // Kalau sudah login tapi buka #/login, arahkan ke dashboard
  if (hash === '#/login' && isLoggedIn()) {
    location.hash = '#/dashboard';
    return;
  }

  const match = matchRoute(hash);
  const root = document.getElementById('app-root');

  if (!match) {
    root.innerHTML = renderNotFound();
    return;
  }

  try {
    await match.handler(root, match.params);
  } catch (err) {
    console.error('Route render error:', err);
    root.innerHTML = `<div class="wrap" style="padding:60px 0;text-align:center;">
      <p class="text-muted">Terjadi kesalahan saat memuat halaman.</p>
    </div>`;
  }
  window.scrollTo(0, 0);
}

function renderNotFound() {
  return `<div class="wrap" style="padding:80px 0;text-align:center;">
    <h2>Halaman tidak ditemukan</h2>
    <p class="text-muted">Rute ${escapeHtml(currentHash())} tidak dikenali.</p>
    <a class="btn btn-primary mt-3" href="#/">Kembali ke Beranda</a>
  </div>`;
}

function initRouter() {
  registerRoute('#/', renderPublicHome);
  registerRoute('#/login', renderAdminLogin);
  registerRoute('#/dashboard', renderAdminDashboard);
  registerRoute('#/dashboard/pengajuan', renderAdminPengajuanList);
  registerRoute('#/dashboard/pengajuan/:id', renderAdminPengajuanDetail);
  registerRoute('#/dashboard/layanan', renderAdminServices);
  registerRoute('#/dashboard/wa', renderAdminWaTemplate);
  registerRoute('#/dashboard/pengaturan', renderAdminSettings);

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);
}

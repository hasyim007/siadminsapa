/* ============================================================
   adminShell.js — kerangka sidebar + topbar dipakai semua
   view #/dashboard/*. Markup mengikuti gaya mockup asli
   (sidebar bg-sapa, sidebar-link, drawer di mobile).
   ============================================================ */

const ADMIN_MENU = [
  { key: 'ringkasan', label: 'Ringkasan', hash: '#/dashboard', icon: iconDash },
  { key: 'pengajuan', label: 'Manajemen Pengajuan', hash: '#/dashboard/pengajuan', icon: iconInbox },
  { key: 'layanan', label: 'Layanan & Form Builder', hash: '#/dashboard/layanan', icon: iconLayers },
  { key: 'wa', label: 'Template WA', hash: '#/dashboard/wa', icon: iconChat },
  { key: 'pengaturan', label: 'Pengaturan Situs', hash: '#/dashboard/pengaturan', icon: iconSettings },
];

function renderAdminShell(root, activeKey) {
  const session = STATE.session || {};
  root.innerHTML = `
    <div id="sidebarBackdrop"></div>
    <div class="flex min-h-screen bg-bgsoft">
      <aside id="adminSidebar" class="w-64 bg-sapa text-white flex flex-col p-4">
        <div class="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#1769D1,#123B78)">${iconGeneric()}</div>
          <div class="leading-tight">
            <p class="font-extrabold text-sm">SIADMINSAPA</p>
            <p class="text-[11px] text-white/50">Panel Admin</p>
          </div>
        </div>
        <nav class="space-y-1">
          ${ADMIN_MENU.map(m => `
            <a href="${m.hash}" class="sidebar-link ${m.key === activeKey ? 'active' : ''}">${m.icon()} ${m.label}</a>
          `).join('')}
        </nav>
        <div class="mt-auto pt-4 border-t border-white/10">
          <a href="#/" onclick="doLogout(event)" class="sidebar-link">${iconLogout()} Keluar</a>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <header class="sticky top-0 z-40 bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button id="btnOpenSidebar" class="lg:hidden text-slate-500 hover:text-sapa">${iconMenu()}</button>
            <p class="font-extrabold text-sapa text-[15px]">${ADMIN_MENU.find(m => m.key === activeKey)?.label || ''}</p>
          </div>
          <p class="text-sm text-slate-500">Halo, <strong class="text-slate-800">${escapeHtml(session.nama_lengkap || session.username || 'Admin')}</strong></p>
        </header>
        <main class="p-5 max-w-6xl" id="admin-content-slot"></main>
      </div>
    </div>
    <div id="toast" class="toast"></div>
  `;

  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  document.getElementById('btnOpenSidebar').addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
    backdrop.classList.toggle('show');
  });
  backdrop.addEventListener('click', () => { sidebar.classList.remove('sidebar-open'); backdrop.classList.remove('show'); });

  return document.getElementById('admin-content-slot');
}

function doLogout(e) {
  if (e) e.preventDefault();
  setSession(null);
  location.hash = '#/';
}

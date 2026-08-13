/* ============================================================
   views/adminDashboard.js — #/dashboard (ringkasan)
   ============================================================ */
async function renderAdminDashboard(root) {
  const slot = renderAdminShell(root, 'ringkasan');
  slot.innerHTML = `<p class="text-slate-400">Memuat statistik…</p>`;
  const stats = await api.getStats();

  const statusEntries = [
    { key: 'baru', label: 'Baru' },
    { key: 'diproses', label: 'Diproses' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'ditolak', label: 'Ditolak' },
  ];
  const svcEntries = Object.entries(stats.byService);
  const maxSvc = Math.max(1, ...svcEntries.map(([, v]) => v));
  const monthEntries = Object.entries(stats.byMonth).sort();
  const maxMonth = Math.max(1, ...monthEntries.map(([, v]) => v));

  slot.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
      <div class="bg-white rounded-2xl border border-slate-100 p-4"><p class="text-2xl font-extrabold text-sapa">${stats.total}</p><p class="text-[11px] text-slate-500 mt-0.5">Total Pengajuan</p></div>
      <div class="bg-white rounded-2xl border border-slate-100 p-4"><p class="text-2xl font-extrabold text-sapa">${stats.byStatus.baru || 0}</p><p class="text-[11px] text-slate-500 mt-0.5">Menunggu Verifikasi</p></div>
      <div class="bg-white rounded-2xl border border-slate-100 p-4"><p class="text-2xl font-extrabold text-sapa">${stats.byStatus.diproses || 0}</p><p class="text-[11px] text-slate-500 mt-0.5">Sedang Diproses</p></div>
      <div class="bg-white rounded-2xl border border-slate-100 p-4"><p class="text-2xl font-extrabold text-sapa">${stats.byStatus.selesai || 0}</p><p class="text-[11px] text-slate-500 mt-0.5">Selesai</p></div>
    </div>

    <div class="grid lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="font-bold text-sapa text-sm mb-3">Pengajuan per Status</p>
        <div class="flex flex-wrap gap-2">
          ${statusEntries.map(s => `<span class="flex items-center gap-1.5 bg-bgsoft border border-slate-100 rounded-full pl-1 pr-3 py-1 text-xs font-semibold text-slate-700"><span class="status-badge status-${s.key}">${stats.byStatus[s.key] || 0}</span> ${s.label}</span>`).join('')}
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="font-bold text-sapa text-sm mb-3">Pengajuan per Layanan</p>
        ${svcEntries.length ? `<div class="flex items-end gap-2.5" style="height:150px;">
          ${svcEntries.map(([name, val]) => `
            <div class="flex-1 flex flex-col items-center gap-1.5">
              <span class="text-[11px] font-bold text-sapa font-mono">${val}</span>
              <div class="w-full rounded-t-md" style="height:${Math.max(6, (val / maxSvc) * 110)}px;background:linear-gradient(180deg,#1769D1,#123B78);"></div>
              <span class="text-[10px] text-slate-500 text-center">${escapeHtml(name)}</span>
            </div>
          `).join('')}
        </div>` : `<p class="text-center text-slate-400 text-sm py-8">Belum ada data.</p>`}
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-5 mt-5">
      <p class="font-bold text-sapa text-sm mb-3">Pengajuan per Bulan</p>
      ${monthEntries.length ? `<div class="flex items-end gap-2.5" style="height:150px;">
        ${monthEntries.map(([m, val]) => `
          <div class="flex-1 flex flex-col items-center gap-1.5">
            <span class="text-[11px] font-bold text-sapa font-mono">${val}</span>
            <div class="w-full rounded-t-md" style="height:${Math.max(6, (val / maxMonth) * 110)}px;background:linear-gradient(180deg,#1769D1,#123B78);"></div>
            <span class="text-[10px] text-slate-500 font-mono">${m}</span>
          </div>
        `).join('')}
      </div>` : `<p class="text-center text-slate-400 text-sm py-8">Belum ada data bulanan.</p>`}
    </div>

    <div class="flex justify-between items-center mt-5">
      <a href="#/dashboard/pengajuan" class="inline-flex items-center gap-2 bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-5 py-2.5 rounded-xl">${iconInbox()} Lihat Semua Pengajuan</a>
      <button id="btnExportCsv" class="bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold text-sm px-5 py-2.5 rounded-xl">Export CSV</button>
    </div>
  `;

  document.getElementById('btnExportCsv').addEventListener('click', async () => {
    const csv = await api.exportPengajuanCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pengajuan-siadminsapa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ============================================================
   views/adminWaTemplate.js — #/dashboard/wa
   ============================================================ */
async function renderAdminWaTemplate(root) {
  const slot = renderAdminShell(root, 'wa');
  slot.innerHTML = `<p class="text-slate-400">Memuat template…</p>`;
  const templates = await api.getWaTemplates();

  const labels = { baru: 'Status: Baru Diterima', diproses: 'Status: Sedang Diproses', selesai: 'Status: Selesai', ditolak: 'Status: Ditolak' };

  slot.innerHTML = `
    <p class="text-slate-500 text-sm mb-4">Variabel yang bisa dipakai: <code class="bg-bgsoft px-1.5 py-0.5 rounded text-xs">{{nama_pemohon}}</code> <code class="bg-bgsoft px-1.5 py-0.5 rounded text-xs">{{nomor_resi}}</code> <code class="bg-bgsoft px-1.5 py-0.5 rounded text-xs">{{nama_layanan}}</code> <code class="bg-bgsoft px-1.5 py-0.5 rounded text-xs">{{catatan_admin}}</code></p>
    <div class="grid sm:grid-cols-2 gap-5">
      ${templates.map(t => `
        <div class="bg-white border border-slate-100 rounded-2xl p-5">
          <p class="font-bold text-sapa text-sm mb-3">${labels[t.status] || t.status}</p>
          <textarea data-wa="${t.status}" class="field-input" rows="4">${escapeHtml(t.template_pesan)}</textarea>
          <button data-save="${t.status}" class="mt-3 bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold text-xs px-4 py-2 rounded-lg">Simpan</button>
        </div>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('[data-save]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.save;
      const val = document.querySelector(`[data-wa="${status}"]`).value;
      await api.saveWaTemplate(status, val);
      toast('Template WA disimpan.');
    });
  });
}

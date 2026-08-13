/* ============================================================
   views/adminPengajuan.js — #/dashboard/pengajuan (+ /:id)
   ============================================================ */

let _apCurrentStatus = 'semua';
let _apCurrentService = 'semua';
let _apServices = [];

async function renderAdminPengajuanList(root) {
  const slot = renderAdminShell(root, 'pengajuan');
  slot.innerHTML = `<p class="text-slate-400">Memuat pengajuan…</p>`;

  _apServices = await api.adminGetServices();
  await drawPengajuanTable(slot);
}

async function drawPengajuanTable(slot) {
  const list = await api.adminListPengajuan({ status: _apCurrentStatus, serviceId: _apCurrentService });

  const statusTabs = [
    { key: 'semua', label: 'Semua' },
    { key: 'baru', label: 'Baru' },
    { key: 'diproses', label: 'Diproses' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'ditolak', label: 'Ditolak' },
  ];

  slot.innerHTML = `
    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
      <div class="flex flex-wrap gap-2" id="statusTabs">
        ${statusTabs.map(t => `<div class="admin-tab ${t.key === _apCurrentStatus ? 'active' : ''}" data-status="${t.key}">${t.label}</div>`).join('')}
      </div>
      <select id="serviceFilter" class="field-input" style="width:auto;">
        <option value="semua">Semua Layanan</option>
        ${_apServices.map(s => `<option value="${s.id}" ${String(_apCurrentService) === String(s.id) ? 'selected' : ''}>${escapeHtml(s.nama)}</option>`).join('')}
      </select>
    </div>

    <div class="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-bgsoft">
            <th class="px-4 py-3 font-bold">Resi</th><th class="px-4 py-3 font-bold">Layanan</th><th class="px-4 py-3 font-bold">No. WA</th><th class="px-4 py-3 font-bold">Tanggal</th><th class="px-4 py-3 font-bold">Status</th><th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          ${list.map(p => `
            <tr onclick="location.hash='#/dashboard/pengajuan/${p.id}'" class="border-t border-slate-100 hover:bg-bgsoft cursor-pointer">
              <td class="px-4 py-3 font-mono font-bold text-sapa">${escapeHtml(p.nomor_resi)}</td>
              <td class="px-4 py-3">${escapeHtml(p.service ? p.service.nama : '-')}</td>
              <td class="px-4 py-3 font-mono text-slate-500">${escapeHtml(p.no_wa_pemohon || '-')}</td>
              <td class="px-4 py-3 font-mono text-slate-500">${fmtDate(p.created_at)}</td>
              <td class="px-4 py-3"><span class="status-badge status-${p.status}">${statusLabel(p.status)}</span></td>
              <td class="px-4 py-3 text-right text-siadmin font-semibold text-xs">Detail →</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${list.length === 0 ? `<p class="text-center text-slate-400 text-sm py-10">Belum ada pengajuan pada kategori ini.</p>` : ''}
    </div>
  `;

  document.querySelectorAll('#statusTabs .admin-tab').forEach(el => {
    el.addEventListener('click', () => { _apCurrentStatus = el.dataset.status; drawPengajuanTable(slot); });
  });
  document.getElementById('serviceFilter').addEventListener('change', (e) => {
    _apCurrentService = e.target.value; drawPengajuanTable(slot);
  });
}

/* ---------- Detail ---------- */
async function renderAdminPengajuanDetail(root, params) {
  const slot = renderAdminShell(root, 'pengajuan');
  slot.innerHTML = `<p class="text-slate-400">Memuat detail…</p>`;

  const id = Number(params.id);
  const p = await api.adminGetPengajuanDetail(id);
  if (!p) { slot.innerHTML = `<p class="text-center text-slate-400 text-sm py-10">Pengajuan tidak ditemukan.</p>`; return; }

  const dataForm = JSON.parse(p.data_form || '{}');
  const svc = p.service;
  const publicFiles = p.files.filter(f => f.uploaded_by === 'publik');
  const adminFiles = p.files.filter(f => f.uploaded_by === 'admin');
  const waTemplates = await api.getWaTemplates();

  slot.innerHTML = `
    <a href="#/dashboard/pengajuan" class="flex items-center gap-1.5 text-slate-500 hover:text-sapa text-sm font-medium mb-4">${iconBack()} Kembali ke daftar</a>

    <div class="grid lg:grid-cols-2 gap-5">
      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <div class="flex items-center justify-between">
          <p class="font-mono font-extrabold text-sapa text-lg">${escapeHtml(p.nomor_resi)}</p>
          <span class="status-badge status-${p.status}">${statusLabel(p.status)}</span>
        </div>
        <p class="text-slate-500 text-sm mt-1.5">${escapeHtml(svc ? svc.nama : '-')} · diajukan ${fmtDate(p.created_at)}</p>

        <div class="grid grid-cols-2 gap-3 mt-5">
          ${Object.entries(dataForm).map(([k, v]) => `
            <div><p class="text-[11px] text-slate-400">${escapeHtml(k)}</p><p class="text-sm font-semibold text-slate-800">${escapeHtml(v)}</p></div>
          `).join('')}
          <div><p class="text-[11px] text-slate-400">No. WA Pemohon</p><p class="text-sm font-semibold text-slate-800 font-mono">${escapeHtml(p.no_wa_pemohon || '-')}</p></div>
        </div>

        ${publicFiles.length ? `<div class="mt-5">
          <p class="text-[11px] text-slate-400 mb-1.5">Lampiran Pemohon</p>
          ${publicFiles.map(f => `<a href="${f.drive_view_link}" download="${escapeHtml(f.nama_file)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-siadmin text-xs font-semibold hover:underline mr-3">${iconDownload()} ${escapeHtml(f.nama_file)}</a>`).join('')}
        </div>` : ''}
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <p class="font-bold text-sapa text-sm mb-3">Ubah Status & Catatan</p>
        <div class="mb-3">
          <label class="field-label">Status</label>
          <select id="statusSelect" class="field-input">
            ${['baru', 'diproses', 'selesai', 'ditolak'].map(s => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
          </select>
        </div>
        <div class="mb-3">
          <label class="field-label">Catatan Admin</label>
          <textarea id="catatanAdmin" class="field-input" rows="3">${escapeHtml(p.catatan_admin || '')}</textarea>
        </div>
        <button id="btnSaveStatus" class="w-full bg-siadmin hover:bg-sapa transition text-white font-semibold py-3 rounded-xl">Simpan Perubahan</button>

        <div class="mt-5">
          <label class="field-label">Upload File Feedback untuk Pemohon</label>
          <input type="file" id="feedbackFile" class="field-input">
        </div>
        <button id="btnUploadFeedback" class="w-full mt-2 bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold py-2.5 rounded-xl">Upload Feedback</button>
        ${adminFiles.length ? `<div class="mt-3">
          ${adminFiles.map(f => `<a href="${f.drive_view_link}" download="${escapeHtml(f.nama_file)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-siadmin text-xs font-semibold hover:underline mr-3">${iconDownload()} ${escapeHtml(f.nama_file)}</a>`).join('')}
        </div>` : ''}

        <div class="flex gap-2 mt-5">
          <button id="btnKirimWa" class="flex-1 bg-success hover:opacity-90 transition text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2">${iconWa()} Kirim WA</button>
          ${svc && svc.perlu_cetak_pdf ? `<button id="btnCetakPdf" class="flex-1 bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2">${iconPrint()} Cetak PDF</button>` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnSaveStatus').addEventListener('click', async () => {
    const status = document.getElementById('statusSelect').value;
    const catatan = document.getElementById('catatanAdmin').value.trim();
    await api.updatePengajuanStatus(id, { status, catatan_admin: catatan });
    toast('Perubahan disimpan.');
    renderAdminPengajuanDetail(root, params);
  });

  document.getElementById('btnUploadFeedback').addEventListener('click', async () => {
    const input = document.getElementById('feedbackFile');
    const file = input.files && input.files[0];
    if (!file) { toast('Pilih file terlebih dahulu.'); return; }
    const dataUrl = await fileToDataUrl(file);
    await api.uploadAdminFeedbackFile(id, { nama_file: file.name, tipe_file: file.type, ukuran_kb: Math.round(file.size / 1024), dataUrl });
    toast('File feedback diunggah.');
    renderAdminPengajuanDetail(root, params);
  });

  document.getElementById('btnKirimWa').addEventListener('click', () => {
    const status = document.getElementById('statusSelect').value;
    const tpl = waTemplates.find(t => t.status === status);
    let msg = tpl ? tpl.template_pesan : 'Halo {{nama_pemohon}}, status pengajuan Anda: {{nama_layanan}} - {{nomor_resi}} kini {{status}}.';
    const nama = dataForm.nama || dataForm.nama_pemohon || 'Bapak/Ibu';
    msg = msg
      .replace(/{{nama_pemohon}}/g, nama)
      .replace(/{{nomor_resi}}/g, p.nomor_resi)
      .replace(/{{nama_layanan}}/g, svc ? svc.nama : '-')
      .replace(/{{catatan_admin}}/g, document.getElementById('catatanAdmin').value.trim() || '-')
      .replace(/{{status}}/g, statusLabel(status));
    const nomor = (p.no_wa_pemohon || '').replace(/^0/, '62').replace(/\D/g, '');
    if (!nomor) { toast('Nomor WA pemohon tidak tersedia.'); return; }
    window.open(`https://wa.me/${nomor}?text=${encodeURIComponent(msg)}`, '_blank');
  });

  const btnCetak = document.getElementById('btnCetakPdf');
  if (btnCetak) {
    btnCetak.addEventListener('click', async () => {
      const templates = await api.getPdfTemplates();
      const tpl = templates.find(t => t.service_id === svc.id);
      if (!tpl) { toast('Template PDF untuk layanan ini belum diatur.'); return; }
      let html = tpl.konten_html;
      Object.entries(dataForm).forEach(([k, v]) => { html = html.replace(new RegExp(`{{${k}}}`, 'g'), escapeHtml(v)); });
      openPrintWindow(tpl.nama_template, html);
    });
  }
}

function openPrintWindow(title, bodyHtml) {
  const w = window.open('', '_blank');
  w.document.write(`
    <html><head><title>${title}</title>
    <style>
      body{font-family:'Times New Roman',serif;padding:50px;color:#123B78;}
      .kop{text-align:center;border-bottom:3px double #123B78;padding-bottom:16px;margin-bottom:26px;}
      .kop h1{font-size:18px;margin:0;}
      .kop p{font-size:12px;margin:2px 0;}
      .content{font-size:14px;line-height:1.8;}
    </style></head>
    <body>
      <div class="kop">
        <h1>SDN 01 PAPAHAN</h1>
        <p>Papahan, Tasikmadu, Karanganyar, Jawa Tengah</p>
      </div>
      <div class="content">${bodyHtml}</div>
      <script>window.print();<\/script>
    </body></html>
  `);
  w.document.close();
}

/* ============================================================
   views/publicHome.js — landing page publik (#/)
   Markup & class Tailwind mengikuti mockup asli.
   ============================================================ */

let _publicServices = [];

async function renderPublicHome(root) {
  root.innerHTML = `<div style="padding:100px 0;text-align:center;" class="text-slate-400">Memuat…</div>`;

  const [settings, services, stats] = await Promise.all([
    api.getSiteSettings(),
    api.getServices({ onlyActive: true }),
    api.getStats(),
  ]);
  _publicServices = services;

  root.innerHTML = `
  <header class="sticky top-0 z-50">
    <div class="glass shadow-glass">
      <nav class="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <a href="#/" class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#123B78,#1769D1)">
            ${iconGeneric()}
          </div>
          <div class="leading-tight">
            <p class="font-extrabold text-sapa text-lg tracking-tight">SIADMINSAPA</p>
            <p class="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">Sistem Administrasi SDN 01 Papahan</p>
          </div>
        </a>
        <div class="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#layanan" class="hover:text-siadmin transition">Layanan</a>
          <a href="#cek-status" class="hover:text-siadmin transition">Cek Status</a>
          <a href="#tentang" class="hover:text-siadmin transition">Kontak</a>
        </div>
        <a href="#/login" class="flex items-center gap-1.5 bg-sapa hover:bg-siadmin transition text-white text-sm font-semibold px-4 py-2 rounded-full">
          ${iconUser()}
          <span class="hidden sm:inline">Login Admin</span>
        </a>
      </nav>
    </div>
  </header>

  <section id="beranda" class="hero-bg pt-16 pb-20 px-5">
    <div class="max-w-6xl mx-auto">
      <div class="glass rounded-3xl shadow-glass px-6 py-12 sm:px-14 sm:py-16 text-center">
        <span class="inline-block bg-siadmin/10 text-siadmin text-xs font-bold tracking-wide uppercase px-4 py-1.5 rounded-full mb-5">
          Layanan Administrasi Digital Sekolah
        </span>
        <h1 class="text-3xl sm:text-5xl font-extrabold text-sapa leading-tight max-w-3xl mx-auto">
          ${escapeHtml(settings.hero_title || 'Urus Administrasi Sekolah, Tanpa Antre.')}
        </h1>
        <p class="text-slate-600 mt-5 max-w-xl mx-auto text-base sm:text-lg">
          ${escapeHtml(settings.hero_subtitle || '')}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center mt-9">
          <a href="#layanan" class="bg-siadmin hover:bg-sapa transition text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-siadmin/30 flex items-center justify-center gap-2">
            ${iconSend()} Ajukan Layanan
          </a>
          <a href="#cek-status" class="bg-white/70 hover:bg-white transition text-sapa font-semibold px-7 py-3.5 rounded-xl border border-sapa/15 flex items-center justify-center gap-2">
            ${iconSearch(18, 'currentColor')} Cek Status Pengajuan
          </a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
          <div class="bg-white/70 rounded-2xl p-4"><p class="text-2xl font-extrabold text-sapa">${stats.total}</p><p class="text-[11px] text-slate-500 mt-1">Pengajuan Terlayani</p></div>
          <div class="bg-white/70 rounded-2xl p-4"><p class="text-2xl font-extrabold text-sapa">${stats.servicesActive}</p><p class="text-[11px] text-slate-500 mt-1">Layanan Aktif</p></div>
          <div class="bg-white/70 rounded-2xl p-4"><p class="text-2xl font-extrabold text-sapa">${stats.byStatus.selesai || 0}</p><p class="text-[11px] text-slate-500 mt-1">Selesai Diproses</p></div>
          <div class="bg-white/70 rounded-2xl p-4"><p class="text-2xl font-extrabold text-sapa">&lt;1×24</p><p class="text-[11px] text-slate-500 mt-1">Jam Rata-rata Respon</p></div>
        </div>
      </div>
    </div>
  </section>

  <section id="layanan" class="max-w-6xl mx-auto px-5 py-16">
    <div class="text-center max-w-xl mx-auto mb-12">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-sapa">Pilih Layanan yang Kamu Butuhkan</h2>
      <p class="text-slate-500 mt-2.5">Setiap layanan bisa diajukan online atau lihat dulu syarat & prosedurnya.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${services.map(renderServiceCard).join('') || `<p class="text-slate-400 col-span-full text-center">Belum ada layanan aktif.</p>`}
    </div>
  </section>

  <section id="cek-status" class="px-5 py-16">
    <div class="max-w-2xl mx-auto glass-dark rounded-3xl shadow-glass px-6 py-12 sm:px-12 text-center">
      ${iconSearch(34, 'white')}
      <h2 class="text-2xl font-extrabold text-white mt-3">Cek Status Pengajuan</h2>
      <p class="text-white/75 mt-2 text-sm">Masukkan nomor resi yang kamu terima saat pertama kali mengajukan.</p>
      <form id="cekStatusForm" class="mt-7 flex flex-col sm:flex-row gap-3">
        <input id="cekResiInput" type="text" placeholder="Contoh: SAPA-2026-000001" required
          class="flex-1 rounded-xl px-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 bg-white/90 focus:outline-none focus:ring-2 focus:ring-siadmin">
        <button type="submit" class="bg-white text-sapa font-semibold px-6 py-3.5 rounded-xl hover:bg-white/90 transition">Cek Status</button>
      </form>
      <div id="cekStatusResult"></div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto px-5 py-12">
    <div class="grid sm:grid-cols-3 gap-5 text-center">
      <div class="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
        <div class="w-12 h-12 rounded-xl bg-siadmin/10 text-siadmin flex items-center justify-center mx-auto">${iconBolt()}</div>
        <h3 class="font-bold text-slate-800 mt-4">Proses Cepat</h3>
        <p class="text-sm text-slate-500 mt-1.5">Isi form pengajuan hanya butuh beberapa menit.</p>
      </div>
      <div class="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
        <div class="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mx-auto">${iconWa()}</div>
        <h3 class="font-bold text-slate-800 mt-4">Notifikasi WA</h3>
        <p class="text-sm text-slate-500 mt-1.5">Admin mengabari perkembangan pengajuanmu lewat WhatsApp.</p>
      </div>
      <div class="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
        <div class="w-12 h-12 rounded-xl bg-sapa/10 text-sapa flex items-center justify-center mx-auto">${iconShield()}</div>
        <h3 class="font-bold text-slate-800 mt-4">Aman & Terverifikasi</h3>
        <p class="text-sm text-slate-500 mt-1.5">Setiap pengajuan diverifikasi langsung oleh admin sekolah.</p>
      </div>
    </div>
  </section>

  <footer id="tentang" class="bg-sapa mt-10">
    <div class="max-w-6xl mx-auto px-5 py-10 text-center">
      <p class="text-white font-extrabold text-lg">SIADMINSAPA</p>
      <p class="text-white/70 text-sm mt-1">${escapeHtml(settings.alamat || '')}</p>
      <p class="text-white/70 text-sm">${escapeHtml(settings.jam_layanan || '')} · WA ${escapeHtml(settings.no_wa_sekolah || '')}</p>
      <p class="text-white/50 text-xs mt-5">© ${new Date().getFullYear()} SDN 01 Papahan. Seluruh hak cipta dilindungi.</p>
    </div>
  </footer>

  <div id="modalPengajuan" class="modal-backdrop">
    <div class="modal-box">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 id="modalPengajuanTitle" class="font-extrabold text-sapa text-lg">Ajukan Layanan</h3>
        <button onclick="closeModal('modalPengajuan')" class="text-slate-400 hover:text-slate-700">${iconClose()}</button>
      </div>
      <form id="formPengajuan" class="px-6 py-6 space-y-4"></form>
    </div>
  </div>

  <div id="modalResi" class="modal-backdrop">
    <div class="modal-box text-center px-7 py-9">
      <div class="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-4">${iconCheck('#16A34A')}</div>
      <h3 class="font-extrabold text-sapa text-lg">Pengajuan Berhasil Dikirim</h3>
      <p class="text-slate-500 text-sm mt-2">Simpan nomor resi ini untuk mengecek status pengajuanmu.</p>
      <p id="resiNumber" class="font-mono font-extrabold text-2xl text-siadmin bg-siadmin/10 rounded-xl py-3 mt-5"></p>
      <button onclick="closeModal('modalResi')" class="w-full mt-5 bg-sapa hover:bg-siadmin transition text-white font-semibold py-3 rounded-xl">Selesai</button>
    </div>
  </div>

  <div id="toast" class="toast"></div>
  `;

  document.getElementById('cekStatusForm').addEventListener('submit', handleCekStatus);
}

function renderServiceCard(svc) {
  return `
    <div class="glass card-hover rounded-2xl p-6 shadow-glass">
      <div class="service-icon" style="background:linear-gradient(135deg, ${svc.warna_tema || '#123B78'}, #1769D1)">${iconGeneric()}</div>
      <h3 class="font-bold text-lg text-slate-800 mt-4">${escapeHtml(svc.nama)}</h3>
      <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">${escapeHtml(svc.deskripsi || '')}</p>
      <button onclick="openPengajuanModal(${svc.id})" class="inline-flex items-center gap-1.5 text-siadmin font-semibold text-sm mt-4 hover:gap-2.5 transition-all">Ajukan Sekarang <span>→</span></button>
    </div>
  `;
}

/* ---------- Modal: form pengajuan dinamis ---------- */
function openPengajuanModal(serviceId) {
  const svc = _publicServices.find(s => s.id === serviceId);
  if (!svc) return;
  document.getElementById('modalPengajuanTitle').textContent = 'Ajukan ' + svc.nama;
  const form = document.getElementById('formPengajuan');
  form.innerHTML = svc.fields.map(renderDynamicField).join('') +
    `<button type="submit" class="w-full bg-siadmin hover:bg-sapa transition text-white font-semibold py-3.5 rounded-xl">Kirim Pengajuan</button>`;
  form.dataset.serviceId = serviceId;
  form.onsubmit = handleSubmitPengajuan;
  openModal('modalPengajuan');
}

function renderDynamicField(f) {
  const req = f.wajib ? 'required' : '';
  let input = '';
  if (f.tipe === 'select') {
    const opts = JSON.parse(f.opsi_select || '[]');
    input = `<select id="pf_${f.field_key}" class="field-input" ${req}><option value="">Pilih…</option>${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}</select>`;
  } else if (f.tipe === 'textarea') {
    input = `<textarea id="pf_${f.field_key}" class="field-input" rows="3" placeholder="${escapeHtml(f.placeholder || '')}" ${req}></textarea>`;
  } else if (f.tipe === 'file') {
    input = `<input id="pf_${f.field_key}" type="file" class="field-input" accept="${(f.file_allowed_types || '').split(',').map(t => '.' + t).join(',')}" ${req}>`;
  } else {
    input = `<input id="pf_${f.field_key}" type="${f.tipe === 'tel' ? 'tel' : f.tipe}" class="field-input" placeholder="${escapeHtml(f.placeholder || '')}" ${req}>`;
  }
  return `<div>
    <label class="field-label">${escapeHtml(f.label)}${f.wajib ? ' *' : ''}</label>
    ${input}
    ${f.helper_text ? `<p class="text-[11px] text-slate-400 mt-1">${escapeHtml(f.helper_text)}</p>` : ''}
  </div>`;
}

async function handleSubmitPengajuan(e) {
  e.preventDefault();
  const form = e.target;
  const serviceId = Number(form.dataset.serviceId);
  const svc = _publicServices.find(s => s.id === serviceId);
  const dataForm = {};
  const files = [];
  let noWa = '';

  for (const f of svc.fields) {
    const el = document.getElementById('pf_' + f.field_key);
    if (f.tipe === 'file') {
      const file = el.files && el.files[0];
      if (file) {
        if (f.file_max_size_mb && file.size > f.file_max_size_mb * 1024 * 1024) {
          toast(`Ukuran file "${f.label}" maksimal ${f.file_max_size_mb}MB.`);
          return;
        }
        const dataUrl = await fileToDataUrl(file);
        files.push({ field_key: f.field_key, nama_file: file.name, tipe_file: file.type, ukuran_kb: Math.round(file.size / 1024), dataUrl });
        dataForm[f.field_key] = file.name;
      }
    } else {
      dataForm[f.field_key] = el.value.trim();
      if (f.field_key === 'no_wa') noWa = el.value.trim();
    }
  }

  const res = await api.submitPengajuan({ serviceId, dataForm, noWaPemohon: noWa, files });
  closeModal('modalPengajuan');
  document.getElementById('resiNumber').textContent = res.nomor_resi;
  openModal('modalResi');
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/* ---------- Cek status ---------- */
async function handleCekStatus(e) {
  e.preventDefault();
  const resi = document.getElementById('cekResiInput').value;
  const resultEl = document.getElementById('cekStatusResult');
  resultEl.innerHTML = `<div class="mt-6 text-left bg-white/95 rounded-2xl p-5 text-sm text-slate-500">Mencari…</div>`;
  const data = await api.checkStatus(resi);
  if (!data) {
    resultEl.innerHTML = `<div class="mt-6 text-left bg-white/95 rounded-2xl p-5"><p class="text-error text-sm font-semibold">Nomor resi tidak ditemukan. Periksa kembali penulisannya.</p></div>`;
    return;
  }
  resultEl.innerHTML = `
    <div class="mt-6 text-left bg-white/95 rounded-2xl p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="font-mono font-bold text-sapa">${escapeHtml(data.nomor_resi)}</p>
        <span class="status-badge status-${data.status}">${statusLabel(data.status)}</span>
      </div>
      <p class="text-sm text-slate-600">${escapeHtml(data.service ? data.service.nama : '-')}</p>
      <p class="text-xs text-slate-400 mt-1">Diajukan: ${fmtDate(data.created_at)}</p>
      <div class="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
        ${data.logs.map(l => `
          <div>
            <p class="text-xs font-bold text-slate-700">${statusLabel(l.status)}</p>
            <p class="text-[11px] text-slate-400 font-mono">${fmtDate(l.created_at)}</p>
            ${l.catatan ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(l.catatan)}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ${data.files.filter(f => f.uploaded_by === 'admin').map(f => `
        <a href="${f.drive_view_link}" download="${escapeHtml(f.nama_file)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-siadmin font-semibold text-xs mt-3 hover:underline">
          ${iconDownload()} Lampiran: ${escapeHtml(f.nama_file)}
        </a>
      `).join('')}
    </div>
  `;
}

function statusLabel(s) {
  return { baru: 'Baru Diterima', diproses: 'Sedang Diproses', selesai: 'Selesai', ditolak: 'Ditolak' }[s] || s;
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }

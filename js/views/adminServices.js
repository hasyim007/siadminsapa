/* ============================================================
   views/adminServices.js — #/dashboard/layanan
   CRUD layanan + form builder (field dinamis per layanan)
   ============================================================ */

let _svcEditingFields = [];

async function renderAdminServices(root) {
  const slot = renderAdminShell(root, 'layanan');
  slot.innerHTML = `<p class="text-slate-400">Memuat layanan…</p>`;
  await drawServicesList(slot);
}

async function drawServicesList(slot) {
  const services = await api.adminGetServices();

  slot.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <p class="text-slate-500 text-sm">${services.length} layanan terdaftar</p>
      <button id="btnNewService" class="inline-flex items-center gap-1.5 bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-4 py-2 rounded-xl">${iconPlus()} Layanan Baru</button>
    </div>
    <div class="space-y-3" id="serviceList">
      ${services.map(s => `
        <div class="bg-white border border-slate-100 rounded-2xl p-4" data-svc="${s.id}">
          <div class="flex flex-wrap gap-3 justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="service-icon" style="width:38px;height:38px;background:linear-gradient(135deg,${s.warna_tema},#123B78);">${iconGeneric()}</div>
              <div>
                <p class="font-bold text-sm text-slate-800">${escapeHtml(s.nama)}</p>
                <p class="text-[11px] text-slate-400 font-mono">/${escapeHtml(s.slug)} · ${s.fields.length} field${s.perlu_cetak_pdf ? ' · cetak PDF' : ''}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="status-badge ${s.aktif ? 'status-selesai' : 'status-ditolak'}">${s.aktif ? 'Aktif' : 'Nonaktif'}</span>
              <button data-edit="${s.id}" class="bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold text-xs px-3 py-1.5 rounded-lg">Edit</button>
              <button data-del="${s.id}" class="bg-error/10 hover:bg-error/20 transition text-error px-2.5 py-1.5 rounded-lg">${iconTrash()}</button>
            </div>
          </div>
        </div>
      `).join('') || `<p class="text-center text-slate-400 text-sm py-10">Belum ada layanan.</p>`}
    </div>

    <div id="serviceEditor" class="bg-white border border-slate-100 rounded-2xl p-5 mt-5 hidden"></div>
  `;

  document.getElementById('btnNewService').addEventListener('click', () => openServiceEditor(slot, null));
  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openServiceEditor(slot, Number(btn.dataset.edit), services)));
  document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus layanan ini beserta seluruh field formnya?')) return;
    await api.deleteService(Number(btn.dataset.del));
    toast('Layanan dihapus.');
    drawServicesList(slot);
  }));
}

function openServiceEditor(slot, id, cachedServices) {
  const editor = document.getElementById('serviceEditor');
  editor.classList.remove('hidden');
  editor.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const svc = id ? (cachedServices || []).find(s => s.id === id) : null;
  _svcEditingFields = svc ? JSON.parse(JSON.stringify(svc.fields)) : [];

  editor.innerHTML = `
    <p class="font-bold text-sapa text-sm mb-4">${svc ? 'Edit Layanan: ' + escapeHtml(svc.nama) : 'Layanan Baru'}</p>
    <div class="grid sm:grid-cols-2 gap-4">
      <div><label class="field-label">Nama Layanan</label><input id="svcNama" class="field-input" value="${escapeHtml(svc?.nama || '')}"></div>
      <div><label class="field-label">Slug (URL-friendly)</label><input id="svcSlug" class="field-input" value="${escapeHtml(svc?.slug || '')}" placeholder="mis. legalisir-ijazah"></div>
    </div>
    <div class="mt-4"><label class="field-label">Deskripsi</label><textarea id="svcDeskripsi" class="field-input" rows="2">${escapeHtml(svc?.deskripsi || '')}</textarea></div>
    <div class="grid sm:grid-cols-2 gap-4 mt-4">
      <div><label class="field-label">Warna Tema</label><input id="svcWarna" type="color" class="field-input" style="height:44px;padding:4px;" value="${svc?.warna_tema || '#123B78'}"></div>
      <div>
        <label class="field-label">Status</label>
        <select id="svcAktif" class="field-input"><option value="1" ${!svc || svc.aktif ? 'selected' : ''}>Aktif</option><option value="0" ${svc && !svc.aktif ? 'selected' : ''}>Nonaktif</option></select>
      </div>
    </div>
    <div class="mt-4">
      <label class="text-sm text-slate-700 flex items-center gap-2"><input type="checkbox" id="svcPerluPdf" ${svc?.perlu_cetak_pdf ? 'checked' : ''}> Layanan ini butuh cetak surat PDF berkop sekolah</label>
    </div>

    <div class="flex justify-between items-center mt-6">
      <p class="font-bold text-sapa text-sm">Form Builder — Field Pengajuan</p>
      <button id="btnAddField" class="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold text-xs px-3 py-1.5 rounded-lg">${iconPlus()} Tambah Field</button>
    </div>
    <div id="fieldBuilderList" class="mt-3"></div>

    <div class="flex gap-2 mt-5">
      <button id="btnSaveService" class="bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-5 py-2.5 rounded-xl">Simpan Layanan</button>
      <button id="btnCancelEdit" class="bg-white border border-slate-200 hover:bg-bgsoft transition text-sapa font-semibold text-sm px-5 py-2.5 rounded-xl">Batal</button>
    </div>
  `;

  drawFieldBuilder();

  document.getElementById('btnAddField').addEventListener('click', () => {
    _svcEditingFields.push({ label: '', field_key: '', tipe: 'text', placeholder: '', opsi_select: null, wajib: 1, helper_text: '', file_max_size_mb: 3, file_allowed_types: 'pdf,jpg,png' });
    drawFieldBuilder();
  });
  document.getElementById('btnCancelEdit').addEventListener('click', () => editor.classList.add('hidden'));
  document.getElementById('btnSaveService').addEventListener('click', () => saveServiceEditor(slot, svc));
}

function drawFieldBuilder() {
  const wrap = document.getElementById('fieldBuilderList');
  if (_svcEditingFields.length === 0) {
    wrap.innerHTML = `<p class="text-center text-slate-400 text-sm py-6">Belum ada field. Klik "Tambah Field".</p>`;
    return;
  }
  wrap.innerHTML = _svcEditingFields.map((f, i) => `
    <div class="flex gap-2.5 items-end p-3.5 border border-slate-100 rounded-xl mb-2.5 bg-bgsoft">
      <span class="text-slate-400 pb-2.5">⠿</span>
      <div class="flex-1"><label class="field-label">Label</label><input data-fb="${i}:label" class="field-input" value="${escapeHtml(f.label)}" placeholder="mis. Nama Lengkap"></div>
      <div class="flex-1"><label class="field-label">Key</label><input data-fb="${i}:field_key" class="field-input" value="${escapeHtml(f.field_key)}" placeholder="nama_lengkap"></div>
      <div style="max-width:130px;">
        <label class="field-label">Tipe</label>
        <select data-fb="${i}:tipe" class="field-input">
          ${['text', 'number', 'date', 'tel', 'select', 'textarea', 'file'].map(t => `<option value="${t}" ${f.tipe === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div style="max-width:90px;">
        <label class="field-label">Wajib</label>
        <select data-fb="${i}:wajib" class="field-input"><option value="1" ${f.wajib ? 'selected' : ''}>Ya</option><option value="0" ${!f.wajib ? 'selected' : ''}>Tidak</option></select>
      </div>
      <button data-rmfield="${i}" class="bg-error/10 hover:bg-error/20 transition text-error px-2.5 py-2 rounded-lg">${iconTrash()}</button>
    </div>
    ${f.tipe === 'select' ? `<div class="mb-2.5 -mt-1 ml-6"><label class="field-label">Opsi (pisahkan koma)</label><input data-fb="${i}:opsi_select" class="field-input" value="${escapeHtml((JSON.parse(f.opsi_select || '[]')).join(', '))}" placeholder="I, II, III"></div>` : ''}
  `).join('');

  wrap.querySelectorAll('[data-fb]').forEach(el => {
    el.addEventListener('change', () => {
      const [idx, key] = el.dataset.fb.split(':');
      let val = el.value;
      if (key === 'wajib') val = Number(val);
      if (key === 'opsi_select') val = JSON.stringify(val.split(',').map(s => s.trim()).filter(Boolean));
      _svcEditingFields[Number(idx)][key] = val;
      if (key === 'tipe') drawFieldBuilder();
    });
  });
  wrap.querySelectorAll('[data-rmfield]').forEach(btn => {
    btn.addEventListener('click', () => { _svcEditingFields.splice(Number(btn.dataset.rmfield), 1); drawFieldBuilder(); });
  });
}

async function saveServiceEditor(slot, existingSvc) {
  const payload = {
    nama: document.getElementById('svcNama').value.trim(),
    slug: document.getElementById('svcSlug').value.trim() || document.getElementById('svcNama').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    deskripsi: document.getElementById('svcDeskripsi').value.trim(),
    warna_tema: document.getElementById('svcWarna').value,
    aktif: Number(document.getElementById('svcAktif').value),
    perlu_cetak_pdf: document.getElementById('svcPerluPdf').checked ? 1 : 0,
  };
  if (!payload.nama) { toast('Nama layanan wajib diisi.'); return; }

  let serviceId = existingSvc?.id;
  if (existingSvc) {
    await api.updateService(existingSvc.id, payload);
  } else {
    const created = await api.createService(payload);
    serviceId = created.id;
  }
  await api.saveFormFields(serviceId, _svcEditingFields);
  toast('Layanan disimpan.');
  document.getElementById('serviceEditor').classList.add('hidden');
  drawServicesList(slot);
}

/* ============================================================
   views/adminSettings.js — #/dashboard/pengaturan
   ============================================================ */
async function renderAdminSettings(root) {
  const slot = renderAdminShell(root, 'pengaturan');
  slot.innerHTML = `<p class="text-slate-400">Memuat pengaturan…</p>`;
  const s = await api.getSiteSettings();

  slot.innerHTML = `
    <div class="grid lg:grid-cols-2 gap-5">
      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <p class="font-bold text-sapa text-sm mb-3">Konten Landing Page</p>
        <div class="mb-3"><label class="field-label">Judul Hero</label><input id="setHeroTitle" class="field-input" value="${escapeHtml(s.hero_title || '')}"></div>
        <div class="mb-3"><label class="field-label">Subjudul Hero</label><textarea id="setHeroSubtitle" class="field-input" rows="2">${escapeHtml(s.hero_subtitle || '')}</textarea></div>
        <div class="mb-3"><label class="field-label">URL Logo</label><input id="setLogoUrl" class="field-input" value="${escapeHtml(s.logo_url || '')}" placeholder="https://..."></div>
        <button id="btnSaveContent" class="bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-4 py-2 rounded-xl">Simpan Konten</button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <p class="font-bold text-sapa text-sm mb-3">Kontak & Jam Layanan</p>
        <div class="mb-3"><label class="field-label">Alamat</label><input id="setAlamat" class="field-input" value="${escapeHtml(s.alamat || '')}"></div>
        <div class="mb-3"><label class="field-label">No. WhatsApp Sekolah</label><input id="setNoWa" class="field-input" value="${escapeHtml(s.no_wa_sekolah || '')}" placeholder="62xxxxxxxxxx"></div>
        <div class="mb-3"><label class="field-label">Jam Layanan</label><input id="setJamLayanan" class="field-input" value="${escapeHtml(s.jam_layanan || '')}"></div>
        <div class="mb-3"><label class="field-label">Nama Kepala Sekolah</label><input id="setNamaKepsek" class="field-input" value="${escapeHtml(s.nama_kepsek || '')}"></div>
        <button id="btnSaveContact" class="bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-4 py-2 rounded-xl">Simpan Kontak</button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <p class="font-bold text-sapa text-sm mb-3">Penyimpanan File (Google Drive)</p>
        <div class="mb-2"><label class="field-label">ID Folder Google Drive Tujuan</label><input id="setDriveFolder" class="field-input" value="${escapeHtml(s.gdrive_folder_id || '')}" placeholder="1AbCdEfGh..."></div>
        <p class="text-[11px] text-slate-400 mb-3">Folder ini harus di-share ke email Service Account (Editor) — panduan setup GCP menyusul terpisah.</p>
        <button id="btnSaveDrive" class="bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-4 py-2 rounded-xl">Simpan</button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5">
        <p class="font-bold text-sapa text-sm mb-3">Akun Admin</p>
        <div class="mb-3"><label class="field-label">Username</label><input id="setAdminUsername" class="field-input" value="${escapeHtml(STATE.session?.username || '')}"></div>
        <div class="mb-3"><label class="field-label">Password Baru (kosongkan jika tidak ganti)</label><input id="setAdminPassword" type="password" class="field-input" placeholder="••••••••"></div>
        <button id="btnSaveAccount" class="bg-siadmin hover:bg-sapa transition text-white font-semibold text-sm px-4 py-2 rounded-xl">Simpan Akun</button>
      </div>
    </div>
  `;

  document.getElementById('btnSaveContent').addEventListener('click', async () => {
    await api.updateSiteSettings({
      hero_title: document.getElementById('setHeroTitle').value.trim(),
      hero_subtitle: document.getElementById('setHeroSubtitle').value.trim(),
      logo_url: document.getElementById('setLogoUrl').value.trim(),
    });
    toast('Konten disimpan.');
  });

  document.getElementById('btnSaveContact').addEventListener('click', async () => {
    await api.updateSiteSettings({
      alamat: document.getElementById('setAlamat').value.trim(),
      no_wa_sekolah: document.getElementById('setNoWa').value.trim(),
      jam_layanan: document.getElementById('setJamLayanan').value.trim(),
      nama_kepsek: document.getElementById('setNamaKepsek').value.trim(),
    });
    toast('Kontak disimpan.');
  });

  document.getElementById('btnSaveDrive').addEventListener('click', async () => {
    await api.updateSiteSettings({ gdrive_folder_id: document.getElementById('setDriveFolder').value.trim() });
    toast('Pengaturan Drive disimpan.');
  });

  document.getElementById('btnSaveAccount').addEventListener('click', async () => {
    const username = document.getElementById('setAdminUsername').value.trim();
    const password = document.getElementById('setAdminPassword').value;
    await api.updateAdminAccount({ username, password });
    if (username) setSession({ ...STATE.session, username });
    document.getElementById('setAdminPassword').value = '';
    toast('Akun admin diperbarui.');
  });
}

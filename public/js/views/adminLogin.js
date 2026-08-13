/* ============================================================
   views/adminLogin.js — #/login
   ============================================================ */
async function renderAdminLogin(root) {
  root.innerHTML = `
    <div class="min-h-screen hero-bg flex items-center justify-center px-5 py-10">
      <div class="max-w-md w-full">
        <a href="#/" class="flex items-center gap-1.5 text-slate-500 hover:text-sapa text-sm font-medium mb-6 transition">
          ${iconBack()} Kembali ke Beranda
        </a>
        <div class="glass rounded-3xl shadow-glass px-7 py-10 sm:px-10">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style="background:linear-gradient(135deg,#123B78,#1769D1)">
            ${iconLock()}
          </div>
          <h1 class="text-xl font-extrabold text-sapa text-center">Login Admin</h1>
          <p class="text-slate-500 text-sm text-center mt-1.5">Khusus untuk admin SDN 01 Papahan</p>

          <form id="loginForm" class="mt-7 space-y-4">
            <div>
              <label class="field-label">Username</label>
              <input id="loginUsername" type="text" class="field-input" placeholder="admin" autocomplete="username">
            </div>
            <div>
              <label class="field-label">Password</label>
              <input id="loginPassword" type="password" class="field-input" placeholder="••••••••" autocomplete="current-password">
            </div>
            <p id="loginError" class="hidden text-error text-xs font-semibold bg-error/10 rounded-lg px-3 py-2"></p>
            <button type="submit" class="w-full bg-sapa hover:bg-siadmin transition text-white font-semibold py-3.5 rounded-xl">Masuk ke Dashboard</button>
          </form>
          <p class="text-center text-[11px] text-slate-400 mt-5">Prototipe — default: admin / admin123</p>
        </div>
      </div>
    </div>
    <div id="toast" class="toast"></div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    const res = await api.login(u, p);
    const errEl = document.getElementById('loginError');
    if (!res.ok) {
      errEl.textContent = res.error;
      errEl.classList.remove('hidden');
      return;
    }
    setSession({ username: res.username, nama_lengkap: res.nama_lengkap, token: res.token });
    location.hash = '#/dashboard';
  });
}

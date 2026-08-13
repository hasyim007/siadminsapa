/* ============================================================
   icons.js — kumpulan ikon SVG inline (stroke, tanpa dependency)
   ============================================================ */
function svg(paths, size = 18, color = 'white', extra = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;
}

function iconStamp(big = false) {
  const p = `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>`;
  if (big) return `<div class="stempel">${svg(p, 180, 'var(--teal-900)')}</div>`;
  return svg(p, 22, 'white');
}
function iconUser() { return svg(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`, 15, 'currentColor'); }
function iconSend() { return svg(`<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>`, 17, 'white'); }
function iconSearch(size = 17, color = 'currentColor') { return svg(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`, size, color); }
function iconBolt() { return svg(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, 22, 'currentColor'); }
function iconWa() { return svg(`<path d="M3 21c0-3.5 4-4.5 9-4.5s9 1 9 4.5"/><circle cx="12" cy="8" r="4"/>`, 22, 'currentColor'); }
function iconShield() { return svg(`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>`, 22, 'currentColor'); }
function iconClose() { return svg(`<path d="M18 6 6 18M6 6l12 12"/>`, 18, 'currentColor'); }
function iconCheck(color = 'white') { return svg(`<path d="M20 6 9 17l-5-5"/>`, 24, color); }
function iconDownload() { return svg(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`, 15, 'currentColor'); }
function iconGeneric() { return svg(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>`, 22, 'white'); }
function iconLock() { return svg(`<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`, 24, 'white'); }
function iconBack() { return svg(`<path d="m15 18-6-6 6-6"/>`, 16, 'currentColor'); }
function iconMenu() { return svg(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`, 20, 'currentColor'); }
function iconLogout() { return svg(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`, 16, 'currentColor'); }
function iconDash() { return svg(`<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>`, 16, 'currentColor'); }
function iconInbox() { return svg(`<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>`, 16, 'currentColor'); }
function iconLayers() { return svg(`<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`, 16, 'currentColor'); }
function iconChat() { return svg(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`, 16, 'currentColor'); }
function iconSettings() { return svg(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, 16, 'currentColor'); }
function iconPlus() { return svg(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, 14, 'currentColor'); }
function iconTrash() { return svg(`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`, 14, 'currentColor'); }
function iconPrint() { return svg(`<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>`, 14, 'currentColor'); }

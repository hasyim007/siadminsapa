/* ============================================================
   worker/drive.js — integrasi Google Drive API via Service Account
   ------------------------------------------------------------
   Alur:
   1. Buat JWT ditandatangani dengan private key service account
      (RS256), lalu tukar ke Google OAuth token endpoint untuk
      dapat access_token (Bearer).
   2. Pakai access_token itu untuk upload file (multipart) ke
      Drive API, ke folder yang di-share ke email service account
      (ID folder disimpan di site_settings.gdrive_folder_id).
   3. Set permission file supaya bisa diakses lewat link (untuk
      ditampilkan/diunduh dari halaman cek status & dashboard admin).

   env.GDRIVE_SA_JSON berisi seluruh isi file JSON service account
   (disimpan sebagai secret Worker, BUKAN di-commit ke repo).
   ============================================================ */

let _cachedToken = null; // { access_token, exp }

async function getAccessToken(env) {
  if (_cachedToken && _cachedToken.exp > Date.now() / 1000 + 30) {
    return _cachedToken.access_token;
  }
  const sa = JSON.parse(env.GDRIVE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64url(header)}.${b64url(claim)}`;

  const key = await importPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsigned}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gagal ambil token Google: ' + JSON.stringify(data));

  _cachedToken = { access_token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

async function importPrivateKey(pem) {
  const pemBody = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binary.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

/**
 * Upload satu file ke Google Drive.
 * @param {object} env - Worker environment (butuh GDRIVE_SA_JSON + DB untuk baca folder tujuan)
 * @param {{ nama_file: string, tipe_file: string, blob?: Blob, dataUrl?: string }} file
 * @returns {{ id: string, name: string, viewLink: string }}
 */
export async function uploadToDrive(env, file) {
  const accessToken = await getAccessToken(env);
  const folderRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'gdrive_folder_id'").first();
  const folderId = folderRow?.value;
  if (!folderId) throw new Error('gdrive_folder_id belum diatur di Pengaturan Situs.');

  const blob = file.blob || dataUrlToBlob(file.dataUrl, file.tipe_file);
  const metadata = { name: file.nama_file, parents: [folderId] };

  const boundary = '-------siadminsapa' + Date.now();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${file.tipe_file || 'application/octet-stream'}\r\n\r\n`;
  const bodyBytes = new Blob([body, blob, `\r\n--${boundary}--`]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: bodyBytes,
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gagal upload ke Drive: ' + JSON.stringify(data));

  // Beri akses "anyone with link can view" supaya bisa dibuka dari halaman cek status publik
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return { id: data.id, name: data.name, viewLink: data.webViewLink };
}

function dataUrlToBlob(dataUrl, mime) {
  const [, b64] = dataUrl.split(',');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

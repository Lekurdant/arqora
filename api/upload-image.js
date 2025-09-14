import { putFile, getFile, getRawUrl, safeSlug } from './_github.js';
import { Buffer } from 'node:buffer';

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { dataUrl, filename, slug } = await readJsonBody(req);
    if (!dataUrl) return res.status(400).json({ error: 'Missing dataUrl' });
    if (!slug) return res.status(400).json({ error: 'Missing slug' });
    const normalizedSlug = safeSlug(slug);
    if (!normalizedSlug) return res.status(400).json({ error: 'Invalid slug' });
    const m = dataUrl.match(/^data:([a-zA-Z0-9+.-\/]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'Invalid dataUrl' });
    const mime = m[1];
    const b64 = m[2];
    const bytes = Buffer.from(b64, 'base64');
    const safeName = (filename || 'image').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const ext = (mime.split('/')[1] || 'png').toLowerCase();
    const key = `articles/${normalizedSlug}/assets/${Date.now()}-${safeName}.${ext}`;
    let existingSha = undefined;
    try { const f = await getFile(key); if (f) existingSha = f.sha; } catch {}
    await putFile(key, bytes, `chore: upload image ${safeName}`, existingSha);
    return res.status(200).json({ url: getRawUrl(key) });
  } catch (e) {
    return res.status(500).json({ error: 'Upload failed' });
  }
}



import jwt from 'jsonwebtoken';
import { listDir, getFile, deleteFile, getRawUrl } from '../_github.js';

function requireAdmin(req) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/(?:^|; )auth=([^;]+)/);
    if (!match) return false;
    const token = decodeURIComponent(match[1]);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;
    jwt.verify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  if (req.method === 'GET') {
    try {
      const f = await getFile(`articles/${slug}.json`);
      if (!f) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ url: getRawUrl(`articles/${slug}.json`) });
    } catch (e) {
      return res.status(500).json({ error: 'Failed' });
    }
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      let toDelete = [];
      const json = await getFile(`articles/${slug}.json`).catch(() => null);
      if (json) toDelete.push({ path: `articles/${slug}.json`, sha: json.sha });
      const assets = await listDir(`articles/${slug}`).catch(() => []);
      for (const a of assets) {
        if (a.type === 'file') toDelete.push({ path: a.path, sha: a.sha });
      }
      if (toDelete.length === 0) return res.status(404).json({ error: 'Not found' });
      // Supprimer séquentiellement pour fournir le bon sha à GitHub
      for (const f of toDelete) {
        await deleteFile(f.path, `chore: delete ${f.path}`, f.sha);
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete article', details: String(e && e.message || e) });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}



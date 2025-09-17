import jwt from 'jsonwebtoken';
import { Buffer } from 'node:buffer';
import { listDir, getFile, putFile, getRawUrl, safeSlug } from '../_github.js';

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

function requireAdmin(req, res) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/(?:^|; )auth=([^;]+)/);
    if (!match) return false;
    const token = decodeURIComponent(match[1]);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[auth] JWT_SECRET manquant');
      }
      return false;
    }
    jwt.verify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const entries = await listDir('articles');
      const jsons = entries.filter(e => e.type === 'file' && e.name.endsWith('.json'));
      const items = jsons.map(e => ({
        slug: e.name.replace(/\.json$/, ''),
        url: e.download_url || getRawUrl(e.path),
        size: e.size,
        uploadedAt: undefined
      }));
      return res.status(200).json({ items });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to list articles' });
    }
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { title, content, slug, coverBase64, excerpt, metaDescription, category, author, readTime, tags, focusKeywords, imageAlt, published } = await readJsonBody(req);
      if (!title || !content) {
        return res.status(400).json({ error: 'Missing title or content' });
      }
      const normalizedSlug = safeSlug(slug || title);

      // Chercher un article existant pour ce slug (édition)
      let existing = null;
      try {
        const f = await getFile(`articles/${normalizedSlug}.json`);
        if (f && f.content) existing = JSON.parse(f.content);
      } catch {}

      const normalizedTags = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
            ? tags.split(',').map(s => s.trim()).filter(Boolean)
            : undefined);

      const article = {
        title: title ?? existing?.title,
        content: content ?? existing?.content,
        slug: normalizedSlug,
        publishedAt: existing?.publishedAt || new Date().toISOString(),
        excerpt: (typeof excerpt !== 'undefined') ? excerpt : (existing?.excerpt || ''),
        metaDescription: (typeof metaDescription !== 'undefined') ? metaDescription : (existing?.metaDescription || excerpt || ''),
        category: (typeof category !== 'undefined') ? category : (existing?.category || 'nocode'),
        author: (typeof author !== 'undefined') ? author : (existing?.author || 'Nocodebaby'),
        readTime: (typeof readTime !== 'undefined') ? readTime : (existing?.readTime || '5 min'),
        tags: (typeof normalizedTags !== 'undefined') ? normalizedTags : (existing?.tags || []),
        focusKeywords: (typeof focusKeywords !== 'undefined') ? focusKeywords : (existing?.focusKeywords || ''),
        imageAlt: (typeof imageAlt !== 'undefined') ? imageAlt : (existing?.imageAlt || ''),
        published: (typeof published === 'boolean') ? published : (existing?.published !== false),
        coverUrl: existing?.coverUrl
      };

      if (coverBase64 && typeof coverBase64 === 'string') {
        const m = coverBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (m) {
          const [, mime, b64] = m;
          const ext = (mime.split('/')[1] || 'png').toLowerCase();
          const bytes = Buffer.from(b64, 'base64');
          const path = `articles/${normalizedSlug}/cover.${ext}`;
          // Écrire l'image dans le repo
          let existingCoverSha = null;
          try { const f = await getFile(path); if (f) existingCoverSha = f.sha; } catch {}
          await putFile(path, bytes, `chore: update cover for ${normalizedSlug}`, existingCoverSha);
          article.coverUrl = getRawUrl(path) + `?t=${Date.now()}`;
        }
      }

      const jsonPath = `articles/${normalizedSlug}.json`;
      let existingSha = undefined;
      try { const f = await getFile(jsonPath); if (f) existingSha = f.sha; } catch {}
      await putFile(jsonPath, JSON.stringify(article, null, 2), `chore: upsert article ${normalizedSlug}`, existingSha);
      return res.status(201).json({ ok: true, slug: normalizedSlug, url: getRawUrl(jsonPath) });
    } catch (e) {
      console.error('[articles:POST] error:', e);
      console.error('[articles:POST] error message:', e.message);
      console.error('[articles:POST] error code:', e.code);
      return res.status(500).json({ error: 'Failed to publish article', details: String(e && e.message || e) });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}



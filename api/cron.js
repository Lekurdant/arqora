import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const maxDays = parseInt(process.env.ARTICLE_TTL_DAYS || '0', 10);
    if (!maxDays || maxDays <= 0) {
      return res.status(200).json({ ok: true, pruned: 0, note: 'TTL disabled' });
    }
    const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
    const { blobs } = await list({ prefix: 'articles/' });
    let pruned = 0;
    for (const b of blobs) {
      const t = new Date(b.uploadedAt).getTime();
      if (t < cutoff) {
        await del(b.url);
        pruned++;
      }
    }
    return res.status(200).json({ ok: true, pruned });
  } catch (e) {
    return res.status(500).json({ error: 'cron failed' });
  }
}



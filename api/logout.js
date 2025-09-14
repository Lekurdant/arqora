export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `auth=; Path=/; HttpOnly; SameSite=Lax; ${isProd ? 'Secure;' : ''} Max-Age=0`);
  return res.status(200).json({ ok: true });
}



import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminCode = process.env.ADMIN_CODE;
  const jwtSecret = process.env.JWT_SECRET;
  if (!adminCode || !jwtSecret) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const { code } = req.body || {};
    
    // Logs temporaires pour debug
    console.log('ADMIN_CODE from env:', adminCode);
    console.log('Code received:', code);
    console.log('Codes match:', code === adminCode);
    
    if (!code || code !== adminCode) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '1d' });
    const isProd = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', `auth=${token}; Path=/; HttpOnly; SameSite=Lax; ${isProd ? 'Secure;' : ''} Max-Age=86400`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error' });
  }
}



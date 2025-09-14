import nodemailer from 'nodemailer';
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

function buildTransporter() {
  const host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = (process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || 'team@nocodebaby.com';
  const pass = process.env.EMAIL_PASSWORD;
  if (!pass) throw new Error('Missing EMAIL_PASSWORD');
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls: { rejectUnauthorized: false } });
}

function parseDataUrl(dataUrl) {
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const [, mime, b64] = m;
  const content = Buffer.from(b64, 'base64');
  return { mime, content };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { answers, pdfs } = await readJsonBody(req);
    const a = answers || {};

    const transporter = buildTransporter();
    const toEmail = process.env.CONTACT_TO || 'team@nocodebaby.com';
    const fromEmail = process.env.CONTACT_FROM || 'team@nocodebaby.com';

    const html = `
      <p>Nouvelle demande via le formulaire:</p>
      <ul>
        <li>Type: ${Array.isArray(a.type) ? a.type.join(', ') : ''}</li>
        <li>Nom: ${a.lastname || ''}</li>
        <li>Prénom: ${a.firstname || ''}</li>
        <li>Téléphone: ${a.phone || ''}</li>
        <li>CDC: ${Array.isArray(a.cdc) ? a.cdc.join(', ') : ''}</li>
        <li>Design: ${Array.isArray(a.design) ? a.design.join(', ') : ''}</li>
        <li>Budget: ${Array.isArray(a.budget) ? a.budget.join(', ') : ''}</li>
        <li>Email: ${a.email || ''}</li>
      </ul>
    `;

    const attachments = Array.isArray(pdfs)
      ? pdfs.map((p, i) => {
          const parsed = parseDataUrl(p.dataUrl);
          if (!parsed) return null;
          const filename = p.filename || `fichier-${i + 1}.pdf`;
          return { filename, content: parsed.content, contentType: parsed.mime };
        }).filter(Boolean)
      : [];

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Nouvelle demande client',
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);

    if (a.email) {
      await transporter.sendMail({
        from: fromEmail,
        to: a.email,
        subject: 'Merci pour votre demande',
        html: `<p>Merci ${a.firstname || ''} ${a.lastname || ''} !</p><p>Nous revenons vers vous sous 24h.</p>`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[contact] error:', e);
      return res.status(500).json({ error: 'contact_failed', details: String(e && e.message || e) });
    }
    return res.status(500).json({ error: 'contact_failed' });
  }
}



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
  const host = process.env.SMTP_HOST || 'smtp.mail.ovh.net';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = (process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER || 'team@arqova.fr';
  const pass = process.env.OVH_SMTP_PASS;
  if (!pass) throw new Error('Missing OVH_SMTP_PASS');
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
    const toEmail = process.env.CONTACT_TO || 'team@arqova.fr';
    const fromEmail = process.env.CONTACT_FROM || 'team@arqova.fr';

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
      replyTo: a.email || fromEmail,
      subject: 'Nouvelle demande client',
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);

    if (a.email) {
      await transporter.sendMail({
        from: fromEmail,
        to: a.email,
        replyTo: fromEmail,
        subject: 'Confirmation de votre demande - Arqova',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #36b37e;">Merci pour votre confiance !</h2>
            <p>Bonjour ${a.firstname || ''} ${a.lastname || ''},</p>
            <p>Nous avons bien reçu votre demande de projet et nous vous remercions de votre intérêt pour nos services.</p>
            <p><strong>Notre équipe vous contactera dans les plus brefs délais (sous 24h).</strong></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe Arqova<br>
              <a href="mailto:team@arqova.fr">team@arqova.fr</a>
            </p>
          </div>
        `
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



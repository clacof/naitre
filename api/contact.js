// naitre — formulario de contacto (función serverless para Vercel)
//
// Envía el contenido del formulario por email vía Resend.
// Variables de entorno necesarias en el proyecto de Vercel:
//   RESEND_API_KEY  (obligatoria)  — API key de https://resend.com
//   CONTACT_TO      (opcional)     — destinatario; por defecto hola@naitre.dev
//   CONTACT_FROM    (opcional)     — remitente verificado en Resend;
//                                    por defecto "Naître Web <web@naitre.dev>"
//
// El dominio del remitente (naitre.dev) debe estar verificado en Resend
// (registros SPF/DKIM) o los correos irán a spam o serán rechazados.

// --- Rate limit en memoria (por instancia serverless) ---
// Mismo patrón que api/chat.js: corta el abuso básico sin dependencias.
const BUCKET = new Map(); // ip -> { count, reset }
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const b = BUCKET.get(ip);
  if (!b || now > b.reset) {
    BUCKET.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  b.count++;
  if (BUCKET.size > 5000) BUCKET.clear(); // evitar crecimiento sin límite
  return b.count > MAX_PER_WINDOW;
}

function sameOrigin(req) {
  const host = req.headers.host;
  if (!host) return false;
  const ref = req.headers.origin || req.headers.referer;
  if (!ref) return false; // los navegadores siempre envían Origin en fetch POST
  try {
    return new URL(ref).host === host;
  } catch {
    return false;
  }
}

// Escapa para insertar texto del usuario en el cuerpo HTML del email.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const isEmail = s => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY no configurada');
    return res.status(500).json({ error: 'Service unavailable' });
  }

  try {
    const { name = '', email = '', message = '', company = '' } = req.body || {};

    // Honeypot: un bot rellena el campo oculto "company". Fingimos éxito.
    if (company) {
      return res.status(200).json({ ok: true });
    }

    const n = String(name).trim().slice(0, 120);
    const e = String(email).trim().slice(0, 200);
    const m = String(message).trim().slice(0, 5000);

    if (!n || !m || !isEmail(e)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const to = process.env.CONTACT_TO || 'hola@naitre.dev';
    const from = process.env.CONTACT_FROM || 'Naître Web <web@naitre.dev>';

    const html =
      `<h2>Nuevo mensaje del formulario de naitre</h2>` +
      `<p><strong>Nombre:</strong> ${escapeHtml(n)}</p>` +
      `<p><strong>Email:</strong> ${escapeHtml(e)}</p>` +
      `<p><strong>Mensaje:</strong></p>` +
      `<p style="white-space:pre-wrap">${escapeHtml(m)}</p>`;

    const text = `Nuevo mensaje del formulario de naitre\n\nNombre: ${n}\nEmail: ${e}\n\nMensaje:\n${m}`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: e,              // responder va directo al visitante
        subject: `Nuevo proyecto: ${n}`,
        html,
        text
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Resend error:', r.status, detail);
      return res.status(502).json({ error: 'Upstream error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

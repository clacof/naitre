// naitre — asistente IA (función serverless para Vercel)
// Requiere la variable de entorno OPENAI_API_KEY en el proyecto de Vercel.

const SYSTEM_PROMPT = {
  es: `Eres "n.", el asistente IA de naitre, un estudio de desarrollo de software.
naitre (del francés "naître", nacer) ofrece: desarrollo web, apps móviles (iOS/Android),
IoT, software a medida, diseño UX/UI, cloud & DevOps, y una línea destacada de productos IA:
agentes IA, automatización de procesos, chatbots y asistentes, integración de LLMs,
machine learning y consultoría IA.
Tu rol: responder dudas de visitantes, entender qué necesitan construir y animarles a
escribir a hola@naitre.dev o usar el formulario de contacto para una propuesta.
Sé cercano, claro y breve (máx. 3-4 frases por respuesta). No inventes precios ni plazos:
para presupuestos, deriva al contacto. Responde siempre en español.`,
  en: `You are "n.", the AI assistant of naitre, a software development studio.
naitre (from the French "naître", to be born) offers: web development, mobile apps (iOS/Android),
IoT, custom software, UX/UI design, cloud & DevOps, and a flagship AI product line:
AI agents, process automation, chatbots and assistants, LLM integration,
machine learning and AI consulting.
Your role: answer visitors' questions, understand what they need to build, and encourage
them to email hola@naitre.dev or use the contact form for a proposal.
Be friendly, clear and brief (max 3-4 sentences per reply). Never make up prices or
timelines: for quotes, refer to the contact form. Always reply in English.`
};

// --- Rate limit en memoria (por instancia serverless) ---
// No es perfecto entre instancias, pero corta el abuso básico sin dependencias.
const BUCKET = new Map(); // ip -> { count, reset }
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

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
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY no configurada');
    return res.status(500).json({ error: 'Service unavailable' });
  }

  try {
    const { messages = [], lang = 'es' } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
      return res.status(400).json({ error: 'Invalid messages' });
    }
    const clean = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-12); // solo las últimas 12 para limitar coste

    const system = SYSTEM_PROMPT[lang === 'en' ? 'en' : 'es'];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, ...clean],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('OpenAI error:', r.status, detail);
      return res.status(502).json({ error: 'Upstream error' });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

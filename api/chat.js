// api/chat.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  // Permite preflight CORS (opcional si vas a llamarlo desde una app web)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Falta el mensaje' });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const r = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: message }]
    });

    return res.status(200).json({ reply: r.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI error:', error.response?.data || error.message);
    return res
      .status(error.status || 500)
      .json({ error: error.response?.data?.error?.message || 'Error en el servidor' });
  }
}
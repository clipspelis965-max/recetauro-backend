const OpenAI = require('openai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Falta el mensaje' });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const r = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: message }]
    });

    res.status(200).json({ reply: r.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message);
    res.status(err.status || 500).json({ error: err.response?.data?.error?.message || 'Error en el servidor' });
  }
};
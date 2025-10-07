import dotenv from 'dotenv'
import express from 'express'
import OpenAI from 'openai'
import serverless from 'serverless-http'

dotenv.config({ path: '.env.production.local' })

const app = express()
app.use(express.json())

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.get('/', (req, res) => {
  res.send('✅ Servidor Recetauro funcionando correctamente.')
})

app.get('/test-openai', (req, res) => {
  res.json({
    hasKey: !!process.env.OPENAI_API_KEY,
    keyStartsWith: (process.env.OPENAI_API_KEY || '').slice(0, 7)
  })
})

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'Falta el mensaje' })

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    })

    res.json({ reply: response.choices[0].message.content })
  } catch (error) {
    console.error('Error al conectar con OpenAI:', error)
    res.status(500).json({ error: 'Error en el servidor' })
  }
})

// Exporta el handler para Vercel
export const handler = serverless(app)

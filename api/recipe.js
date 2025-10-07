import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CORS simple
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Leer body crudo
async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  let bodyText = "";
  try {
    bodyText = await readBody(req);
  } catch {
    return res.status(400).json({ error: "Failed to read request body" });
  }

  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { q = "", variant = 0 } = body;
  if (typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ error: "Missing 'q' (ingredients)" });
  }

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      servings: { type: "integer" },
      time: { type: "string" },
      ingredients: { type: "array", items: { type: "string" } },
      steps: { type: "array", items: { type: "string" } }
    },
    required: ["title", "ingredients", "steps"],
    additionalProperties: false
  };

  const prompt = [
    "Sos un chef saludable y preciso.",
    `Ingredientes del usuario: ${q}`,
    "Generá una receta en español, clara y concisa.",
    "Incluir: título, porciones, tiempo (min), lista de ingredientes y pasos numerados.",
    "Evitar ingredientes que no estén en la lista salvo básicos (sal, aceite).",
    `Variar el enfoque (variante #${variant}).`
  ].join("\n");

  try {
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: {
        type: "json_schema",
        json_schema: { name: "recipe", schema, strict: true }
      }
    });

    const text = resp.output_text || "";
    if (!text) return res.status(500).json({ error: "Empty AI response" });

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error("AI error", err);
    return res.status(500).json({ error: "AI error", details: String(err?.message || err) });
  }
}
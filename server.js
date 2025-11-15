import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ["GET", "POST", "DELETE"],
}));
app.use(express.json());

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || process.env.OPENAI_API_KEY,
});

/* ============================================================
   POST /api/chat ➜ Solo devuelve respuesta IA
============================================================ */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "")
      return res.status(400).json({ error: "Mensaje vacío" });

    const completion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.2-Exp:novita",
      messages: [{ role: "user", content: message }],
    });

    const respuesta = completion.choices[0].message.content;
    res.json({ response: respuesta });
  } catch (err) {
    console.error("❌ Error backend:", err);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { chatCompletion, textGenerationStream } from "@huggingface/inference";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Memoria RAM
let chats = [];

/* ============================================================
   POST /api/chat
============================================================ */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatId, title } = req.body;
    if (!message || message.trim() === "")
      return res.status(400).json({ error: "Mensaje vacío" });

    // 🔹 Llamada correcta a HuggingFace
    let respuesta = "";
    for await (const chunk of textGenerationStream({
      model: "deepseek-ai/DeepSeek-V3.2-Exp:novita",
      inputs: message,
      parameters: { max_new_tokens: 200 },
      accessToken: process.env.HF_TOKEN
    })) {
      if (chunk.token) respuesta += chunk.token.text;
    }

    const id = chatId || Date.now().toString();
    const index = chats.findIndex((c) => c.id === id);

    const newMessages = [
      { role: "user", content: message },
      { role: "ai", content: respuesta },
    ];

    if (index === -1) {
      chats.push({
        id,
        title: title || `Chat ${chats.length + 1}`,
        messages: newMessages,
      });
    } else {
      chats[index].messages.push(...newMessages);
      if (title) chats[index].title = title;
    }

    res.json({ response: respuesta, chatId: id });
  } catch (err) {
    console.error("❌ Error backend:", err);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

/* ============================================================
   GET /api/chats
============================================================ */
app.get("/api/chats", (req, res) => {
  res.json(chats.map(({ id, title }) => ({ id, title })));
});

/* ============================================================
   GET /api/chats/:id
============================================================ */
app.get("/api/chats/:id", (req, res) => {
  const chat = chats.find((c) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
  res.json(chat);
});

/* ============================================================
   DELETE /api/chats/:id
============================================================ */
app.delete("/api/chats/:id", (req, res) => {
  const index = chats.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Chat no encontrado" });

  chats.splice(index, 1);
  res.json({ success: true });
});

// Listener
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

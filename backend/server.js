import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();
const app = express();

// ✅ CORS abierto para cualquier origen (usable en móviles, WiFi, 4G/5G, etc.)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

// ✅ Cliente Hugging Face vía OpenAI SDK
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || process.env.OPENAI_API_KEY,
});

// ✅ Memoria de chats en RAM
let chats = [];

// Crear o continuar chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatId, title } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "El mensaje no puede estar vacío." });
    }

    const chatCompletion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.2-Exp:novita",
      messages: [{ role: "user", content: message }],
    });

    const respuesta = chatCompletion.choices[0].message.content;
    const id = chatId || Date.now().toString();
    const index = chats.findIndex((c) => c.id === id);

    const newMessage = [
      { role: "user", content: message },
      { role: "ai", content: respuesta },
    ];

    if (index === -1) {
      chats.push({
        id,
        title: title || `Chat ${chats.length + 1}`,
        messages: newMessage,
      });
    } else {
      chats[index].messages.push(...newMessage);
      if (title && !chats[index].title.includes("Chat")) {
        chats[index].title = title;
      }
    }

    res.json({ response: respuesta, chatId: id });
  } catch (err) {
    console.error("❌ Error en backend:", err.message);
    res.status(500).json({ error: "Error procesando la solicitud en el backend." });
  }
});

// Listar chats
app.get("/api/chats", (req, res) => {
  res.json(chats.map(({ id, title }) => ({ id, title })));
});

// Cargar conversación completa
app.get("/api/chats/:id", (req, res) => {
  const chat = chats.find((c) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat no encontrado." });
  res.json({ id: chat.id, title: chat.title, messages: chat.messages });
});

// Eliminar chat
app.delete("/api/chats/:id", (req, res) => {
  const index = chats.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Chat no encontrado." });
  chats.splice(index, 1);
  res.json({ success: true });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

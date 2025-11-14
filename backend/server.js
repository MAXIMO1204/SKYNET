import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();
const app = express();

// ⚡ Configuración de CORS: permite cualquier origen
app.use(cors({ origin: "*" }));
app.options("*", cors());

// ⚡ Middleware JSON
app.use(express.json());

// ⚡ Cliente OpenAI/Hugging Face
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || process.env.OPENAI_API_KEY,
});

// ⚡ Memoria de chats
let chats = [];

// ⚡ Crear o continuar chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatId, title } = req.body;
    if (!message || message.trim() === "") return res.status(400).json({ error: "Mensaje vacío" });

    const chatCompletion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.2-Exp:novita",
      messages: [{ role: "user", content: message }],
    });

    const respuesta = chatCompletion.choices[0].message.content;
    const id = chatId || Date.now().toString();
    const index = chats.findIndex((c) => c.id === id);

    const newMessage = [{ role: "user", content: message }, { role: "ai", content: respuesta }];

    if (index === -1) {
      chats.push({ id, title: title || `Chat ${chats.length + 1}`, messages: newMessage });
    } else {
      chats[index].messages.push(...newMessage);
      if (title && !chats[index].title.includes("Chat")) chats[index].title = title;
    }

    res.json({ response: respuesta, chatId: id });
  } catch (err) {
    console.error("❌ Error backend:", err.message);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

// ⚡ Listar chats
app.get("/api/chats", (req, res) => {
  res.json(chats.map(({ id, title }) => ({ id, title })));
});

// ⚡ Obtener chat por ID
app.get("/api/chats/:id", (req, res) => {
  const chat = chats.find((c) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
  res.json({ id: chat.id, title: chat.title, messages: chat.messages });
});

// ⚡ Eliminar chat
app.delete("/api/chats/:id", (req, res) => {
  const index = chats.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Chat no encontrado" });
  chats.splice(index, 1);
  res.json({ success: true });
});

// ⚡ Puerto Railway (obligatorio 8080)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

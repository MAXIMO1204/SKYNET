import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const hf = new HfInference(process.env.HF_TOKEN);

let chats = [];

app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatId, title } = req.body;
    if (!message || message.trim() === "")
      return res.status(400).json({ error: "Mensaje vacío" });

    // 🔹 Llamada simple a HuggingFace (no stream)
    const completion = await hf.textGeneration({
      model: "gpt2", // usa un modelo seguro para probar
      inputs: message,
      parameters: { max_new_tokens: 200 }
    });

    const respuesta = completion.generated_text;

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

app.get("/api/chats", (req, res) => {
  res.json(chats.map(({ id, title }) => ({ id, title })));
});

app.get("/api/chats/:id", (req, res) => {
  const chat = chats.find((c) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
  res.json(chat);
});

app.delete("/api/chats/:id", (req, res) => {
  const index = chats.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Chat no encontrado" });
  chats.splice(index, 1);
  res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

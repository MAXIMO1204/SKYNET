// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import { OpenAI } from "openai";

// dotenv.config();

// const app = express();

// // 🔹 CORS abierto para web y móvil (incluye capacitor://localhost)
// app.use(cors({
//   origin: (origin, callback) => {
//     callback(null, true); // acepta todos los orígenes
//   },
//   methods: ["GET", "POST", "DELETE"],
// }));
// app.use(express.json());

// // Cliente OpenAI/HuggingFace
// const client = new OpenAI({
//   baseURL: "https://router.huggingface.co/v1", // HuggingFace router
//   apiKey: process.env.HF_TOKEN || process.env.OPENAI_API_KEY,
// });

// // Memoria RAM
// let chats = [];

// /* ============================================================
//    POST /api/chat  ➜ Crear o continuar un chat
// ============================================================ */
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message, chatId, title } = req.body;

//     if (!message || message.trim() === "")
//       return res.status(400).json({ error: "Mensaje vacío" });

//     const completion = await client.chat.completions.create({
//       model: "deepseek-ai/DeepSeek-V3.2-Exp:novita", // el modelo que usabas
//       messages: [{ role: "user", content: message }],
//     });

//     const respuesta = completion.choices[0].message.content;
//     const id = chatId || Date.now().toString();
//     const index = chats.findIndex((c) => c.id === id);

//     const newMessages = [
//       { role: "user", content: message },
//       { role: "ai", content: respuesta },
//     ];

//     if (index === -1) {
//       chats.push({
//         id,
//         title: title || `Chat ${chats.length + 1}`,
//         messages: newMessages,
//       });
//     } else {
//       chats[index].messages.push(...newMessages);
//       if (title) chats[index].title = title;
//     }

//     res.json({ response: respuesta, chatId: id });
//   } catch (err) {
//     console.error("❌ Error backend:", err);
//     res.status(500).json({ error: "Error procesando la solicitud" });
//   }
// });

// /* ============================================================
//    GET /api/chats  ➜ Listar títulos
// ============================================================ */
// app.get("/api/chats", (req, res) => {
//   res.json(chats.map(({ id, title }) => ({ id, title })));
// });

// /* ============================================================
//    GET /api/chats/:id  ➜ Obtener chat completo
// ============================================================ */
// app.get("/api/chats/:id", (req, res) => {
//   const chat = chats.find((c) => c.id === req.params.id);
//   if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
//   res.json(chat);
// });

// /* ============================================================
//    DELETE /api/chats/:id  ➜ Eliminar chat
// ============================================================ */
// app.delete("/api/chats/:id", (req, res) => {
//   const index = chats.findIndex((c) => c.id === req.params.id);
//   if (index === -1) return res.status(404).json({ error: "Chat no encontrado" });

//   chats.splice(index, 1);
//   res.json({ success: true });
// });

// // Listener
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
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


import dotenv from "dotenv";// Importamos dotenv para poder usar variables de entorno desde un archivo .env
import express from "express";// Importamos express, el framework para crear el servidor HTTP y manejar rutas
import cors from "cors";// Importamos cors, que permite habilitar solicitudes desde otros dominios (cross-origin)
import { OpenAI } from "openai"; // Importamos la clase OpenAI, que nos da acceso al cliente para interactuar con modelos de IA


dotenv.config(); // Cargamos las variables de entorno definidas en el archivo .env
const app = express();// Creamos la aplicación de Express

// Configuramos CORS para aceptar solicitudes desde cualquier origen
// - origin: permite cualquier origen
// - methods: habilitamos GET, POST y DELETE
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ["GET", "POST", "DELETE"],
}));


app.use(express.json()); // Middleware para que Express pueda interpretar JSON en el cuerpo de las solicitudes

// Configuramos el cliente de OpenAI/HuggingFace
// - baseURL: endpoint del router de HuggingFace
// - apiKey: token de acceso, tomado de variables de entorno (HF_TOKEN o OPENAI_API_KEY)
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || process.env.OPENAI_API_KEY,
});

//Endpoint que recibe un mensaje y devuelve la respuesta generada por el modelo de IA
app.post("/api/chat", async (req, res) => {
  try {
    // Extraemos el mensaje enviado en el cuerpo de la petición
    const { message } = req.body;

    // Validamos que no esté vacío
    if (!message || message.trim() === "")
      return res.status(400).json({ error: "Mensaje vacío" });

    // Creamos la solicitud al modelo de IA
    const completion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.2-Exp:novita", // Modelo elegido
      messages: [{ role: "user", content: message }], // Mensaje del usuario
    });

    // Extraemos la respuesta del modelo
    const respuesta = completion.choices[0].message.content;

    // Devolvemos la respuesta en formato JSON
    res.json({ response: respuesta });
  } catch (err) {
    // Si ocurre un error, lo mostramos en consola y devolvemos un 500
    console.error("❌ Error backend:", err);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

// Configuramos el puerto del servidor (por defecto 8080 si no hay variable PORT)
const PORT = process.env.PORT || 8080;

// Iniciamos el servidor y mostramos un mensaje en consola
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

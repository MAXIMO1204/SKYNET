import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import "./IAForm.css";

// URL final de Railway
const api = axios.create({
  baseURL: "https://skynet-backend-production-9149.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
});

export default function IAForm() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll automático
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Cargar todos los chats desde backend
  const loadAllChats = async () => {
    try {
      const { data } = await api.get("/chats");
      setAllChats(data);
      if (!chatId && data.length > 0) {
        const lastChat = data[data.length - 1];
        setChatId(lastChat.id);
        setMessages(lastChat.messages);
      }
    } catch (err) {
      console.error("Error cargando chats:", err);
    }
  };

  useEffect(() => {
    loadAllChats();
  }, []);

  // Crear nuevo chat
  const createNewChat = async () => {
    setMessages([]);
    setChatId(null);
  };

  // Seleccionar chat del sidebar
  const selectChat = async (id) => {
    try {
      const { data } = await api.get(`/chats/${id}`);
      setChatId(data.id);
      setMessages(data.messages);
    } catch (err) {
      console.error("No se pudo cargar el chat:", err);
    }
  };

  // Eliminar chat
  const deleteChat = async (id) => {
    try {
      await api.delete(`/chats/${id}`);
      Swal.fire("Eliminado", "Chat eliminado correctamente", "success");
      if (id === chatId) {
        setMessages([]);
        setChatId(null);
      }
      loadAllChats();
    } catch (err) {
      Swal.fire("Error", "No se pudo eliminar el chat", "error");
    }
  };

  // Reconocimiento de voz
  const startListening = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { permission } = await SpeechRecognition.requestPermission();
        if (permission !== "granted") return alert("No tienes permiso para usar el micrófono.");
        setListening(true);
        const result = await SpeechRecognition.start({ language: "es-ES", maxResults: 1, prompt: "Habla ahora..." });
        if (result.matches?.length > 0) setInput((prev) => prev + " " + result.matches[0]);
        setListening(false);
      } else if ("webkitSpeechRecognition" in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.lang = "es-ES"; recognition.continuous = false; recognition.interimResults = false;
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onresult = (event) => setInput((prev) => prev + " " + event.results[0][0].transcript);
        recognition.start();
      } else alert("Tu navegador no soporta reconocimiento de voz.");
    } catch (err) { console.error("Error en reconocimiento de voz:", err); setListening(false); }
  };

  // Enviar mensaje
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", { message: userMessage.content, chatId });
      const aiMessage = { role: "ai", content: data.response };
      setMessages((prev) => [...prev, aiMessage]);
      if (!chatId) setChatId(data.chatId);
      loadAllChats(); // Actualizar sidebar
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", content: "❌ Error procesando tu solicitud." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="main-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={createNewChat}>➕ Nuevo Chat</button>
        <div className="chat-list">
          {allChats.map(chat => (
            <div key={chat.id} className={`chat-item ${chat.id === chatId ? 'active' : ''}`}>
              <span onClick={() => selectChat(chat.id)}>{chat.title}</span>
              <button className="chat-options" onClick={() => deleteChat(chat.id)}>⋮</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <section className="chat-section">
        <div className="chat-container">
          <div className="chat-header">
            <h2>Skynet AI</h2>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe o habla tu mensaje..."
              rows={2}
            />
            <button type="button" onClick={startListening} className="mic-btn">
              {listening ? "🎙️ Escuchando..." : "🎤 Hablar"}
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "⏳" : "Enviar"}
            </button>
          </form>

          <div className="chat-footer">© 2025 Ramiro Atencio — Proyecto de IA Académica.</div>
        </div>
      </section>
    </div>
  );
}

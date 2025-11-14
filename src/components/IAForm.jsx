import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import "./IAForm.css";

const api = axios.create({
  baseURL: "https://skynet-production-6ead.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
});

export default function IAForm() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // AUTOSCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // GENERAR TÍTULO AUTOMÁTICO
  const generateTitle = (text) => {
    let words = text.trim().split(" ");
    let title = words.slice(0, 5).join(" ");
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  // CARGAR CHATS
  const loadAllChats = async () => {
    try {
      const { data } = await api.get("/chats");
      const chatsArray = Array.isArray(data) ? data : [];
      setAllChats(chatsArray);

      if (chatsArray.length > 0 && !chatId) {
        const lastChat = chatsArray[chatsArray.length - 1];
        const chatData = await api.get(`/chats/${lastChat.id}`);
        setChatId(chatData.data.id);
        setMessages(chatData.data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando chats:", err);
      setMessages([]);
      setChatId(null);
      setAllChats([]);
    }
  };

  useEffect(() => {
    loadAllChats();
  }, []);

  // NUEVO CHAT
  const createNewChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
  };

  // SELECCIONAR CHAT
  const selectChat = async (id) => {
    try {
      const { data } = await api.get(`/chats/${id}`);
      setChatId(data.id);
      setMessages(data.messages || []);
      setMenuOpen(false);
    } catch (err) {
      console.error("Error cargando chat:", err);
    }
  };

  // ELIMINAR CHAT
  const confirmDelete = async (id) => {
    const menu = await Swal.fire({
      title: "Opciones",
      showCancelButton: true,
      confirmButtonText: "Eliminar Chat",
      cancelButtonText: "Cancelar",
      icon: "info",
    });

    if (!menu.isConfirmed) return;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
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
    }
  };

  // ENVIAR MENSAJE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: userMessage.content,
        chatId,
      });

      const aiMessage = { role: "ai", content: data.response };
      setMessages((prev) => [...prev, aiMessage]);

      // SI ES UN CHAT NUEVO → LE PONEMOS TÍTULO
      if (!chatId) {
        const newTitle = generateTitle(userMessage.content);
        await api.put(`/chats/${data.chatId}`, { title: newTitle });
      }

      if (!chatId) setChatId(data.chatId);

      loadAllChats();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "❌ Error procesando tu solicitud." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // MICROFONO
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "es-AR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput((prev) => prev + " " + text);
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // TEMPLATE
  return (
    <div className="main-container">

      {/* Overlay para cerrar menú en mobile */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="new-chat-btn" onClick={createNewChat}>
          ➕ Nuevo Chat
        </button>

        <div className="chat-list">
          {allChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === chatId ? "active" : ""}`}
            >
              <span onClick={() => selectChat(chat.id)}>
                {chat.title || "Chat sin título"}
              </span>

              <button className="chat-options" onClick={() => confirmDelete(chat.id)}>
                ⋮
              </button>
            </div>
          ))}
        </div>
      </aside>

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
              placeholder="Escribe tu mensaje..."
              rows={2}
            />

            <button
              type="button"
              className={`mic-btn ${listening ? "recording" : ""}`}
              onClick={listening ? stopListening : startListening}
            >
              {listening ? "🔴" : "🎤"}
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "⏳" : "Enviar"}
            </button>
          </form>

          <div className="chat-footer">
            © 2025 Ramiro Atencio — Proyecto IA Académica
          </div>
        </div>
      </section>
    </div>
  );
}


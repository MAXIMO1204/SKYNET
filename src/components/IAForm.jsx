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
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAllChats = async () => {
    try {
      const { data } = await api.get("/chats");
      setAllChats(data);

      if (data.length > 0 && !chatId) {
        const lastChat = data[data.length - 1];
        const chatData = await api.get(`/chats/${lastChat.id}`);
        setChatId(chatData.data.id);
        setMessages(chatData.data.messages);
      } else {
        setMessages([]);
        setChatId(null);
      }
    } catch (err) {
      console.error("Error cargando chats:", err);
      setMessages([]);
      setChatId(null);
    }
  };

  useEffect(() => {
    loadAllChats();
  }, []);

  const createNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  const selectChat = async (id) => {
    try {
      const { data } = await api.get(`/chats/${id}`);
      setChatId(data.id);
      setMessages(data.messages);
      setMenuOpen(false);
    } catch (err) {
      console.error("No se pudo cargar el chat:", err);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", { message: userMessage.content, chatId });
      const aiMessage = { role: "ai", content: data.response };
      setMessages((prev) => [...prev, aiMessage]);
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

  return (
    <div className="main-container">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <button className="new-chat-btn" onClick={createNewChat}>
          ➕ Nuevo Chat
        </button>
        <div className="chat-list">
          {allChats.map((chat) => (
            <div key={chat.id} className={`chat-item ${chat.id === chatId ? "active" : ""}`}>
              <span onClick={() => selectChat(chat.id)}>{chat.title}</span>
              <button className="chat-options" onClick={() => deleteChat(chat.id)}>⋮</button>
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


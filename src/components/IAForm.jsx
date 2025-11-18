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
  const [username, setUsername] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Al entrar, pedir nombre y cargar chats locales
  useEffect(() => {
    let storedUser = localStorage.getItem("username");
    if (!storedUser) {
      Swal.fire({
        title: "Bienvenido",
        text: "Ingresa tu nombre:",
        input: "text",
        inputPlaceholder: "Tu nombre...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Aceptar",
      }).then((result) => {
        storedUser = result.value || "Invitado";
        localStorage.setItem("username", storedUser);
        setUsername(storedUser);
        loadAllChats(storedUser);
      });
    } else {
      setUsername(storedUser);
      loadAllChats(storedUser);
    }
  }, []);

  const loadAllChats = (user = username) => {
    const savedChats = JSON.parse(localStorage.getItem(`chats_${user}`)) || [];
    setAllChats(savedChats);
  };

  const saveChats = (updatedChats) => {
    setAllChats(updatedChats);
    localStorage.setItem(`chats_${username}`, JSON.stringify(updatedChats));
  };

  const createNewChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
  };

  const selectChat = (id) => {
    const chat = allChats.find((c) => c.id === id);
    if (chat) {
      setChatId(chat.id);
      setMessages(chat.messages || []);
      setMenuOpen(false);
    }
  };

  const confirmDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar chat?",
      text: "No se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const updatedChats = allChats.filter((c) => c.id !== id);
    saveChats(updatedChats);

    if (id === chatId) {
      setMessages([]);
      setChatId(null);
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
      const title = !chatId ? input.trim().split(" ").slice(0, 5).join(" ") : undefined;
      const { data } = await api.post("/chat", { message: userMessage.content });

      const aiMessage = { role: "ai", content: data.response };
      const updatedMessages = [...messages, userMessage, aiMessage];

      let updatedChats = [...allChats];
      if (!chatId) {
        const newChat = {
          id: Date.now().toString(),
          title: title || `Chat ${updatedChats.length + 1}`,
          messages: updatedMessages,
        };
        updatedChats.push(newChat);
        setChatId(newChat.id);
      } else {
        const chatIndex = updatedChats.findIndex((c) => c.id === chatId);
        if (chatIndex !== -1) {
          updatedChats[chatIndex].messages = updatedMessages;
        }
      }

      saveChats(updatedChats);
      setMessages(updatedMessages);
    } catch {
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
      {/* 🔹 Overlay para cerrar menú en móviles */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* 🔹 Botón hamburguesa visible en móviles */}
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-content">
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
                <button
                  className="chat-options"
                  onClick={() => confirmDelete(chat.id)}
                >
                  ⋮
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat principal */}
      <section className="chat-section">
        <div className="chat-container">
          <div className="chat-header">
            <h3>Skynet AI — {username}</h3>
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

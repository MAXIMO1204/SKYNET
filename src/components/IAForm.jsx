import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import "./IAForm.css";

const IAForm = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [allChats, setAllChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // MICROFONO
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [response]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = () => {
    const stored = localStorage.getItem("skynet_chats");
    if (stored) {
      setAllChats(JSON.parse(stored));
    } else {
      setAllChats([]);
    }
  };

  const saveChats = (updated) => {
    localStorage.setItem("skynet_chats", JSON.stringify(updated));
    setAllChats(updated);
  };

  const startNewChat = () => {
    const newChat = {
      id: Date.now(),
      messages: [],
    };
    saveChats([newChat, ...allChats]);
    setSelectedChatId(newChat.id);
    setResponse("");
    setInput("");
  };

  const getSelectedChat = () => {
    return allChats.find((c) => c.id === selectedChatId) || null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const userMessage = input;

    let updated = allChats.map((chat) => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { from: "user", text: userMessage }],
        };
      }
      return chat;
    });

    saveChats(updated);
    setInput("");

    try {
      const res = await fetch("http://localhost:4000/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await res.json();
      const botMessage = data.response || "Error al procesar.";

      updated = updated.map((chat) => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { from: "bot", text: botMessage }],
          };
        }
        return chat;
      });

      saveChats(updated);
      setResponse(botMessage);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  // ⚠ MENÚ DE LOS 3 PUNTITOS — CONFIRMACIÓN SWEETALERT
  const handleDeleteChat = (chatId) => {
    Swal.fire({
      title: "¿Eliminar chat?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E2725B",
      cancelButtonColor: "#0F4CFF",
      confirmButtonText: "Eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        const filtered = allChats.filter((c) => c.id !== chatId);
        saveChats(filtered);
        setSelectedChatId(null);
        Swal.fire("Eliminado", "El chat ha sido eliminado", "success");
      }
    });
  };

  // 🔊 MICROFONO
  const toggleRecord = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.lang = "es-ES";
      recognitionRef.current.continuous = false;

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInput((prev) => prev + " " + text);
      };
    }

    if (!isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const selectedChat = getSelectedChat();

  return (
    <div className="app-container">
  <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

  {/* SIDEBAR */}
  <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
    <h1 className="logo">Skynet AI</h1>
    <button className="new-chat-btn" onClick={startNewChat}>+ Nuevo Chat</button>
    <h3 className="history-title">Historial</h3>
    {allChats.map((chat) => {
      const firstMsg = chat.messages.length > 0 ? chat.messages[0].text.slice(0, 25) : "Chat vacío";
      return (
        <div key={chat.id} className="chat-item">
          <span onClick={() => setSelectedChatId(chat.id)}>{firstMsg}</span>
          <button className="dots-menu" onClick={() => handleDeleteChat(chat.id)}>⋮</button>
        </div>
      );
    })}
  </div>

  {/* CHAT AREA */}
  <div className="chat-area">
    <div className="chat-header">
      <h2>{selectedChat ? "Chat activo" : "Selecciona un chat"}</h2>
    </div>

    <div className="messages">
      {selectedChat &&
        selectedChat.messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.from}`}>
            <ReactMarkdown>{m.text}</ReactMarkdown>
          </div>
        ))}
      <div ref={messagesEndRef} />
    </div>

    <div className="input-area">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu mensaje..."
      />
      <button className={`mic-btn ${isRecording ? "recording" : ""}`} onClick={toggleRecord}>🎤</button>
      <button onClick={sendMessage} disabled={loading}>{loading ? "..." : "Enviar"}</button>
    </div>
  </div>
</div>
  );
};

export default IAForm;



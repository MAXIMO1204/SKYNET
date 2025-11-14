// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import ReactMarkdown from "react-markdown";
// import Swal from "sweetalert2";
// import { SpeechRecognition } from "@capacitor-community/speech-recognition";
// import "./IAForm.css";

// const api = axios.create({
//   baseURL: "https://skynet-production-6ead.up.railway.app/api",
//   headers: { "Content-Type": "application/json" },
// });

// export default function IAForm() {
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [allChats, setAllChats] = useState([]);
//   const [chatId, setChatId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [listening, setListening] = useState(false);

//   const chatEndRef = useRef(null);

//   // AUTOSCROLL
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Crear título automático
//   const generateTitle = (text) => {
//     let words = text.trim().split(" ");
//     let title = words.slice(0, 5).join(" ");
//     return title.charAt(0).toUpperCase() + title.slice(1);
//   };

//   // Cargar listado de chats
//   const loadAllChats = async () => {
//     try {
//       const { data } = await api.get("/chats");
//       setAllChats(Array.isArray(data) ? data : []);
//     } catch {
//       setAllChats([]);
//     }
//   };

//   useEffect(() => {
//     loadAllChats();
//   }, []);

//   // Nuevo chat
//   const createNewChat = () => {
//     setMessages([]);
//     setChatId(null);
//     setInput("");
//   };

//   // Seleccionar chat
//   const selectChat = async (id) => {
//     try {
//       const { data } = await api.get(`/chats/${id}`);
//       setChatId(data.id);
//       setMessages(data.messages || []);
//       setMenuOpen(false);
//     } catch {
//       console.error("Error cargando chat");
//     }
//   };

//   // Eliminar chat
//   const confirmDelete = async (id) => {
//     const confirm = await Swal.fire({
//       title: "¿Eliminar chat?",
//       text: "No se puede deshacer",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Sí, eliminar",
//       cancelButtonText: "Cancelar",
//     });

//     if (!confirm.isConfirmed) return;

//     try {
//       await api.delete(`/chats/${id}`);

//       if (id === chatId) {
//         setMessages([]);
//         setChatId(null);
//       }

//       loadAllChats();
//     } catch {
//       Swal.fire("Error", "No se pudo eliminar", "error");
//     }
//   };

//   // Enviar mensaje
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage = { role: "user", content: input.trim() };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setLoading(true);

//     try {
//       const title = !chatId ? generateTitle(userMessage.content) : undefined;

//       const { data } = await api.post("/chat", {
//         message: userMessage.content,
//         chatId,
//         title,
//       });

//       const aiMessage = { role: "ai", content: data.response };
//       setMessages((prev) => [...prev, aiMessage]);

//       if (!chatId) setChatId(data.chatId);

//       loadAllChats();
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "ai", content: "❌ Error procesando tu solicitud." },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // MICROFONO dual (web y Android)
//   const startListening = async () => {
//     try {
//       if ("webkitSpeechRecognition" in window) {
//         // Web (Chrome)
//         const recognition = new window.webkitSpeechRecognition();
//         recognition.lang = "es-AR";
//         recognition.continuous = false;
//         recognition.interimResults = false;

//         recognition.onresult = (event) => {
//           const text = event.results[0][0].transcript;
//           setInput((prev) => prev + " " + text);
//         };

//         recognition.onstart = () => setListening(true);
//         recognition.onend = () => setListening(false);
//         recognition.onerror = () => setListening(false);

//         recognition.start();
//       } else {
//         // Android (Capacitor plugin)
//         await SpeechRecognition.requestPermission();
//         const result = await SpeechRecognition.start({ language: "es-AR" });
//         if (result.matches && result.matches.length > 0) {
//           setInput((prev) => prev + " " + result.matches[0]);
//         }
//         setListening(true);
//       }
//     } catch (err) {
//       console.error("Error micrófono:", err);
//       setListening(false);
//     }
//   };

//   const stopListening = async () => {
//     try {
//       if ("webkitSpeechRecognition" in window) {
//         // Web: Chrome corta solo
//       } else {
//         // Android
//         await SpeechRecognition.stop();
//       }
//     } catch {}
//     setListening(false);
//   };

//   // TEMPLATE
//   return (
//     <div className="main-container">
//       {menuOpen && (
//         <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
//       )}

//       <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
//         ☰
//       </button>

//       <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
//         <div className="sidebar-content">
//           <button className="new-chat-btn" onClick={createNewChat}>
//             ➕ Nuevo Chat
//           </button>

//           <div className="chat-list">
//             {allChats.map((chat) => (
//               <div
//                 key={chat.id}
//                 className={`chat-item ${chat.id === chatId ? "active" : ""}`}
//               >
//                 <span onClick={() => selectChat(chat.id)}>
//                   {chat.title || "Chat sin título"}
//                 </span>

//                 <button
//                   className="chat-options"
//                   onClick={() => confirmDelete(chat.id)}
//                 >
//                   ⋮
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </aside>

//       <section className="chat-section">
//         <div className="chat-container">
//           <div className="chat-header">
//             <h2>Skynet AI</h2>
//           </div>

//           <div className="chat-body">
//             {messages.map((msg, i) => (
//               <div key={i} className={`chat-message ${msg.role}`}>
//                 <ReactMarkdown>{msg.content}</ReactMarkdown>
//               </div>
//             ))}
//             <div ref={chatEndRef} />
//           </div>

//           <form className="chat-input" onSubmit={handleSubmit}>
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Escribe tu mensaje..."
//               rows={2}
//             />

//             <button
//               type="button"
//               className={`mic-btn ${listening ? "recording" : ""}`}
//               onClick={listening ? stopListening : startListening}
//             >
//               {listening ? "🔴" : "🎤"}
//             </button>

//             <button type="submit" disabled={loading}>
//               {loading ? "⏳" : "Enviar"}
//             </button>
//           </form>

//           <div className="chat-footer">
//             © 2025 Ramiro Atencio — Proyecto IA Académica
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import axios from "axios";

export default function IAForm() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Detectar si es móvil
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Al montar, cargar historial del dispositivo
  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats")) || [];
    setChats(savedChats);
  }, []);

  const saveChats = (updatedChats) => {
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, { message });
      const respuesta = res.data.response;

      let updatedChats = [...chats];
      let chat;

      if (currentChatId) {
        chat = updatedChats.find(c => c.id === currentChatId);
        chat.messages.push({ role: "user", content: message });
        chat.messages.push({ role: "ai", content: respuesta });
      } else {
        const newChat = {
          id: Date.now().toString(),
          title: `Chat ${updatedChats.length + 1}`,
          messages: [
            { role: "user", content: message },
            { role: "ai", content: respuesta }
          ]
        };
        updatedChats.push(newChat);
        setCurrentChatId(newChat.id);
      }

      saveChats(updatedChats);
      setMessage("");
    } catch (err) {
      console.error("❌ Error frontend:", err);
    }
  };

  const handleSelectChat = (id) => setCurrentChatId(id);

  const handleDeleteChat = (id) => {
    const updatedChats = chats.filter(c => c.id !== id);
    saveChats(updatedChats);
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleClear = () => {
    setChats([]);
    localStorage.removeItem("chats");
    setCurrentChatId(null);
  };

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar de chats */}
      <div style={{ width: "200px", borderRight: "1px solid #ccc" }}>
        <h3>Chats</h3>
        <button onClick={handleClear}>🧹 Limpiar todo</button>
        {chats.map(c => (
          <div key={c.id}>
            <button onClick={() => handleSelectChat(c.id)}>{c.title}</button>
            <button onClick={() => handleDeleteChat(c.id)}>🗑️</button>
          </div>
        ))}
      </div>

      {/* Área principal */}
      <div style={{ flex: 1, padding: "10px" }}>
        <form onSubmit={handleSubmit}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
          />
          <button type="submit">Enviar</button>

          {/* Micrófono solo en PC */}
          {!isMobile && (
            <button type="button" onClick={() => console.log("Micrófono PC")}>🎤</button>
          )}
        </form>

        <div>
          {currentChat ? (
            currentChat.messages.map((m, i) => (
              <p key={i}><b>{m.role}:</b> {m.content}</p>
            ))
          ) : (
            <p>Selecciona un chat o crea uno nuevo.</p>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // AUTOSCROLL
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

  // Cargar listado de chats del usuario
  const loadAllChats = (user = username) => {
    const savedChats = JSON.parse(localStorage.getItem(`chats_${user}`)) || [];
    setAllChats(savedChats);
  };

  const saveChats = (updatedChats) => {
    setAllChats(updatedChats);
    localStorage.setItem(`chats_${username}`, JSON.stringify(updatedChats));
  };

  // Nuevo chat
  const createNewChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
  };

  // Seleccionar chat
  const selectChat = (id) => {
    const chat = allChats.find((c) => c.id === id);
    if (chat) {
      setChatId(chat.id);
      setMessages(chat.messages || []);
      setMenuOpen(false);
    }
  };

  // Eliminar chat
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

  // Enviar mensaje
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
            <h2>Skynet AI — {username}</h2>
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
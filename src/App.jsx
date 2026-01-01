import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Import Plugin Tabel
import "./styles/main.css";
import logo from "./assets/logofixx.png";
import { getGeminiResponse } from "./services/geminiService";
import Onboarding from "./Onboarding";

// --- HELPER: HITUNG KELAS & LEVEL OTOMATIS ---
const calculateCurrentStatus = (userData) => {
  if (!userData) return null;

  const now = new Date();
  const registeredDate = new Date(userData.registeredAt);
  
  // Hitung selisih tahun (Simulasi kenaikan kelas)
  let yearDiff = now.getFullYear() - registeredDate.getFullYear();
  let currentGrade = userData.grade + yearDiff;

  // Tentukan Jenjang (Level)
  let level = "UMUM";
  if (currentGrade >= 1 && currentGrade <= 6) level = "SD";
  else if (currentGrade >= 7 && currentGrade <= 9) level = "SMP";
  else if (currentGrade >= 10 && currentGrade <= 12) level = "SMA";
  else level = "MAHASISWA"; 

  return { ...userData, currentGrade, level };
};

// --- KOMPONEN CHAT LAYOUT ---
function ChatLayout({ 
  logsOpen, setLogsOpen, messages, onSendMessage, input, setInput, isLoading,
  chats, selectedChatId, setSelectedChatId, onNewChat, onDeleteChat, level, user 
}) {
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll ke bawah saat ada pesan baru
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, isLoading, attachment]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input, attachment);
    setInput(""); 
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      {/* 75% - Area Chat */}
      <div className="chat-section">
        <div className="chat-panel">
          
          {/* Greeting Dinamis */}
          <div className="chat-greeting">
            Hi, {user.name}! 👋 <br/>
            <span style={{fontSize: "14px", fontWeight: "400", color: "#555"}}>
               Aku Tutor AI untuk <strong>Kelas {user.currentGrade} ({level})</strong>. Semangat belajar! 🚀
            </span>
          </div>

          <div className="chat-messages">
             {messages.length === 0 && (
               <div className="chat-bubble ai">Mau tanya materi apa hari ini?</div>
             )}
             
             {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender === "user" ? "user" : "ai"}`}>
                {m.fileName && <div className="file-indicator">📎 {m.fileName}</div>}
                
                {m.sender === "ai" ? (
                  <div className="markdown-content">
                    {/* FITUR PENTING: remarkPlugins={[remarkGfm]} agar tabel muncul */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-bubble ai"><em>Sedang berpikir... 🤖</em></div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-wrapper">
            {attachment && (
              <div className="attachment-preview">
                <span className="attachment-name">📄 {attachment.name}</span>
                <button className="attachment-remove" onClick={removeAttachment}>✕</button>
              </div>
            )}
            <div className="chat-input-bar">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,application/pdf" 
                style={{ display: "none" }} 
              />
              <button className="icon-btn attach-btn" onClick={() => fileInputRef.current.click()}>📎</button>
              
              <input 
                className="chat-input-field" 
                placeholder={attachment ? "Beri keterangan..." : "Tulis pertanyaanmu..."} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKeyDown} 
                disabled={isLoading} 
              />
              
              <button className="chat-send-btn" onClick={handleSendClick} disabled={isLoading}>
                {isLoading ? "..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
        
        {!logsOpen && (
          <button className="icon-btn logs-toggle-floating" onClick={() => setLogsOpen(true)}>❯</button>
        )}
      </div>

      {/* 25% - Sidebar Logs */}
      <div className="logs-section">
        <div className="logs-panel">
          <div className="logs-header">
            <div className="logs-title">Riwayat Chat</div>
            <div className="logs-buttons">
              <button className="new-chat-btn" onClick={onNewChat}>+ Baru</button>
              <button className="icon-btn logs-toggle-btn" onClick={() => setLogsOpen(false)}>❮</button>
            </div>
          </div>
          <div className="logs-list">
            {chats.map((chat) => (
              <div key={chat.id} className={"log-item " + (chat.id === selectedChatId ? "active" : "")} onClick={() => setSelectedChatId(chat.id)}>
                <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'}}>{chat.title}</span>
                <button className="log-delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PROFILE PAGE ---
function ProfilePage({ user, onBack, onLogout, onDeleteAccount }) {
  return (
    <div className="profile-page fade-in">
      <div className="profile-header-nav">
        <button onClick={onBack} className="back-btn">← Kembali ke Chat</button>
      </div>

      <div className="profile-card">
        <div className="profile-top">
          <div className="profile-avatar-large">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-badge">{user.level}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Kelas Saat Ini</span>
            <span className="value">Kelas {user.currentGrade}</span>
          </div>
          <div className="detail-item">
            <span className="label">Bergabung Sejak</span>
            <span className="value">
              {new Date(user.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-btn logout-btn" onClick={onLogout}>Keluar Akun (Logout)</button>
          
          <div className="divider" style={{margin: "10px 0", borderTop: "1px solid #eee"}}></div>
          
          <div className="danger-zone">
            <p>Ingin menghapus riwayat chat <strong>{user.name}</strong>?</p>
            <button className="action-btn delete-btn" onClick={onDeleteAccount}>Hapus Data Permanen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP (LOGIC UTAMA) ---
export default function App() {
  // 1. STATE INITIALIZATION
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]); 
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [page, setPage] = useState("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  // Cek apakah ada sesi user yang "tertinggal" (misal di-refresh)
  useEffect(() => {
    try {
      const savedUserSession = localStorage.getItem("mentorku-active-session");
      if (savedUserSession) {
        const userData = JSON.parse(savedUserSession);
        loadUserSpecificData(userData);
      }
    } catch (error) {
      console.error("Gagal memuat sesi:", error);
      localStorage.removeItem("mentorku-active-session");
    }
  }, []);

  // 2. FUNGSI LOAD DATA BERDASARKAN USERNAME
  const loadUserSpecificData = (userData) => {
    const processedUser = calculateCurrentStatus(userData);
    setUser(processedUser);
    
    // Kunci Unik berdasarkan Nama (lowercase biar aman)
    const storageKey = `mentorku-data-${processedUser.name.toLowerCase().replace(/\s/g, '-')}`;
    
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setChats(parsedData.chats || []);
        setSelectedChatId(parsedData.selectedChatId || null);
      } else {
        const initialChats = [{ id: 1, title: "Chat Baru", messages: [] }];
        setChats(initialChats);
        setSelectedChatId(1);
      }
    } catch (error) {
      console.error("Data korup, mereset chat:", error);
      setChats([{ id: 1, title: "Chat Baru", messages: [] }]);
      setSelectedChatId(1);
    }
  };

  // 3. AUTO-SAVE
  useEffect(() => {
    if (user && chats.length > 0) {
      const storageKey = `mentorku-data-${user.name.toLowerCase().replace(/\s/g, '-')}`;
      const dataToSave = {
        chats: chats,
        selectedChatId: selectedChatId
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      localStorage.setItem("mentorku-active-session", JSON.stringify(user));
    }
  }, [chats, selectedChatId, user]);


  // 4. HANDLERS
  const handleRegister = (inputData) => {
    loadUserSpecificData(inputData);
  };

  const handleLogout = () => {
    localStorage.removeItem("mentorku-active-session");
    setUser(null);
    setChats([]);
    setPage("chat");
    setSettingsOpen(false);
  };

  const handleDeleteAccount = () => {
    if(confirm(`Yakin hapus semua data milik ${user.name}?`)) {
        const storageKey = `mentorku-data-${user.name.toLowerCase().replace(/\s/g, '-')}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem("mentorku-active-session");
        
        setUser(null);
        setChats([]);
        setPage("chat");
    }
  };

  // 5. CHAT LOGIC
  const activeChat = chats.find((c) => c.id === selectedChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  const handleNewChat = () => {
    const newId = Date.now();
    const newChat = { id: newId, title: "Chat Baru", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newId);
  };

  const handleDeleteChat = (id) => {
    const newChats = chats.filter((c) => c.id !== id);
    setChats(newChats);
    if (selectedChatId === id) setSelectedChatId(newChats[0]?.id ?? null);
  };

  const handleSendMessage = async (textInput, fileInput) => {
    if (!activeChat) return;

    const userMsg = { id: Date.now(), sender: "user", text: textInput, fileName: fileInput ? fileInput.name : null };
    
    setChats((prev) => prev.map((chat) => 
      chat.id === selectedChatId 
        ? { ...chat, messages: [...chat.messages, userMsg], title: chat.messages.length === 0 ? textInput.substring(0, 20) : chat.title } 
        : chat
    ));

    setIsLoading(true);

    try {
      const specificLevel = `Kelas ${user.currentGrade} (${user.level})`;
      const aiResponseText = await getGeminiResponse(textInput, specificLevel, fileInput);
      const aiMsg = { id: Date.now() + 1, sender: "ai", text: aiResponseText };

      setChats((prev) => prev.map((chat) => 
        chat.id === selectedChatId 
          ? { ...chat, messages: [...chat.messages, aiMsg] } 
          : chat
      ));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING ---
  if (!user) {
    return <Onboarding onSave={handleRegister} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left" style={{ cursor: "pointer" }} onClick={() => setPage("chat")}>
          <img src={logo} alt="MentorkuAI" className="app-logo" />
          <span className="app-title">MentorkuAI</span>
        </div>
        
        <div className="app-header-right">
          <button className="icon-btn" onClick={() => setSettingsOpen((o) => !o)}>⚙</button>
          {settingsOpen && (
            <div className="settings-menu">
              <div className="settings-user">
                <div className="settings-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="settings-name">{user.name}</div>
                  <div className="settings-username">{user.level}</div>
                </div>
              </div>
              <hr />
              <div className="settings-actions">
                <button className="settings-btn" onClick={() => { setSettingsOpen(false); setPage("profile"); }}>Profil Saya</button>
                <button className="settings-btn logout" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {page === "chat" ? (
        <ChatLayout
          logsOpen={logsOpen} setLogsOpen={setLogsOpen} 
          messages={currentMessages} onSendMessage={handleSendMessage} 
          input={input} setInput={setInput} isLoading={isLoading} 
          chats={chats} selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId} onNewChat={handleNewChat} onDeleteChat={handleDeleteChat}
          level={user.level} user={user}
        />
      ) : (
        <ProfilePage user={user} onBack={() => setPage("chat")} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount}/>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./styles/main.css";
import logo from "./assets/logofixx.png"; // Error 'logo' solved (dipakai di Header)
import { getGeminiResponse } from "./services/geminiService";
import Login from "./Login";
import Onboarding from "./Onboarding";

// --- HELPER PARSING JSON ---
const parseAIResponse = (text) => {
  const jsonRegex = /~~~json([\s\S]*?)~~~$/;
  const match = text.match(jsonRegex);

  if (match) {
    try {
      const jsonString = match[1];
      const quizData = JSON.parse(jsonString);
      const cleanText = text.replace(jsonRegex, "").trim();
      return { text: cleanText, quiz: quizData, originalText: text };
    } catch (e) {
      console.error("Gagal parse JSON quiz:", e);
      return { text: text, quiz: null, originalText: text };
    }
  }
  return { text: text, quiz: null, originalText: text };
};

const calculateCurrentStatus = (userData) => {
  if (!userData) return null;
  const now = new Date();
  const registeredDate = new Date(userData.registeredAt);
  let yearDiff = now.getFullYear() - registeredDate.getFullYear();
  let currentGrade = userData.grade + yearDiff;
  let level = "UMUM";
  if (currentGrade >= 1 && currentGrade <= 6) level = "SD";
  else if (currentGrade >= 7 && currentGrade <= 9) level = "SMP";
  else if (currentGrade >= 10 && currentGrade <= 12) level = "SMA";
  else level = "MAHASISWA"; 
  return { ...userData, currentGrade, level };
};

// --- CHAT LAYOUT ---
function ChatLayout({ 
  logsOpen, setLogsOpen, messages, onSendMessage, input, setInput, isLoading,
  chats, selectedChatId, setSelectedChatId, onNewChat, onDeleteChat, level, user,
  socraticMode, setSocraticMode 
  // 'onRenameChat' dihapus dari sini karena tidak dipakai di UI
}) {
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState({}); 

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, isLoading, attachment]);

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input, attachment);
    setInput(""); 
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQuizOptionClick = (messageId, option) => {
    if (answeredQuizzes[messageId] || isLoading) return;
    setAnsweredQuizzes(prev => ({ ...prev, [messageId]: option.label }));
    const userText = `Saya memilih jawaban ${option.label}: "${option.text}"`;
    onSendMessage(userText, null);
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      <div className="chat-section">
        <div className="chat-panel">
          <div className="chat-header-actions" style={{display:'flex', justifyContent:'space-between', padding:'0 10px', marginBottom:'20px'}}>
             <div className="chat-greeting">
                Hi, {user.name}! 👋 <br/>
                <span style={{fontSize: "14px", color: "#555"}}>Tutor AI - Kelas {user.currentGrade} ({level})</span>
             </div>
             <div className="mode-toggle" style={{display:'flex', alignItems:'center', gap:'8px', background:'#f0f9ff', padding:'6px 12px', borderRadius:'20px'}}>
                <span style={{fontSize:'12px', fontWeight:'bold', color: socraticMode ? '#0284c7' : '#64748b'}}>{socraticMode ? "🧠 Tutor" : "⚡ Cepat"}</span>
                <label className="switch" style={{position:'relative', display:'inline-block', width:'34px', height:'20px'}}>
                   <input type="checkbox" checked={socraticMode} onChange={() => setSocraticMode(!socraticMode)} style={{opacity:0, width:0, height:0}}/>
                   <span className="slider round" style={{position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, backgroundColor: socraticMode ? '#0ea5e9' : '#cbd5e1', transition:'.4s', borderRadius:'34px'}}>
                      <span style={{position:'absolute', content:"", height:'14px', width:'14px', left:'3px', bottom:'3px', backgroundColor:'white', transition:'.4s', borderRadius:'50%', transform: socraticMode ? 'translateX(14px)' : 'translateX(0)'}}></span>
                   </span>
                </label>
             </div>
          </div>

          <div className="chat-messages">
             {messages.length === 0 && <div className="chat-bubble ai">Mau tanya materi apa hari ini?</div>}
             
             {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender === "user" ? "user" : "ai"}`}>
                {m.fileName && <div className="file-indicator">📎 {m.fileName}</div>}
                
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>

                {m.sender === "ai" && m.quiz && (
                  <div className="quiz-container" style={{marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px"}}>
                    <div style={{fontSize: "0.9em", fontWeight: "bold", marginBottom: "5px"}}>Pilih Jawaban:</div>
                    {m.quiz.options.map((opt, idx) => {
                        const isSelected = answeredQuizzes[m.id] === opt.label;
                        const isAnswered = !!answeredQuizzes[m.id];
                        return (
                          <button 
                            key={idx}
                            onClick={() => handleQuizOptionClick(m.id, opt)}
                            disabled={isAnswered}
                            className={`quiz-option-btn ${isSelected ? "selected" : ""}`}
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              background: isSelected ? "#07acd6" : "white",
                              color: isSelected ? "white" : "#333",
                              cursor: isAnswered ? "default" : "pointer",
                              textAlign: "left",
                              transition: "0.2s"
                            }}
                          >
                            <strong>{opt.label}.</strong> {opt.text}
                          </button>
                        );
                    })}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="chat-bubble ai"><em>Sedang berpikir... 🤖</em></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper">
            {attachment && (
              <div className="attachment-preview"><span className="attachment-name">📄 {attachment.name}</span><button className="attachment-remove" onClick={() => {setAttachment(null); if(fileInputRef.current) fileInputRef.current.value=""}}>✕</button></div>
            )}
            <div className="chat-input-bar">
              <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files[0])} style={{display: "none"}} />
              <button className="icon-btn attach-btn" onClick={() => fileInputRef.current.click()}>📎</button>
              <input className="chat-input-field" placeholder="Tulis pertanyaan..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendClick()} disabled={isLoading} />
              <button className="chat-send-btn" onClick={handleSendClick} disabled={isLoading}>{isLoading ? "..." : "Kirim"}</button>
            </div>
          </div>
        </div>
        {!logsOpen && <button className="icon-btn logs-toggle-floating" onClick={() => setLogsOpen(true)}>❯</button>}
      </div>

      <div className="logs-section">
        <div className="logs-panel">
            <div className="logs-header">
                <div className="logs-title">Riwayat Chat</div>
                <div className="logs-buttons"><button className="new-chat-btn" onClick={onNewChat}>+ Baru</button><button className="icon-btn" onClick={() => setLogsOpen(false)}>❮</button></div>
            </div>
            <div className="logs-list">
            {chats.map((chat) => (
              <div key={chat.id} className={"log-item " + (chat.id === selectedChatId ? "active" : "")} onClick={() => setSelectedChatId(chat.id)}>
                 <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px'}}>{chat.title}</span>
                 <button className="log-delete-btn" onClick={(e) => {e.stopPropagation(); onDeleteChat(chat.id)}}>🗑</button>
              </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}

// --- PROFILE PAGE (Dikembalikan agar setPage tidak error) ---
function ProfilePage({ user, onBack, onLogout, onDeleteAccount, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGrade, setEditedGrade] = useState(user.currentGrade);

  const handleSave = () => {
    if(editedName && editedGrade) {
        onUpdateProfile({ name: editedName, currentGrade: editedGrade });
        setIsEditing(false);
    }
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-header-nav">
        <button onClick={onBack} className="back-btn">← Kembali</button>
      </div>
      <div className="profile-card">
        {isEditing ? (
            <div className="profile-edit-form">
                <h3>Edit Profil</h3>
                <input className="form-input" value={editedName} onChange={e=>setEditedName(e.target.value)} placeholder="Nama" />
                <select className="form-input" value={editedGrade} onChange={e=>setEditedGrade(e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Kelas {g}</option>)}
                </select>
                <button className="save-btn" onClick={handleSave}>Simpan</button>
                <button className="cancel-btn" onClick={()=>setIsEditing(false)}>Batal</button>
            </div>
        ) : (
            <>
                <div className="profile-top">
                    <div className="profile-avatar-large">{user.name.charAt(0).toUpperCase()}</div>
                    <h2>{user.name}</h2>
                    <p>{user.level}</p>
                </div>
                <div className="profile-actions">
                    <button className="edit-profile-btn" onClick={()=>setIsEditing(true)}>Edit Profil</button>
                    <button className="action-btn logout-btn" onClick={onLogout}>Logout</button>
                    <button className="action-btn delete-btn" onClick={onDeleteAccount}>Hapus Akun</button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [authState, setAuthState] = useState(null); 
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]); 
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [socraticMode, setSocraticMode] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [page, setPage] = useState("chat"); // Error setPage solved (dipakai di Header)
  const [settingsOpen, setSettingsOpen] = useState(false); // State untuk dropdown menu

  // Load Initial Data
  useEffect(() => {
    const savedAuthState = localStorage.getItem("tutor_currentUser");
    const savedUserSession = localStorage.getItem("mentorku-active-session");
    if (savedAuthState && savedUserSession) {
        const authData = JSON.parse(savedAuthState);
        setAuthState(authData);
        const userData = JSON.parse(savedUserSession);
        setUser(calculateCurrentStatus(userData));
        
        const storageKey = `mentorku-data-${authData.userId}`;
        const savedData = localStorage.getItem(storageKey);
        if(savedData) {
            const parsed = JSON.parse(savedData);
            setChats(parsed.chats || []);
            setSelectedChatId(parsed.selectedChatId);
        } else {
            const newId = Date.now();
            setChats([{ id: newId, title: "Chat Baru", messages: [] }]);
            setSelectedChatId(newId);
        }
    }
  }, []);

  // Auto Save
  useEffect(() => {
    if (user && authState && chats.length > 0) {
      const storageKey = `mentorku-data-${authState.userId}`;
      const dataToSave = { chats, selectedChatId };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [chats, selectedChatId]);

  const handleSendMessage = async (textInput, fileInput) => {
    const activeChat = chats.find(c => c.id === selectedChatId);
    if (!activeChat) return;

    const userMsg = { id: Date.now(), sender: "user", text: textInput, fileName: fileInput ? fileInput.name : null };
    
    let updatedChats = chats.map(chat => 
        chat.id === selectedChatId 
        ? { ...chat, messages: [...chat.messages, userMsg], title: chat.messages.length === 0 ? textInput.substring(0, 20) : chat.title } 
        : chat
    );
    setChats(updatedChats);
    setIsLoading(true);

    try {
      const specificLevel = `Kelas ${user.currentGrade} (${user.level})`;
      const currentHistory = activeChat.messages; 

      const rawAiResponse = await getGeminiResponse(textInput, specificLevel, fileInput, socraticMode, currentHistory);
      
      const { text, quiz, originalText } = parseAIResponse(rawAiResponse);

      const aiMsg = { 
          id: Date.now() + 1, 
          sender: "ai", 
          text: text,        
          originalText: originalText, 
          quiz: quiz         
      };

      setChats(prev => prev.map(chat => 
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

  const handleNewChat = () => {
    const newId = Date.now();
    setChats(prev => [{ id: newId, title: "Chat Baru", messages: [] }, ...prev]);
    setSelectedChatId(newId);
  };

  const handleDeleteChat = (id) => {
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if(selectedChatId === id) setSelectedChatId(newChats[0]?.id || null);
  };

  const handleUpdateProfile = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem("mentorku-active-session", JSON.stringify(newUserData));
  };

  const handleLogout = () => {
    localStorage.removeItem("tutor_currentUser");
    localStorage.removeItem("mentorku-active-session");
    window.location.reload();
  }; // Error handleLogout solved (dipakai di Header)

  const handleDeleteAccount = () => {
    if(confirm(`Yakin hapus akun ${user.name}?`)) {
        localStorage.removeItem(`mentorku-data-${authState.userId}`);
        handleLogout();
    }
  };

  if (!authState) return <Login onLoginSuccess={(data) => { setAuthState(data); localStorage.setItem("tutor_currentUser", JSON.stringify(data)); }} />;
  if (!user) return <Onboarding onSave={(data) => { setUser(calculateCurrentStatus(data)); localStorage.setItem("mentorku-active-session", JSON.stringify(data)); }} userId={authState.userId} username={authState.username} />;

  return (
    <div className="app-shell">
      {/* HEADER DIKEMBALIKAN AGAR VARIABEL logo, setPage, handleLogout TERPAKAI */}
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
            messages={chats.find(c => c.id === selectedChatId)?.messages || []}
            onSendMessage={handleSendMessage}
            input={input} setInput={setInput} isLoading={isLoading}
            chats={chats} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId}
            onNewChat={handleNewChat} onDeleteChat={handleDeleteChat}
            level={user.level} user={user}
            socraticMode={socraticMode} setSocraticMode={setSocraticMode}
        />
      ) : (
        <ProfilePage 
            user={user} 
            onBack={() => setPage("chat")} 
            onLogout={handleLogout} 
            onDeleteAccount={handleDeleteAccount} 
            onUpdateProfile={handleUpdateProfile}
        />
      )}
    </div>
  );
}
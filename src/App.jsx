// App.jsx
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./styles/main.css";
import logo from "./assets/logofixx.png";
import { getGeminiResponse, generateQuizFromAI, getReportAnalysis } from "./services/geminiService"; 
import Login from "./Login";
import Onboarding from "./Onboarding";

// --- HELPER ---
const parseAIResponse = (text) => {
  const jsonRegex = /~~~json([\s\S]*?)~~~$/;
  const match = text.match(jsonRegex);
  if (match) {
    try {
      return { text: text.replace(jsonRegex, "").trim(), quiz: JSON.parse(match[1]), originalText: text };
    } catch (e) { 
      console.error("JSON Parse Error:", e); // [FIX] Variabel 'e' digunakan untuk logging
      return { text, quiz: null, originalText: text }; 
    }
  }
  return { text, quiz: null, originalText: text };
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

// --- HALAMAN 1: CHAT LAYOUT ---
function ChatView({ 
  logsOpen, setLogsOpen, messages, onSendMessage, input, setInput, isLoading,
  chats, selectedChatId, setSelectedChatId, onNewChat, onDeleteChat, level, user,
  socraticMode, setSocraticMode 
}) {
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState({}); 

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading, attachment]);

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input, attachment);
    setInput(""); setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQuizOptionClick = (messageId, option) => {
    if (answeredQuizzes[messageId] || isLoading) return;
    setAnsweredQuizzes(prev => ({ ...prev, [messageId]: option.label }));
    onSendMessage(`Saya memilih jawaban ${option.label}: "${option.text}"`, null);
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      <div className="chat-section">
        <div className="chat-panel" style={{paddingBottom: '80px'}}> 
          <div className="chat-header-actions" style={{display:'flex', justifyContent:'space-between', padding:'0 10px', marginBottom:'20px'}}>
             <div className="chat-greeting">
                Hi, {user.name}! 👋 <br/>
                <span style={{fontSize: "14px", color: "#555"}}>Tutor AI - Kelas {user.currentGrade} ({level})</span>
             </div>
             <div className="mode-toggle" style={{display:'flex', alignItems:'center', gap:'8px', background:'#f0f9ff', padding:'6px 12px', borderRadius:'20px'}}>
                <span style={{fontSize:'12px', fontWeight:'bold', color: socraticMode ? '#0284c7' : '#64748b'}}>{socraticMode ? "🧠 Tutor" : "⚡ Cepat"}</span>
                <label className="switch" style={{position:'relative', display:'inline-block', width:'34px', height:'20px'}}>
                   <input type="checkbox" checked={socraticMode} onChange={() => setSocraticMode(!socraticMode)} style={{opacity:0, width:0, height:0}}/>
                   <span className="slider round" style={{position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, backgroundColor: socraticMode ? '#0ea5e9' : '#cbd5e1', transition:'.4s', borderRadius:'34px'}}><span style={{position:'absolute', content:"", height:'14px', width:'14px', left:'3px', bottom:'3px', backgroundColor:'white', transition:'.4s', borderRadius:'50%', transform: socraticMode ? 'translateX(14px)' : 'translateX(0)'}}></span></span>
                </label>
             </div>
          </div>

          <div className="chat-messages">
             {messages.length === 0 && <div className="chat-bubble ai">Mau tanya materi apa hari ini?</div>}
             {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender === "user" ? "user" : "ai"}`}>
                {m.fileName && <div className="file-indicator">📎 {m.fileName}</div>}
                <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>
                {m.sender === "ai" && m.quiz && (
                  <div className="quiz-container" style={{marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px"}}>
                    <div style={{fontSize: "0.9em", fontWeight: "bold", marginBottom: "5px"}}>Pilih Jawaban:</div>
                    {m.quiz.options.map((opt, idx) => (
                          <button key={idx} onClick={() => handleQuizOptionClick(m.id, opt)} disabled={!!answeredQuizzes[m.id]} className={`quiz-option-btn ${answeredQuizzes[m.id] === opt.label ? "selected" : ""}`} style={{padding: "10px", border: "1px solid #ddd", borderRadius: "8px", background: answeredQuizzes[m.id] === opt.label ? "#07acd6" : "white", color: answeredQuizzes[m.id] === opt.label ? "white" : "#333", cursor: "pointer", textAlign: "left"}}><strong>{opt.label}.</strong> {opt.text}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="chat-bubble ai"><em>Sedang berpikir... 🤖</em></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper" style={{bottom: '70px'}}> 
            {attachment && <div className="attachment-preview"><span className="attachment-name">📄 {attachment.name}</span><button className="attachment-remove" onClick={() => {setAttachment(null); if(fileInputRef.current) fileInputRef.current.value=""}}>✕</button></div>}
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
            <div className="logs-header"><div className="logs-title">Riwayat</div><div className="logs-buttons"><button className="new-chat-btn" onClick={onNewChat}>+</button><button className="icon-btn" onClick={() => setLogsOpen(false)}>❮</button></div></div>
            <div className="logs-list">
            {chats.map((chat) => (
              <div key={chat.id} className={"log-item " + (chat.id === selectedChatId ? "active" : "")} onClick={() => setSelectedChatId(chat.id)}>
                 <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px'}}>{chat.title}</span><button className="log-delete-btn" onClick={(e) => {e.stopPropagation(); onDeleteChat(chat.id)}}>🗑</button>
              </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}

// --- HALAMAN 2: QUIZ & BAKAT ---
function QuizView({ user, onSaveResult }) {
    const [step, setStep] = useState("menu"); 
    const [quizData, setQuizData] = useState([]);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [subject, setSubject] = useState("");

    const startQuiz = async (selectedSubject, topic) => {
        setSubject(selectedSubject);
        setStep("loading");
        const data = await generateQuizFromAI(user.currentGrade, user.level, selectedSubject, topic);
        if(data && data.length > 0) {
            setQuizData(data);
            setStep("quiz");
            setAnswers({});
        } else {
            alert("Gagal membuat soal. Coba lagi.");
            setStep("menu");
        }
    };

    const handleAnswer = (qIndex, optIndex) => {
        setAnswers({ ...answers, [qIndex]: optIndex });
    };

    const finishQuiz = () => {
        let correctCount = 0;
        quizData.forEach((q, idx) => {
            if (answers[idx] === q.correctIndex) correctCount++;
        });
        const finalScore = Math.round((correctCount / quizData.length) * 100);
        setScore(finalScore);
        setStep("result");

        onSaveResult({
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            subject: subject,
            topic: quizData[0]?.topic || "Umum", 
            score: finalScore,
            total: quizData.length
        });
    };

    if (step === "loading") return <div className="center-screen"><h3>🔄 Sedang meminta soal ke AI...</h3><p>Mohon tunggu sebentar ya, {user.name}!</p></div>;

    if (step === "result") return (
        <div className="quiz-result-card fade-in">
            <h2>🎉 Hasil Kuis {subject}</h2>
            <div className="score-circle">{score}</div>
            <p>{score > 75 ? "Luar biasa! Pertahankan! 🌟" : "Tetap semangat belajar ya! 💪"}</p>
            <button className="main-btn" onClick={() => setStep("menu")}>Kembali ke Menu</button>
        </div>
    );

    if (step === "quiz") return (
        <div className="quiz-taking-area fade-in">
            <div className="quiz-header">
                <h3>Uji Kemampuan: {subject}</h3>
                <span>{Object.keys(answers).length}/{quizData.length} Soal</span>
            </div>
            {quizData.map((q, idx) => (
                <div key={idx} className="quiz-card">
                    <p className="quiz-question">
                        <strong>{idx + 1}.</strong> {q.question}
                    </p>
                    <div className="quiz-options">
                        {q.options.map((opt, optIdx) => {
                            // [FIX] Defensive coding: Pastikan opt adalah string agar tidak BLANK
                            // Kadang AI mengembalikan object {text: "..."}
                            const label = typeof opt === 'object' ? (opt.text || opt.label || JSON.stringify(opt)) : opt;
                            
                            return (
                                <button 
                                    key={optIdx} 
                                    className={`option-btn ${answers[idx] === optIdx ? "selected" : ""}`}
                                    onClick={() => handleAnswer(idx, optIdx)}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {Object.keys(answers).length === quizData.length && (
                <button className="finish-btn" onClick={finishQuiz}>Selesai & Lihat Nilai</button>
            )}
        </div>
    );

    return (
        <div className="quiz-menu fade-in">
            <h2>🧠 Pusat Evaluasi</h2>
            <p>Pilih tes untuk mengukur kemampuanmu.</p>
            
            <div className="menu-grid">
                <div className="menu-card" onClick={() => startQuiz("Matematika", "Umum")}>
                    <span className="icon">📐</span>
                    <h3>Matematika</h3>
                    <p>Tes hitungan & logika</p>
                </div>
                <div className="menu-card" onClick={() => startQuiz("IPA (Sains)", "Umum")}>
                    <span className="icon">🧬</span>
                    <h3>Sains / IPA</h3>
                    <p>Alam & makhluk hidup</p>
                </div>
                <div className="menu-card" onClick={() => startQuiz("Bahasa Inggris", "Grammar & Vocab")}>
                    <span className="icon">🇬🇧</span>
                    <h3>B. Inggris</h3>
                    <p>Vocabulary & Grammar</p>
                </div>
                <div className="menu-card special" onClick={() => startQuiz("Minat Bakat", "Psikotes Hobi")}>
                    <span className="icon">🎨</span>
                    <h3>Tes Minat Bakat</h3>
                    <p>Cari tahu potensimu!</p>
                </div>
            </div>
        </div>
    );
}

// --- HALAMAN 3: RAPORT VIEW ---
function ReportView({ history, user }) {
    const [selectedSubject, setSelectedSubject] = useState("Semua");
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Filter Data berdasarkan Mapel
    const filteredHistory = selectedSubject === "Semua" 
        ? history 
        : history.filter(h => h.subject === selectedSubject);

    // 2. Ambil list Mapel unik untuk Dropdown
    const subjects = ["Semua", ...new Set(history.map(h => h.subject))];

    // 3. Hitung Statistik Sederhana
    const averageScore = filteredHistory.length > 0 
        ? Math.round(filteredHistory.reduce((acc, curr) => acc + curr.score, 0) / filteredHistory.length) 
        : 0;
    
    const bestScore = filteredHistory.length > 0 
        ? Math.max(...filteredHistory.map(h => h.score)) 
        : 0;

    // 4. Fungsi Minta Analisis AI
    const handleAnalyze = async () => {
        if (selectedSubject === "Semua") {
            alert("Pilih satu mata pelajaran spesifik dulu (misal: Matematika) untuk dianalisis.");
            return;
        }
        if (filteredHistory.length < 2) { // Minimal 2 kuis biar ada tren
            alert("Kerjakan minimal 2 kuis di mapel ini agar AI bisa membaca tren nilaimu.");
            return;
        }

        setIsAnalyzing(true);
        const result = await getReportAnalysis(user.name, user.currentGrade, selectedSubject, filteredHistory);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="report-page fade-in">
            <div className="report-header-print"> {/* Header khusus cetak */}
                <h1>RAPORT KEMAJUAN BELAJAR</h1>
                <p>MentorkuAI - Personalized Learning System</p>
                <hr/>
            </div>

            <div className="report-controls">
                <h2>📊 Statistik Belajar</h2>
                <select 
                    value={selectedSubject} 
                    onChange={(e) => { setSelectedSubject(e.target.value); setAnalysis(null); }}
                    className="subject-select"
                >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="label">Rata-Rata</span>
                    <span className="value">{averageScore}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Tertinggi</span>
                    <span className="value">{bestScore}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Total Kuis</span>
                    <span className="value">{filteredHistory.length}</span>
                </div>
            </div>

            {/* TABLE HISTORY */}
            <div className="history-section">
                <h3>Riwayat Kuis ({selectedSubject})</h3>
                {filteredHistory.length === 0 ? (
                    <div className="empty-state">Belum ada data. Yuk kerjakan kuis!</div>
                ) : (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Topik/Materi</th>
                                <th>Skor</th>
                                <th>Ket.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((h) => (
                                <tr key={h.id}>
                                    <td>{h.date}</td>
                                    <td>{h.topic || h.subject}</td> {/* Fallback jika topic kosong */}
                                    <td>
                                        <span className={`score-badge ${h.score >= 75 ? 'good' : 'bad'}`}>
                                            {h.score}
                                        </span>
                                    </td>
                                    <td>{h.score >= 75 ? "Tuntas" : "Remedial"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* AI ANALYSIS SECTION */}
            {selectedSubject !== "Semua" && filteredHistory.length > 0 && (
                <div className="analysis-section">
                    <button 
                        className="analyze-btn" 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? "🤖 Sedang Menganalisis..." : "✨ Analisis Kemampuan Saya (AI)"}
                    </button>

                    {analysis && (
                        <div className="ai-report-card fade-in">
                            <h3>📝 Evaluasi Mentor AI: {selectedSubject}</h3>
                            <div className="analysis-grid">
                                <div className="analysis-item strength">
                                    <h4>💪 Keunggulan (Materi Dikuasai)</h4>
                                    <p>{analysis.strength}</p>
                                </div>
                                <div className="analysis-item weakness">
                                    <h4>⚠️ Perlu Peningkatan</h4>
                                    <p>{analysis.weakness}</p>
                                </div>
                                <div className="analysis-item advice">
                                    <h4>💡 Saran Belajar</h4>
                                    <p>{analysis.advice}</p>
                                </div>
                                <div className="analysis-item prediction">
                                    <h4>🚀 Prediksi Potensi</h4>
                                    <p>{analysis.prediction}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <button className="print-btn" onClick={() => window.print()}>🖨️ Download PDF Raport</button>
        </div>
    );
}

// --- HALAMAN 4: PROFILE ---
function ProfileView({ user, onLogout, onDeleteAccount, onUpdateProfile }) {
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
  
  // NAVIGATION STATE
  const [page, setPage] = useState("chat"); 
  const [quizHistory, setQuizHistory] = useState([]); 

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
            setQuizHistory(parsed.quizHistory || []); 
        } else {
            const newId = Date.now();
            setChats([{ id: newId, title: "Chat Baru", messages: [] }]);
            setSelectedChatId(newId);
        }
    }
  }, []);

  // Auto Save
  useEffect(() => {
    if (user && authState) {
      const storageKey = `mentorku-data-${authState.userId}`;
      const dataToSave = { chats, selectedChatId, quizHistory }; 
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [chats, selectedChatId, quizHistory]);

  const handleSendMessage = async (textInput, fileInput) => {
    const activeChat = chats.find(c => c.id === selectedChatId);
    if (!activeChat) return;
    const userMsg = { id: Date.now(), sender: "user", text: textInput, fileName: fileInput ? fileInput.name : null };
    let updatedChats = chats.map(chat => chat.id === selectedChatId ? { ...chat, messages: [...chat.messages, userMsg], title: chat.messages.length === 0 ? textInput.substring(0, 20) : chat.title } : chat);
    setChats(updatedChats);
    setIsLoading(true);
    try {
      const specificLevel = `Kelas ${user.currentGrade} (${user.level})`;
      const rawAiResponse = await getGeminiResponse(textInput, specificLevel, fileInput, socraticMode, activeChat.messages);
      const { text, quiz, originalText } = parseAIResponse(rawAiResponse);
      const aiMsg = { id: Date.now() + 1, sender: "ai", text, originalText, quiz };
      setChats(prev => prev.map(chat => chat.id === selectedChatId ? { ...chat, messages: [...chat.messages, aiMsg] } : chat));
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleSaveQuizResult = (result) => {
      setQuizHistory(prev => [result, ...prev]);
  };

  const handleLogout = () => { localStorage.removeItem("tutor_currentUser"); localStorage.removeItem("mentorku-active-session"); window.location.reload(); };

  if (!authState) return <Login onLoginSuccess={(data) => { setAuthState(data); localStorage.setItem("tutor_currentUser", JSON.stringify(data)); }} />;
  if (!user) return <Onboarding onSave={(data) => { setUser(calculateCurrentStatus(data)); localStorage.setItem("mentorku-active-session", JSON.stringify(data)); }} userId={authState.userId} username={authState.username} />;

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left" onClick={() => setPage("chat")}>
          <img src={logo} alt="MentorkuAI" className="app-logo" /> <span className="app-title">MentorkuAI</span>
        </div>
        <div className="app-header-right">
             <div className="user-badge" onClick={() => setPage("profile")}>
                <div className="avatar-small">{user.name.charAt(0)}</div>
                <span>{user.name}</span>
             </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="content-area">
        {page === "chat" && <ChatView logsOpen={logsOpen} setLogsOpen={setLogsOpen} messages={chats.find(c => c.id === selectedChatId)?.messages || []} onSendMessage={handleSendMessage} input={input} setInput={setInput} isLoading={isLoading} chats={chats} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} onNewChat={()=>{const newId=Date.now();setChats(prev=>[{id:newId,title:"Chat Baru",messages:[]},...prev]);setSelectedChatId(newId)}} onDeleteChat={(id)=>{const n=chats.filter(c=>c.id!==id);setChats(n);if(selectedChatId===id)setSelectedChatId(n[0]?.id||null)}} level={user.level} user={user} socraticMode={socraticMode} setSocraticMode={setSocraticMode} />}
        {page === "quiz" && <QuizView user={user} onSaveResult={handleSaveQuizResult} />}
        {page === "report" && <ReportView history={quizHistory} user={user} />}
        {page === "profile" && <ProfileView user={user} onLogout={handleLogout} onDeleteAccount={()=>{if(confirm('Hapus?')){localStorage.removeItem(`mentorku-data-${authState.userId}`);handleLogout()}}} onUpdateProfile={(u)=>{setUser({...user,...u});localStorage.setItem("mentorku-active-session",JSON.stringify({...user,...u}))}} />}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav">
          <button className={`nav-item ${page === "chat" ? "active" : ""}`} onClick={() => setPage("chat")}>
              <span className="icon">💬</span> Chat
          </button>
          <button className={`nav-item ${page === "quiz" ? "active" : ""}`} onClick={() => setPage("quiz")}>
              <span className="icon">📝</span> Uji Kemampuan
          </button>
          <button className={`nav-item ${page === "report" ? "active" : ""}`} onClick={() => setPage("report")}>
              <span className="icon">📊</span> Raport
          </button>
      </nav>
    </div>
  );
}
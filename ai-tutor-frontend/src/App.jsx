import { useState } from "react";
import "./App.css";

export default function App() {
  const [level, setLevel] = useState("SD");
  const [question, setQuestion] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* TITLE */}
        <h1 style={styles.title}>AI Tutor</h1>
        <p style={styles.subtitle}>Belajar jadi lebih mudah 📚</p>

        {/* LEVEL SELECTOR */}
        <div style={styles.levelSelector}>
          {["SD", "SMP", "SMA"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              style={{
                ...styles.levelButton,
                backgroundColor: level === lvl ? "#4f46e5" : "#1f2937",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* CHAT CARD */}
        <div style={styles.chatCard}>
          <h2 style={styles.cardTitle}>Tutor AI — {level}</h2>
          <p style={styles.cardText}>
            Halo! Aku Tutor AI kamu. Mau belajar apa hari ini? 😊
          </p>

          {/* INPUT AREA */}
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="Tanya sesuatu..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button style={styles.sendButton}>Kirim</button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#0f0f0f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",  // ⭐ NEW — bikin ke tengah
    padding: "40px 20px",
    color: "#fff",
  },
  container: {
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
  },
  title: {
    fontSize: "48px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#9ca3af",
    marginBottom: "30px",
  },
  levelSelector: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "30px",
  },
  levelButton: {
    padding: "10px 20px",
    borderRadius: "12px",
    fontSize: "16px",
    border: "none",
    color: "white",
    cursor: "pointer",
    transition: "0.2s",
  },
  chatCard: {
    backgroundColor: "#1a1a1a",
    padding: "25px",
    borderRadius: "16px",
    textAlign: "left",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
  },
  cardTitle: {
    fontSize: "22px",
    marginBottom: "8px",
  },
  cardText: {
    fontSize: "16px",
    color: "#d1d5db",
    marginBottom: "20px",
  },
  inputRow: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "12px 15px",
    borderRadius: "10px",
    border: "1px solid #3f3f46",
    backgroundColor: "#111",
    color: "#fff",
    fontSize: "15px",
  },
  sendButton: {
    padding: "12px 20px",
    backgroundColor: "#4f46e5",
    color: "white",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    transition: "0.2s",
  },
};

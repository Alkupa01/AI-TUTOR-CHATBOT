// 1. IMPORT DARI ENV
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 2. MODEL GEMINI 2.5 (Sesuai Log Akun Kamu)
const MODEL_NAME = "gemini-2.5-flash";

const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const getGeminiResponse = async (userMessage, level, attachmentFile, isSocratic = true, history = []) => {
  try {
    // --- 1. RAKIT PROMPT ---
    const noLatexRule = `JANGAN gunakan format LaTeX/Dollar ($). Tulis matematika dengan teks biasa.`;
    
    let specificInstruction = "";
    if (level.includes("SD")) {
        specificInstruction = `
        TARGET: Anak SD. Gaya: Ceria, Emoji 🌟.
        METODE:
        1. Gunakan perumpamaan/cerita.
        2. JANGAN beri jawaban langsung.
        3. JIKA INGIN MEMBERI KUIS, GUNAKAN FORMAT JSON DI BAWAH.
        `;
    } else if (level.includes("SMP")) {
        specificInstruction = `TARGET: SMP. Gaya: Gaul, Mentor. Gunakan analogi game/hobi.`;
    } else {
        specificInstruction = `TARGET: SMA/Kuliah. Gaya: Logis, Kritis.`;
    }

    const coreInstruction = isSocratic 
        ? "PERAN: Tutor Socratic. JANGAN beri jawaban langsung. Bimbing siswa step-by-step."
        : "PERAN: Asisten Pintar. Jawab langsung.";

    const jsonRule = `
    PENTING: Jika kamu memberikan pertanyaan pilihan ganda (Quiz), 
    AKHIRI responmu dengan blok kode khusus ini:
    
    ~~~json
    {
      "isQuiz": true,
      "question": "Inti pertanyaan singkat",
      "options": [
        {"label": "A", "text": "Teks jawaban A", "isCorrect": false},
        {"label": "B", "text": "Teks jawaban B", "isCorrect": true},
        {"label": "C", "text": "Teks jawaban C", "isCorrect": false},
        {"label": "D", "text": "Teks jawaban D", "isCorrect": false}
      ]
    }
    ~~~
    `;

    const systemPrompt = `${coreInstruction}\nTarget: ${level}\n${specificInstruction}\n${noLatexRule}\n${jsonRule}`;

    // --- 2. SUSUN HISTORY ---
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.originalText || msg.text }]
    }));

    const currentParts = [{ text: `[SYSTEM: ${systemPrompt}]\n\nUser: ${userMessage}` }];

    if (attachmentFile) {
      const base64Data = await fileToBase64(attachmentFile);
      currentParts.push({
        inline_data: { mime_type: attachmentFile.type, data: base64Data }
      });
    }

    const contents = [
      ...recentHistory,
      { role: "user", parts: currentParts }
    ];

    // --- 3. KIRIM REQUEST ---
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: contents })
    });

    const data = await response.json();

    // --- 4. HANDLE ERROR (TERMASUK LIMIT) ---
    if (!response.ok) {
      console.error("API Error Detail:", data);
      
      // ERROR 429 = LIMIT HABIS
      if (response.status === 429) {
        return "⏳ **Waduh, kita ngobrolnya terlalu cepat!** AI-nya butuh napas dulu nih. Tunggu sekitar 1 menit ya, baru tanya lagi! (Limit Kuota Gratis)";
      }

      return `⚠️ Gagal (Error ${response.status}): ${data.error?.message || "Unknown error"}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI diam saja.";

  } catch (error) {
    return `Koneksi bermasalah: ${error.message}`;
  }
};
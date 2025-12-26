import { GoogleGenerativeAI } from "@google/generative-ai";
import kurikulum from "../data/kurikulum.json";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Pastikan .env sudah benar
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Helper: Mengubah File object menjadi format yang bisa dibaca Gemini
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1]; // Hapus header data:image/png;base64,...
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper: Ekstrak context relevan dari kurikulum berdasarkan user message
 * (Simple keyword matching)
 */
const extractKurikulumContext = (userMessage, level) => {
  if (!kurikulum[level]) return "";

  const message = userMessage.toLowerCase();
  let relevantTopics = [];

  // Search melalui struktur kurikulum
  const levelData = kurikulum[level];
  
  for (const subject in levelData) {
    const subjectData = levelData[subject];
    
    for (const grade in subjectData) {
      const topics = subjectData[grade];
      
      // Match keywords dalam user message
      topics.forEach(topic => {
        if (message.includes(topic.toLowerCase())) {
          relevantTopics.push(`${subject} (${grade}): ${topic}`);
        }
      });
    }
  }

  if (relevantTopics.length === 0) {
    // Jika tidak ada match spesifik, tampilkan topik umum dari level
    const allTopics = [];
    for (const subject in levelData) {
      for (const grade in levelData[subject]) {
        allTopics.push(...levelData[subject][grade]);
      }
    }
    return `Kurikulum ${level}:\n- ${allTopics.slice(0, 5).join("\n- ")}`;
  }

  return `Topik Kurikulum Relevan:\n- ${relevantTopics.join("\n- ")}`;
};

export const getGeminiResponse = async (userMessage, level, attachmentFile) => {
  try {
    let systemInstruction = "";
    
    // Extract context dari kurikulum (RAG)
    const kurikulumContext = extractKurikulumContext(userMessage, level);

    // Setup Persona dengan instruksi FORMAT yang sangat ketat + RAG Context
    switch (level) {
      case "SD":
        systemInstruction = `Kamu adalah guru SD yang ceria. Jelaskan dengan bahasa sederhana.

KONTEKS KURIKULUM:
${kurikulumContext}

PENTING - IKUTI INSTRUKSI FORMAT BERIKUT DENGAN KETAT:
1. Untuk SETIAP rumus, persamaan, atau variabel: gunakan $tanda$ (contoh: $a$, $x$, $2x+3$)
2. Untuk rumus panjang atau penting: gunakan $$rumus$$ di baris terpisah
3. Untuk tabel: SELALU gunakan format markdown seperti ini:
   | Header 1 | Header 2 |
   | :---: | :---: |
   | Baris 1 | Data 1 |
   | Baris 2 | Data 2 |
4. Pisahkan paragraf dengan baris kosong
5. Jangan pakai LaTeX yang kompleks
6. Pastikan jawaban sesuai dengan standar kurikulum SD`;
        break;
      case "SMP":
        systemInstruction = `Kamu adalah guru SMP yang sabar. Jelaskan dengan bahasa sederhana.

KONTEKS KURIKULUM:
${kurikulumContext}

PENTING - IKUTI INSTRUKSI FORMAT BERIKUT DENGAN KETAT:
1. Untuk SETIAP rumus, persamaan, atau variabel: gunakan $tanda$ (contoh: $a$, $x$, $2x+3$)
2. Untuk rumus panjang atau penting: gunakan $$rumus$$ di baris terpisah
3. Untuk tabel: SELALU gunakan format markdown seperti ini:
   | Header 1 | Header 2 |
   | :---: | :---: |
   | Baris 1 | Data 1 |
   | Baris 2 | Data 2 |
4. Pisahkan paragraf dengan baris kosong
5. Jangan pakai LaTeX yang kompleks
6. Pastikan jawaban sesuai dengan standar kurikulum SMP`;
        break;
      case "SMA":
        systemInstruction = `Kamu adalah mentor SMA. Analitis dan logis.

KONTEKS KURIKULUM:
${kurikulumContext}

INSTRUKSI FORMAT (VERY IMPORTANT):
1. Untuk semua variabel dan rumus: gunakan $variabel$ atau $rumus$ 
2. Untuk persamaan kompleks atau rumus penting: $$\text{rumus kompleks}$$ di baris terpisah
3. Untuk data tabel: FORMAT MARKDOWN YANG TEPAT:
   | Elemen | Nilai |
   | :---: | :---: |
   | a | 2 |
   | b | 3 |
4. Strukturkan dengan heading: ### Bagian Judul
5. SELALU gunakan format ini - jangan gunakan format lain
6. Pastikan jawaban sesuai standar kurikulum SMA`;
        break;
      default:
        systemInstruction = `Kamu adalah asisten belajar.
FORMAT WAJIB: 
- Rumus/variabel: $rumus$
- Tabel markdown dengan | Header | Header |
- Konteks: ${kurikulumContext}`;
    }

    // Siapkan Prompt (Teks + File jika ada)
    const promptParts = [`${systemInstruction}\n\nPertanyaan: ${userMessage}`];

    // Jika ada file attachment, proses dulu jadi Base64 lalu masukkan ke array
    if (attachmentFile) {
      const imagePart = await fileToGenerativePart(attachmentFile);
      promptParts.push(imagePart);
    }

    // Kirim request (bisa array isinya teks & gambar)
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error Gemini:", error);
    return `Maaf, ada error: ${error.message}`;
  }
};
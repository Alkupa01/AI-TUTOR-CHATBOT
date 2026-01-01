import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Gunakan model flash-latest yang cepat dan gratis
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Helper: Mengubah File object menjadi format yang bisa dibaca Gemini
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
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

export const getGeminiResponse = async (userMessage, level, attachmentFile) => {
  try {
    let systemInstruction = "";
    
    // --- ATURAN FORMATTING STRICT (ANTI-LATEX) ---
    // Instruksi ini melarang keras penggunaan simbol $ dan format matematika rumit.
    const noLatexRule = `
      ATURAN FORMATTING PENTING:
      1. JANGAN PERNAH menggunakan simbol LaTeX seperti tanda dollar ($) atau ($$).
      2. JANGAN gunakan backslash (\\) untuk rumus (seperti \\frac, \\times, \\pi).
      3. Tuliskan matematika dengan gaya teks biasa (Plain Text) yang mudah dibaca di HP.
         - SALAH: $\\pi$, $22/7$, $\\times$
         - BENAR: Pi, 22/7, kali, x
      4. Gunakan Markdown standar hanya untuk:
         - **Tebal** (untuk poin penting)
         - *Miring* (untuk istilah asing)
         - List (pakai - atau angka)
         - Judul (pakai ###)
      5. Buat paragraf pendek agar nyaman dibaca.
    `;

    switch (level) {
      case "SD":
        systemInstruction = `Kamu adalah guru SD yang ceria dan penyabar. Jelaskan dengan bahasa yang sangat sederhana, gunakan analogi sehari-hari. ${noLatexRule}`;
        break;
      case "SMP":
        systemInstruction = `Kamu adalah tutor SMP yang asik, gaul, dan seperti teman sendiri. Gunakan bahasa santai tapi tetap sopan. ${noLatexRule}`;
        break;
      case "SMA":
        systemInstruction = `Kamu adalah mentor akademik SMA yang cerdas dan to-the-point. Jelaskan logika dan konsepnya secara mendalam namun praktis. ${noLatexRule}`;
        break;
      default:
        systemInstruction = `Kamu adalah asisten belajar yang membantu. ${noLatexRule}`;
    }

    // Siapkan Prompt
    const promptParts = [`${systemInstruction}\n\nPertanyaan User: ${userMessage}`];

    // Jika ada file attachment
    if (attachmentFile) {
      const imagePart = await fileToGenerativePart(attachmentFile);
      promptParts.push(imagePart);
    }

    // Kirim request
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error Gemini:", error);
    return `Maaf, ada error: ${error.message}`;
  }
};
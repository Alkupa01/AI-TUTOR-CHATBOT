import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex gap-3">
      <input
        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 shadow-sm 
                   text-gray-700 focus:ring-2 focus:ring-indigo-500 
                   focus:outline-none bg-white"
        placeholder="Tanya sesuatu..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
      />

      <button
        onClick={send}
        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium 
                   shadow hover:bg-indigo-700 active:scale-[0.97] transition"
      >
        Kirim
      </button>
    </div>
  );
}

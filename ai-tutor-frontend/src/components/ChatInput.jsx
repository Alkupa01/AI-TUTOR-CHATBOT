import { useState, useRef } from "react";

export default function ChatInput({ onSend }) {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSend(inputValue, selectedFile);
      setInputValue("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {selectedFile && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          📎 {selectedFile.name}
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          title="Attach image"
        >
          📎
        </button>
        <input
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder="Tanya sesuatu..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          onClick={handleSendMessage}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

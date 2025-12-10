import { useState } from "react";
import "./styles/main.css";

import HeaderBar from "./components/HeaderBar";
import LevelSelector from "./components/LevelSelector";
import ChatCard from "./components/ChatCard";

export default function App() {
  const [level, setLevel] = useState("SD");
  const [question, setQuestion] = useState("");

  return (
    <div className="page">
      <div className="container">

        <HeaderBar />
        <LevelSelector level={level} setLevel={setLevel} />

        <ChatCard
          level={level}
          question={question}
          setQuestion={setQuestion}
        />

      </div>
    </div>
  );
}

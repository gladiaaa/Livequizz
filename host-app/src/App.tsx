import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { useWebSocket } from "./hooks/useWebSocket";

// ⚠️ idéalement ça vient de packages/shared-types, mais on fait avec ton import actuel
import type { RoomState, ServerToClient, QuizDefinition, PlayerPublic } from "../../server/src/types/shared";

import CreateQuiz from "./components/CreateQuiz";
import Lobby from "./components/Lobby";
import QuestionView from "./components/QuestionView";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";

type UiPhase = "CREATE" | "LOBBY" | "QUESTION" | "RESULTS" | "LEADERBOARD" | "ENDED";

function mapPhase(p: RoomState["phase"]): UiPhase {
  switch (p) {
    case "lobby":
      return "LOBBY";
    case "question":
      return "QUESTION";
    case "results":
      return "RESULTS";
    case "leaderboard":
      return "LEADERBOARD";
    case "ended":
      return "ENDED";
  }
}

export default function App() {
  // ✅ BON PORT
  const { sendMessage, lastMessage, isOpen } = useWebSocket("ws://localhost:8080");

  const [room, setRoom] = useState<RoomState | null>(null);
  const [quizCode, setQuizCode] = useState<string>("");

  useEffect(() => {
    if (!lastMessage) return;

    const msg = JSON.parse(lastMessage.data) as ServerToClient;

    if (msg.type === "joined" && msg.role === "host") {
      setQuizCode(msg.quizCode);
      return;
    }

    if (msg.type === "state") {
      setRoom(msg.state);
      setQuizCode(msg.state.code);
      return;
    }

    if (msg.type === "error") {
      console.error("[server error]", msg.message);
      alert(msg.message);
      return;
    }
  }, [lastMessage]);

  const uiPhase: UiPhase = useMemo(() => {
    if (!room) return quizCode ? "LOBBY" : "CREATE";
    return mapPhase(room.phase);
  }, [room, quizCode]);

  const handleCreate = (quiz: QuizDefinition) => {
    if (!isOpen) return;
    sendMessage({ type: "join", role: "host", quiz });
  };

  const handleStart = () => {
    if (!isOpen || !quizCode) return;
    sendMessage({ type: "host:start", quizCode });
  };

  const handleNext = () => {
    if (!isOpen || !quizCode) return;
    sendMessage({ type: "host:next", quizCode });
  };

  // --- Render ---
  if (uiPhase === "CREATE") {
    return <CreateQuiz onCreate={handleCreate} />;
  }

  if (uiPhase === "LOBBY") {
    return (
      <Lobby
        code={quizCode}
        players={(room?.players ?? []).map((p) => ({ name: p.name }))}
        onStart={handleStart}
      />
    );
  }

  if (uiPhase === "QUESTION") {
    return <QuestionView question={room?.question} />;
  }

  if (uiPhase === "RESULTS") {
    return <Results results={room?.results} onNext={handleNext} onEnd={() => {}} />;
  }

  // LEADERBOARD / ENDED
  return <Leaderboard players={(room?.leaderboard ?? []) as PlayerPublic[]} />;
}
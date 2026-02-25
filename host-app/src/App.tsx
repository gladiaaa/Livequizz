import { useMemo } from "react";
import "./App.css";
import { useWebSocket } from "./hooks/useWebSocket";
import type { PlayerPublic } from "../../server/src/types/shared";

import CreateQuiz from "./components/CreateQuiz";
import Lobby from "./components/Lobby";
import QuestionView from "./components/QuestionView";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";

type Phase = "IDLE" | "LOBBY" | "QUESTION" | "RESULTS" | "ENDED";

interface AppState {
  phase: Phase;
  quizCode: string;
  players: PlayerPublic[];
  question: unknown;
  results: unknown;
  leaderboard: PlayerPublic[];
}
function App() {
  const { sendMessage, lastMessage } = useWebSocket("ws://localhost:3001");

  const state: AppState = useMemo(() => {
    if (!lastMessage) {
      return {
        phase: "IDLE",
        quizCode: "",
        players: [],
        question: null,
        results: null,
        leaderboard: [],
      };
    }

    const message = JSON.parse(lastMessage.data);

    switch (message.type) {
      case "sync":
        return {
          phase: "LOBBY",
          quizCode: message.payload.code,
          players: message.payload.players,
          question: null,
          results: null,
          leaderboard: [],
        };

      case "question":
        return {
          phase: "QUESTION",
          quizCode: "",
          players: [],
          question: message.payload,
          results: null,
          leaderboard: [],
        };

      case "results":
        return {
          phase: "RESULTS",
          quizCode: "",
          players: [],
          question: null,
          results: message.payload,
          leaderboard: [],
        };

      case "ended":
        return {
          phase: "ENDED",
          quizCode: "",
          players: [],
          question: null,
          results: null,
          leaderboard: message.payload.leaderboard,
        };

      default:
        return {
          phase: "IDLE",
          quizCode: "",
          players: [],
          question: null,
          results: null,
          leaderboard: [],
        };
    }
  }, [lastMessage]);

  const handleCreate = (quizData: unknown) => {
    sendMessage({
      type: "host:create",
      payload: quizData,
    });
  };

  const handleStart = () => {
    sendMessage({ type: "host:start" });
  };

  const handleNext = () => {
    sendMessage({ type: "host:next" });
  };

  const handleEnd = () => {
    sendMessage({ type: "host:end" });
  };

  switch (state.phase) {
    case "IDLE":
      return <CreateQuiz onCreate={handleCreate} />;

    case "LOBBY":
      return (
        <Lobby
          code={state.quizCode}
          players={state.players}
          onStart={handleStart}
        />
      );

    case "QUESTION":
      return <QuestionView question={state.question} />;

    case "RESULTS":
      return (
        <Results
          results={state.results}
          onNext={handleNext}
          onEnd={handleEnd}
        />
      );

    case "ENDED":
      return <Leaderboard players={state.leaderboard} />;

    default:
      return null;
  }
}

export default App;
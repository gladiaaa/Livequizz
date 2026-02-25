import { useEffect, useReducer } from "react";
import { useWebSocket } from "./hooks/useWebSocket";

import CreateQuiz from "./components/CreateQuiz";
import Lobby from "./components/Lobby";
import QuestionView from "./components/QuestionView";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";

/* ================= TYPES ================= */

type Phase =
  | "IDLE"
  | "LOBBY"
  | "QUESTION"
  | "RESULTS"
  | "LEADERBOARD"
  | "ENDED";

type QuizPhase =
  | "lobby"
  | "question"
  | "results"
  | "leaderboard"
  | "ended";

type PlayerPublic = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
};

type RoomState = {
  code: string;
  phase: QuizPhase;
  quizTitle: string;
  currentIndex: number;
  question:
    | null
    | {
        id: number;
        title: string;
        choices: [string, string, string, string];
        endsAt: number;
      };
  results:
    | null
    | {
        counts: [number, number, number, number];
        correctIndex: 0 | 1 | 2 | 3;
      };
  players: PlayerPublic[];
  leaderboard: PlayerPublic[];
};

type ServerToClient =
  | { type: "state"; state: RoomState }
  | { type: "joined"; role: "host"; quizCode: string }
  | { type: "error"; message: string };

type QuizDefinition = {
  title: string;
  questions: {
    id: number;
    title: string;
    choices: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    durationMs: number;
  }[];
};

/* ================= REDUCER ================= */

type AppState = {
  phase: Phase;
  quizCode: string;
  players: PlayerPublic[];
  question: RoomState["question"];
  results: RoomState["results"];
  leaderboard: PlayerPublic[];
};

type Action =
  | { type: "SET_STATE"; payload: RoomState }
  | { type: "SET_HOST_JOINED"; quizCode: string };

const initialState: AppState = {
  phase: "IDLE",
  quizCode: "",
  players: [],
  question: null,
  results: null,
  leaderboard: [],
};

function mapPhase(phase: QuizPhase): Phase {
  return phase.toUpperCase() as Phase;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATE":
      return {
        phase: mapPhase(action.payload.phase),
        quizCode: action.payload.code,
        players: action.payload.players,
        question: action.payload.question,
        results: action.payload.results,
        leaderboard: action.payload.leaderboard,
      };

    case "SET_HOST_JOINED":
      return {
        ...state,
        quizCode: action.quizCode,
        phase: "LOBBY",
      };

    default:
      return state;
  }
}

/* ================= COMPONENT ================= */

function App() {
  const { sendMessage, lastMessage } =
    useWebSocket("ws://localhost:3001");

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!lastMessage) return;

    const parsed: ServerToClient = JSON.parse(lastMessage.data);

    if (parsed.type === "state") {
      dispatch({ type: "SET_STATE", payload: parsed.state });
    }

    if (parsed.type === "joined" && parsed.role === "host") {
      dispatch({
        type: "SET_HOST_JOINED",
        quizCode: parsed.quizCode,
      });
    }

    if (parsed.type === "error") {
      console.error(parsed.message);
    }
  }, [lastMessage]);

  const handleCreate = (quiz: QuizDefinition) => {
    sendMessage({
      type: "join",
      role: "host",
      quiz,
    });
  };

  const handleStart = () => {
    sendMessage({
      type: "host:start",
      quizCode: state.quizCode,
    });
  };

  const handleNext = () => {
    sendMessage({
      type: "host:next",
      quizCode: state.quizCode,
    });
  };

  if (state.phase === "IDLE") {
    return <CreateQuiz onCreate={handleCreate} />;
  }

  if (state.phase === "LOBBY") {
    return (
      <Lobby
        code={state.quizCode}
        players={state.players}
        onStart={handleStart}
      />
    );
  }

  if (state.phase === "QUESTION" && state.question) {
    return <QuestionView question={state.question} />;
  }

  if (state.phase === "RESULTS" && state.results) {
    return (
      <Results results={state.results} onNext={handleNext} />
    );
  }

  if (state.phase === "LEADERBOARD") {
    return <Leaderboard players={state.leaderboard} />;
  }

  return null;
}

export default App;
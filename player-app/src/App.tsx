import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { useWebSocket } from "./hooks/useWebSocket";

import type { RoomState, ServerToClient } from "../../server/src/types/shared";

import { JoinScreen } from "./Components/JoinScreen";
import { WaitingLobby } from "./Components/WaitingLobby";
import { AnswerScreen } from "./Components/AnswerScreen";
import { FeedbackScreen } from "./Components/FeedbackScreen";
import { ScoreScreen } from "./Components/ScoreScreen";

type LocalPhase = "join" | RoomState["phase"];
type Ranking = { name: string; score: number };

type UiQuestion = {
  id: number;
  text: string;
  choices: string[];
  timerSec: number;
};

type AppState = {
  phase: LocalPhase;

  quizCode: string;
  name: string;
  playerId: string | null;

  players: string[];

  question: UiQuestion | null;
  remaining: number | null;

  hasAnswered: boolean;
  selectedIndex: number | null;

  correctIndex: number | null;

  rankings: Ranking[];

  error: string | null;

  // ✅ pour détecter “nouvelle question”
  lastQuestionId: number | null;
};

const initialState: AppState = {
  phase: "join",

  quizCode: "",
  name: "",
  playerId: null,

  players: [],

  question: null,
  remaining: null,

  hasAnswered: false,
  selectedIndex: null,

  correctIndex: null,

  rankings: [],

  error: null,

  lastQuestionId: null,
};

export default function App() {
  const wsUrl = useMemo(() => "ws://localhost:3001", []);
  const { status, sendMessage, lastMessage } = useWebSocket(wsUrl);

  const [state, setState] = useState<AppState>(initialState);

  function handleJoin(quizCode: string, name: string) {
    setState((s) => ({
      ...s,
      quizCode,
      name,
      error: null,
      phase: "lobby",
    }));

    sendMessage({
      type: "join",
      role: "player",
      quizCode,
      name,
    } as any);
  }

  function handleAnswer(choiceIndex: number) {
    setState((s) => {
      if (s.phase !== "question") return s;
      if (!s.question) return s;
      if (s.hasAnswered) return s;

      if (!s.playerId) {
        return { ...s, error: "playerId manquant (join pas terminé)" };
      }

      sendMessage({
        type: "answer",
        quizCode: s.quizCode,
        playerId: s.playerId,
        questionId: s.question.id,
        choiceIndex,
      } as any);

      return {
        ...s,
        hasAnswered: true,
        selectedIndex: choiceIndex,
        error: null,
      };
    });
  }

  useEffect(() => {
    if (!lastMessage) return;

    const msg = lastMessage as unknown as ServerToClient;

    setState((s) => {
      if (msg.type === "joined" && (msg as any).role === "player") {
        const m = msg as any;
        return {
          ...s,
          phase: "lobby",
          quizCode: m.quizCode,
          playerId: m.playerId,
          name: m.name,
          error: null,
        };
      }

      if (msg.type === "state") {
        const st = msg.state;

        const players = st.players.map((p) => p.name);

        const remaining =
          st.phase === "question" && st.question
            ? Math.max(0, Math.ceil((st.question.endsAt - Date.now()) / 1000))
            : null;

        const question: UiQuestion | null =
          st.phase === "question" && st.question
            ? {
                id: st.question.id,
                text: st.question.title,
                choices: [...st.question.choices],
                timerSec: remaining ?? 0,
              }
            : null;

        const rankings: Ranking[] = (st.leaderboard ?? []).map((p) => ({
          name: p.name,
          score: p.score,
        }));

        const correctIndex =
          st.phase === "results" && st.results ? st.results.correctIndex : null;

        // ✅ reset seulement si on est en QUESTION et que l’id change
        const newQuestionId =
          st.phase === "question" && st.question ? st.question.id : null;

        const isNewQuestion =
          st.phase === "question" &&
          newQuestionId !== null &&
          newQuestionId !== s.lastQuestionId;

        // ✅ cas où on revient en lobby/ended => on clean
        const shouldFullReset = st.phase === "lobby" || st.phase === "ended";

        return {
          ...s,
          phase: st.phase,
          players,
          question,
          remaining,
          correctIndex,
          rankings,
          error: null,

          // garder la réponse pendant RESULTS / LEADERBOARD
          hasAnswered: shouldFullReset ? false : isNewQuestion ? false : s.hasAnswered,
          selectedIndex: shouldFullReset ? null : isNewQuestion ? null : s.selectedIndex,

          lastQuestionId: newQuestionId ?? s.lastQuestionId,
        };
      }

      if (msg.type === "error") {
        return { ...s, error: (msg as any).message };
      }

      return s;
    });
  }, [lastMessage]);

  const statusClass =
    status === "connected"
      ? "status-connected"
      : status === "connecting"
      ? "status-connecting"
      : "status-disconnected";

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz / Player</h2>
        <span className={`status-badge ${statusClass}`}>{status}</span>
      </header>

      <main className="app-main">
        {state.phase === "join" ? (
          <JoinScreen onJoin={handleJoin} error={state.error} />
        ) : state.phase === "lobby" ? (
          <WaitingLobby players={state.players} />
        ) : state.phase === "question" ? (
          <AnswerScreen
            question={state.question as any}
            remaining={state.remaining}
            hasAnswered={state.hasAnswered}
            selectedIndex={state.selectedIndex}
            onAnswer={handleAnswer}
          />
        ) : state.phase === "results" ? (
          <FeedbackScreen
            wasCorrect={
              state.selectedIndex !== null &&
              state.correctIndex !== null &&
              state.selectedIndex === state.correctIndex
            }
            score={null}
          />
        ) : state.phase === "leaderboard" ? (
          <ScoreScreen rankings={state.rankings} me={state.name} ended={false} />
        ) : (
          <ScoreScreen rankings={state.rankings} me={state.name} ended={true} />
        )}
      </main>
    </div>
  );
}
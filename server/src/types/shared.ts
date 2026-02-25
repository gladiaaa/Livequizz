// Types partagés "localement" (server only)

export type QuizPhase = "lobby" | "question" | "results" | "leaderboard" | "ended";

export type QuizQuestion = {
  id: number;
  title: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  durationMs: number;
};

export type QuizDefinition = {
  title: string;
  questions: QuizQuestion[];
};

export type PlayerPublic = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
};

export type RoomState = {
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

export type ClientToServer =
  | { type: "join"; role: "host"; quiz: QuizDefinition }
  | { type: "join"; role: "player"; quizCode: string; name: string; playerId?: string }
  | { type: "sync"; quizCode: string; playerId: string }
  | { type: "answer"; quizCode: string; playerId: string; questionId: number; choiceIndex: 0 | 1 | 2 | 3 }
  | { type: "host:start"; quizCode: string }
  | { type: "host:next"; quizCode: string };

export type ServerToClient =
  | { type: "state"; state: RoomState }
  | { type: "joined"; role: "host"; quizCode: string }
  | { type: "joined"; role: "player"; quizCode: string; playerId: string; name: string }
  | { type: "error"; message: string };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isClientToServer(x: unknown): x is ClientToServer {
  if (!isObject(x) || typeof x.type !== "string") return false;

  switch (x.type) {
    case "join":
      if (x.role === "host") return isObject(x.quiz);
      if (x.role === "player") return typeof x.quizCode === "string" && typeof x.name === "string";
      return false;

    case "sync":
      return typeof x.quizCode === "string" && typeof x.playerId === "string";

    case "answer":
      return (
        typeof x.quizCode === "string" &&
        typeof x.playerId === "string" &&
        typeof x.questionId === "number" &&
        (x.choiceIndex === 0 || x.choiceIndex === 1 || x.choiceIndex === 2 || x.choiceIndex === 3)
      );

    case "host:start":
    case "host:next":
      return typeof x.quizCode === "string";

    default:
      return false;
  }
}
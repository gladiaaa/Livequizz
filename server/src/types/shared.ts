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
  | { type: "host:next"; quizCode: string }
  | { type: "host:end"; quizCode: string };

export type ServerToClient =
  | { type: "state"; state: RoomState }
  | { type: "joined"; role: "host"; quizCode: string }
  | { type: "joined"; role: "player"; quizCode: string; playerId: string; name: string }
  | { type: "error"; message: string };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isClientToServer(x: unknown): x is ClientToServer {
  if (!isObject(x) || typeof (x as any).type !== "string") return false;

  const msg = x as any;

  switch (msg.type) {
    case "join":
      if (msg.role === "host") return isObject(msg.quiz);
      if (msg.role === "player") return typeof msg.quizCode === "string" && typeof msg.name === "string";
      return false;

    case "sync":
      return typeof msg.quizCode === "string" && typeof msg.playerId === "string";

    case "answer":
      return (
        typeof msg.quizCode === "string" &&
        typeof msg.playerId === "string" &&
        typeof msg.questionId === "number" &&
        (msg.choiceIndex === 0 || msg.choiceIndex === 1 || msg.choiceIndex === 2 || msg.choiceIndex === 3)
      );

    case "host:start":
    case "host:next":
    case "host:end": 
      return typeof msg.quizCode === "string";

    default:
      return false;
  }
}
import type WebSocket from "ws";
import type { QuizDefinition, QuizQuestion, RoomState, ServerToClient, ClientToServer } from "../types/shared.js";

import { makePlayerId } from "../utils/ids.js";
import { nowMs } from "../utils/time.js";
import { wsSend } from "../utils/wsSend.js";

type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
};

export class QuizRoom {
  readonly code: string;
  private quiz: QuizDefinition;

  private host: WebSocket | null = null;

  private players = new Map<string, Player>();
  private sockets = new Map<WebSocket, { role: "host" | "player"; playerId?: string }>();

  private phase: RoomState["phase"] = "lobby";
  private currentIndex = -1;

  private answers = new Map<string, 0 | 1 | 2 | 3>();

  private questionEndsAt = 0;


  private tickInterval: NodeJS.Timeout | null = null;
  private timeUpTimeout: NodeJS.Timeout | null = null;

  constructor(code: string, quiz: QuizDefinition, private onMaybeDelete: () => void) {
    this.code = code;
    this.quiz = quiz;
  }

  joinHost(ws: WebSocket) {
    this.host = ws;
    this.sockets.set(ws, { role: "host" });

    console.log(`[room ${this.code}] host joined`);

    wsSend(ws, { type: "joined", role: "host", quizCode: this.code } satisfies ServerToClient);
    this.broadcastState();
  }

  joinPlayer(ws: WebSocket, name: string, playerId?: string) {
    if (playerId && this.players.has(playerId)) {
      const p = this.players.get(playerId)!;
      p.connected = true;
      this.sockets.set(ws, { role: "player", playerId });

      console.log(`[room ${this.code}] player reconnected id=${playerId} name=${p.name}`);

      wsSend(ws, { type: "joined", role: "player", quizCode: this.code, playerId, name: p.name } satisfies ServerToClient);
      this.sendState(ws);
      this.broadcastState();
      return;
    }
    const existing = [...this.players.values()].find((p) => p.name === name);
    if (existing) {
      existing.connected = true;
      this.sockets.set(ws, { role: "player", playerId: existing.id });

      console.log(`[room ${this.code}] player reattached by name name=${existing.name} id=${existing.id}`);

      wsSend(ws, {
        type: "joined",
        role: "player",
        quizCode: this.code,
        playerId: existing.id,
        name: existing.name
      } satisfies ServerToClient);

      this.sendState(ws);
      this.broadcastState();
      return;
    }


    const id = makePlayerId();
    this.players.set(id, { id, name, score: 0, connected: true });
    this.sockets.set(ws, { role: "player", playerId: id });

    console.log(`[room ${this.code}] player joined id=${id} name=${name}`);

    wsSend(ws, { type: "joined", role: "player", quizCode: this.code, playerId: id, name } satisfies ServerToClient);
    this.broadcastState();
  }


  onMessage(ws: WebSocket, msg: ClientToServer) {
    const ctx = this.sockets.get(ws);
    if (!ctx) return wsSend(ws, { type: "error", message: "Not joined" } satisfies ServerToClient);

    switch (msg.type) {
      case "sync":
        if (msg.quizCode !== this.code) return;
        return this.handleSync(ws, msg.playerId);

      case "host:start":
        if (ctx.role !== "host") return;
        if (msg.quizCode !== this.code) return;
        return this.start();

      case "host:next":
        if (ctx.role !== "host") return;
        if (msg.quizCode !== this.code) return;
        return this.next();

      case "answer":
        return wsSend(ws, { type: "error", message: "Not implemented (yet)" } satisfies ServerToClient);

      default:
        return;
    }
  }


  onClose(ws: WebSocket) {
    const ctx = this.sockets.get(ws);
    if (!ctx) return;

    this.sockets.delete(ws);

    if (ctx.role === "host") {
      console.log(`[room ${this.code}] host left`);
      this.host = null;


      if (this.sockets.size === 0) this.stopTimer();

      this.broadcastState();
      this.onMaybeDelete();
      return;
    }

    if (ctx.playerId) {
      const p = this.players.get(ctx.playerId);
      if (p) p.connected = false;

      console.log(`[room ${this.code}] player left id=${ctx.playerId}`);

      if (this.sockets.size === 0) this.stopTimer();

      this.broadcastState();
      this.onMaybeDelete();
    }
  }

  isEmpty() {
    return this.host === null && this.sockets.size === 0;
  }


  private start() {
    if (this.phase !== "lobby") return;

    if (this.quiz.questions.length === 0) {
      this.phase = "ended";
      this.broadcastState();
      return;
    }

    this.currentIndex = 0;
    this.phase = "question";
    this.answers.clear();

    const q = this.currentQuestion();
    if (!q) {
      this.phase = "ended";
      this.broadcastState();
      return;
    }

    console.log(`[room ${this.code}] start -> question index=${this.currentIndex}`);

    this.startTimer(q);
    this.broadcastState();
  }


  private next() {
    if (this.phase !== "results") return;
    const nextIndex = this.currentIndex + 1;

    if (nextIndex < this.quiz.questions.length) {
      this.currentIndex = nextIndex;
      this.phase = "question";
      this.answers.clear();

      const q = this.currentQuestion();
      if (!q) {
        this.phase = "leaderboard";
        this.stopTimer();
        this.broadcastState();
        return;
      }

      console.log(`[room ${this.code}] next -> question index=${this.currentIndex}`);

      this.startTimer(q);
      this.broadcastState();
      return;
    }


    this.stopTimer();
    this.phase = "leaderboard";

    console.log(`[room ${this.code}] end -> leaderboard`);

    this.broadcastState();
  }


  private startTimer(q: QuizQuestion) {
    this.stopTimer();

    const start = nowMs();
    this.questionEndsAt = start + q.durationMs;


    this.tickInterval = setInterval(() => {
      this.broadcastState();
    }, 1000);

    this.timeUpTimeout = setTimeout(() => {
      this.timeUp();
    }, q.durationMs);
  }

  private stopTimer() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.timeUpTimeout) clearTimeout(this.timeUpTimeout);
    this.tickInterval = null;
    this.timeUpTimeout = null;
  }

  private timeUp() {
    if (this.phase !== "question") return;

    this.stopTimer();
    this.phase = "results";

    console.log(`[room ${this.code}] time up -> results`);

    this.broadcastState();
  }


  private handleSync(ws: WebSocket, playerId: string) {
    const p = this.players.get(playerId);
    if (p) p.connected = true;

    console.log(`[room ${this.code}] sync playerId=${playerId} known=${Boolean(p)}`);

    this.sendState(ws);
    this.broadcastState();
  }


  private currentQuestion(): QuizQuestion | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.quiz.questions.length) return null;
    return this.quiz.questions[this.currentIndex] ?? null;
  }

  private countsForResults(): [number, number, number, number] {
    const counts: [number, number, number, number] = [0, 0, 0, 0];
    for (const v of this.answers.values()) counts[v] += 1;
    return counts;
  }

  private snapshot(): RoomState {
    const q = this.currentQuestion();

    const playersPublic = [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
      answered: this.answers.has(p.id)
    }));

    const leaderboard = [...playersPublic].sort((a, b) => b.score - a.score);

    return {
      code: this.code,
      phase: this.phase,
      quizTitle: this.quiz.title,
      currentIndex: this.currentIndex,

      question:
        this.phase === "question" || this.phase === "results"
          ? q
            ? { id: q.id, title: q.title, choices: q.choices, endsAt: this.questionEndsAt }
            : null
          : null,

      results:
        this.phase === "results" && q
          ? { counts: this.countsForResults(), correctIndex: q.correctIndex }
          : null,

      players: playersPublic,
      leaderboard
    };
  }

  private sendState(ws: WebSocket) {
    wsSend(ws, { type: "state", state: this.snapshot() } satisfies ServerToClient);
  }

  private broadcastState() {
    const payload = { type: "state", state: this.snapshot() } satisfies ServerToClient;
    for (const sock of this.sockets.keys()) wsSend(sock, payload);
  }
}
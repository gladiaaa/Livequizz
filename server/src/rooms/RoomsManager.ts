import type WebSocket from "ws";
import type { ClientToServer, ServerToClient } from "../types/shared.js";
import { makeCode } from "../utils/ids.js";
import { wsSend } from "../utils/wsSend.js";
import { QuizRoom } from "./QuizRoom.js";

export class RoomsManager {
  private rooms = new Map<string, QuizRoom>();
  private wsToRoom = new Map<WebSocket, string>();

  handle(ws: WebSocket, msg: ClientToServer) {
    if (msg.type === "join" && msg.role === "host") {
      const code = makeCode((c) => this.rooms.has(c));
      const room = new QuizRoom(code, msg.quiz, () => this.deleteIfEmpty(code));
      this.rooms.set(code, room);

      this.wsToRoom.set(ws, code);
      room.joinHost(ws);
      return;
    }

    if (msg.type === "join" && msg.role === "player") {
      const room = this.rooms.get(msg.quizCode);
      if (!room) return wsSend(ws, { type: "error", message: "Code invalide" } satisfies ServerToClient);

      this.wsToRoom.set(ws, room.code);
      room.joinPlayer(ws, msg.name, msg.playerId);
      return;
    }

    const codeFromWs = this.wsToRoom.get(ws);
    const code = codeFromWs ?? ("quizCode" in msg ? msg.quizCode : undefined);
    if (!code) return wsSend(ws, { type: "error", message: "Missing quizCode" } satisfies ServerToClient);

    const room = this.rooms.get(code);
    if (!room) return wsSend(ws, { type: "error", message: "Room introuvable" } satisfies ServerToClient);

    room.onMessage(ws, msg);
  }

  onClose(ws: WebSocket) {
    const code = this.wsToRoom.get(ws);
    if (!code) return;

    this.wsToRoom.delete(ws);

    const room = this.rooms.get(code);
    if (!room) return;

    room.onClose(ws);
    this.deleteIfEmpty(code);
  }

  private deleteIfEmpty(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.isEmpty()) {
      console.log(`[rooms] deleting empty room ${code}`);
      this.rooms.delete(code);
    }
  }
}
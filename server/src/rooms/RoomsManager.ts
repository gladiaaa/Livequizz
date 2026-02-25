import type WebSocket from "ws";
import type { ClientToServer, ServerToClient } from "../types/shared.js";
import { makeCode } from "../utils/ids.js";
import { wsSend } from "../utils/wsSend.js";

type RoomLite = {
  code: string;
  host?: WebSocket;
};

export class RoomsManager {
  private rooms = new Map<string, RoomLite>();
  private wsToRoom = new Map<WebSocket, string>(); 

  handle(ws: WebSocket, msg: ClientToServer) {
    // Host crée une room
    if (msg.type === "join" && msg.role === "host") {
      const code = makeCode((c) => this.rooms.has(c));
      this.rooms.set(code, { code, host: ws });
      this.wsToRoom.set(ws, code);

      console.log(`[rooms] created room ${code}`);

      wsSend(ws, { type: "joined", role: "host", quizCode: code } satisfies ServerToClient);
      return;
    }

    // Player rejoint une room existante
    if (msg.type === "join" && msg.role === "player") {
      const room = this.rooms.get(msg.quizCode);
      if (!room) return wsSend(ws, { type: "error", message: "Code invalide" } satisfies ServerToClient);

      this.wsToRoom.set(ws, room.code);

      console.log(`[rooms] player joined room ${room.code} name=${msg.name}`);


      wsSend(ws, {
        type: "joined",
        role: "player",
        quizCode: room.code,
        playerId: "TEMP_PLAYER_ID",
        name: msg.name
      } satisfies ServerToClient);
      return;
    }
    wsSend(ws, { type: "error", message: "Not implemented (yet)" } satisfies ServerToClient);
  }

  onClose(ws: WebSocket) {
    const code = this.wsToRoom.get(ws);
    if (!code) return;

    this.wsToRoom.delete(ws);

    const room = this.rooms.get(code);
    if (!room) return;

    // Si le host part, on delete
    if (room.host === ws) {
      console.log(`[rooms] host left, deleting room ${code}`);
      this.rooms.delete(code);
    }
  }
}
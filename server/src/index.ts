import http from "http";
import express from "express";
import { WebSocketServer } from "ws";

import { PORT } from "./env.js";
import { safeJsonParse } from "./utils/safeJson.js";
import { RoomsManager } from "./rooms/RoomsManager.js";

import { isClientToServer } from "./types/shared.js";
import type { ClientToServer, ServerToClient } from "./types/shared.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const Rooms = new RoomsManager();

wss.on("connection", (ws) => {
  ws.on("message", (buf) => {
    const raw = safeJsonParse(buf.toString());
    if (!raw) {
      return ws.send(JSON.stringify({ type: "error", message: "Bad JSON" } satisfies ServerToClient));
    }

    if (!isClientToServer(raw)) {
      return ws.send(JSON.stringify({ type: "error", message: "Bad payload" } satisfies ServerToClient));
    }

    Rooms.handle(ws, raw as ClientToServer);
  });

  ws.on("close", () => Rooms.onClose(ws));
});

server.listen(PORT, () => {
  console.log(`✅ Livequizz server`);
  console.log(`✅ HTTP: http://localhost:${PORT}/health`);
  console.log(`✅ WS:   ws://localhost:${PORT}`);
});
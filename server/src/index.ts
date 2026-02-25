import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import { PORT } from "./env.js";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "hello", message: "Livequizz WS up" }));
});

server.listen(PORT, () => {
  console.log(`✅ Livequizz server`);
  console.log(`✅ HTTP: http://localhost:${PORT}/health`);
  console.log(`✅ WS:   ws://localhost:${PORT}`);
});
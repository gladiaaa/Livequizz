import type WebSocket from "ws";

export function wsSend(ws: WebSocket, msg: unknown) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}
import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[ws] open", url);
      setIsOpen(true);
    };

    socket.onmessage = (event) => {
      setLastMessage(event);
    };

    socket.onerror = (err) => {
      console.error("[ws] error", err);
    };

    socket.onclose = (ev) => {
      console.log("[ws] close", ev.code, ev.reason);
      setIsOpen(false);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = useCallback((data: unknown) => {
    const ws = socketRef.current;
    if (!ws) return;

    if (ws.readyState !== WebSocket.OPEN) {
      console.warn("[ws] not open, dropping message:", data);
      return;
    }

    ws.send(JSON.stringify(data));
  }, []);

  return { sendMessage, lastMessage, isOpen };
}
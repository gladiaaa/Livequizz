import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onmessage = (event: MessageEvent) => {
      setLastMessage(event);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (data: unknown) => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return { sendMessage, lastMessage };
}
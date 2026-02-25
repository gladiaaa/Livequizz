import { randomUUID } from "crypto";

export function makeCode(existing: (code: string) => boolean): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!existing(code)) return code;
  }
}

export function makePlayerId(): string {
  return randomUUID();
}
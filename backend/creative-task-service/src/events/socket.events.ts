import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer): void {
  ioInstance = io;
  console.log("[Designer Socket] Socket.io real-time server registered.");
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitRealtimeEvent(event: string, data: any): void {
  if (!ioInstance) {
    return;
  }
  try {
    ioInstance.emit(event, data);
    console.log(`[Designer Socket] Emitted event: ${event}`, data?.id || "");
  } catch (err: any) {
    console.error(`[Designer Socket Error] Failed to emit event ${event}:`, err?.message || err);
  }
}


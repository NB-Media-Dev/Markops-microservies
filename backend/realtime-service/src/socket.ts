import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { config } from "./config/env.config.js";

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        config.clientUrl,
        "http://localhost:4200",
        "http://localhost:4201",
        "http://localhost:4202",
        "http://127.0.0.1:4202"
      ],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  io.on("connection", (socket) => {
    const role = socket.handshake.auth?.role || "CLIENT";
    const userName = socket.handshake.auth?.fullName || "User";
    const userId = socket.handshake.auth?.userId;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    console.log(`[Realtime Gateway] Client connected: ${socket.id} (${userName} / ${role})`);

    socket.on("join:room", (roomName: string) => {
      if (roomName && typeof roomName === "string") {
        socket.join(roomName);
        console.log(`[Realtime Gateway] Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    socket.on("leave:room", (roomName: string) => {
      if (roomName && typeof roomName === "string") {
        socket.leave(roomName);
        console.log(`[Realtime Gateway] Socket ${socket.id} left room: ${roomName}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Realtime Gateway] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[Realtime Gateway] Socket.IO Engine initialized on port " + config.port);
  return io;
}

export function broadcastEvent(event: string, data: any, room?: string): boolean {
  if (!io) {
    console.warn("[Realtime Gateway Warning] Socket.IO not initialized yet.");
    return false;
  }

  try {
    if (room && typeof room === "string") {
      io.to(room).emit(event, data);
      console.log(`[Realtime Gateway Broadcast] -> Room [${room}] Event [${event}]`);
    } else {
      io.emit(event, data);
      console.log(`[Realtime Gateway Broadcast] -> Global Event [${event}]`);
    }
    return true;
  } catch (err: any) {
    console.error("[Realtime Gateway Error] Failed to broadcast event:", err?.message || err);
    return false;
  }
}

export function getIO(): SocketIOServer | null {
  return io;
}


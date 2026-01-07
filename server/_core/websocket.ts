import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // En production, spécifier les origines autorisées
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Rejoindre une room spécifique à l'utilisateur
    socket.on("join:user", (userId: number) => {
      socket.join(`user:${userId}`);
      console.log(`[WebSocket] User ${userId} joined room`);
    });

    // Rejoindre une room spécifique au partenaire
    socket.on("join:partner", (partnerId: number) => {
      socket.join(`partner:${partnerId}`);
      console.log(`[WebSocket] Partner ${partnerId} joined room`);
    });

    // Rejoindre la room des admins
    socket.on("join:admin", () => {
      socket.join("admin");
      console.log(`[WebSocket] Admin joined room`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
}

// Fonctions helper pour envoyer des notifications
export function notifyUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[WebSocket] Sent ${event} to user ${userId}`);
  }
}

export function notifyPartner(partnerId: number, event: string, data: any) {
  if (io) {
    io.to(`partner:${partnerId}`).emit(event, data);
    console.log(`[WebSocket] Sent ${event} to partner ${partnerId}`);
  }
}

export function notifyAdmins(event: string, data: any) {
  if (io) {
    io.to("admin").emit(event, data);
    console.log(`[WebSocket] Sent ${event} to admins`);
  }
}

export function broadcastToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
    console.log(`[WebSocket] Broadcast ${event} to all clients`);
  }
}

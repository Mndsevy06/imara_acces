import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(server: HTTPServer) {
    const globalAny = global as any;
    if (globalAny.io) {
      console.warn('Socket.io is already initialized');
      this.io = globalAny.io;
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    globalAny.io = this.io;

    this.io.on('connection', (socket) => {
      console.log(`[Socket] New connection: ${socket.id}`);

      // Client joins a named room (e.g. "admin" or "agent:<agentId>")
      socket.on('join:room', (room: string) => {
        socket.join(room);
        console.log(`[Socket] ${socket.id} joined room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
      });
    });

    console.log('[Socket] Initialized successfully');
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io must be initialized before use');
    }
    return this.io;
  }

  /** Broadcast to ALL connected clients (admin sees everything) */
  public emit(event: string, data: any) {
    const io = this.io || (global as any).io;
    if (io) {
      io.emit(event, data);
    }
  }

  /** Emit to a specific named room */
  public to(room: string, event: string, data: any) {
    const io = this.io || (global as any).io;
    if (io) {
      io.to(room).emit(event, data);
    }
  }

  /** Emit to each agent's personal room: "agent:<agentId>" */
  public toAgents(agentIds: string[], event: string, data: any) {
    const io = this.io || (global as any).io;
    if (!io) return;
    for (const agentId of agentIds) {
      io.to(`agent:${agentId}`).emit(event, data);
    }
  }
}

export const socketService = SocketService.getInstance();

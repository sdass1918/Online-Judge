import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import url from 'url';
import { createClient } from 'redis'; 

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private userConnections: Map<string, WebSocket> = new Map();
  private redisSubscriber = createClient(); 

  public async init(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    await this.redisSubscriber.connect();
    console.log('Redis Pub/Sub connected for WebSockets 📡');
    
    await this.redisSubscriber.subscribe('execution_results', (message) => {
      const data = JSON.parse(message);
      this.sendUpdate(data.userId, data);
    });

    server.on('upgrade', (request, socket, head) => {
      const pathname = url.parse(request.url || '').pathname;
      if (pathname === '/ws') {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const queryObject = url.parse(request.url || '', true).query;
      const userId = queryObject.userId as string;

      if (userId) {
        this.userConnections.set(userId, ws);
      }

      ws.on('close', () => {
        if (userId) this.userConnections.delete(userId);
      });
    });
  }

  public sendUpdate(userId: string, data: object) {
    const ws = this.userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

export const wsManager = new WebSocketManager();

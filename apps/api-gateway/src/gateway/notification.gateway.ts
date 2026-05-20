import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private pubSubClient: Redis;

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
    // We need a dedicated connection for subscribing
    this.pubSubClient = this.redisClient.duplicate();
    
    this.pubSubClient.on('message', (channel, message) => {
      if (channel.startsWith('farmer-notify:')) {
        const farmerId = channel.split(':')[1];
        // Emit to the specific farmer's room
        this.server.to(`farmer-${farmerId}`).emit('notification', JSON.parse(message));
        this.logger.debug(`Notification sent to farmer-${farmerId}: ${message}`);
      }
    });
  }

  async handleConnection(client: Socket) {
    // 1. Authenticate user (simplified for exam: expect farmerId in headers or query)
    const farmerId = client.handshake.query.farmerId as string;
    
    if (farmerId) {
      client.join(`farmer-${farmerId}`);
      
      // Subscribe this server instance to the redis channel for this farmer
      const channel = `farmer-notify:${farmerId}`;
      await this.pubSubClient.subscribe(channel);
      
      this.logger.log(`Client ${client.id} joined room farmer-${farmerId}`);
    } else {
      this.logger.warn(`Client ${client.id} connected without farmerId`);
    }
  }

  async handleDisconnect(client: Socket) {
    const farmerId = client.handshake.query.farmerId as string;
    if (farmerId) {
      // For a real app, only unsubscribe if no other local sockets for this farmer remain
      // But Redis pattern subscriptions (P_SUBSCRIBE) or centralized subscriptions are better.
      // Here we just let them disconnect, the room is automatically left.
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }
}

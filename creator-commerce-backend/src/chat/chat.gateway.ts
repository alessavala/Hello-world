import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUser } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Message persistence stays exclusively in ChatService (called from the REST
 * controller) - this gateway only authenticates sockets, manages room
 * membership, and pushes events. That keeps there being a single write path
 * for messages and avoids a circular dependency between the gateway and the
 * service (the service depends on the gateway to broadcast, not vice versa).
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const user = await this.jwt.verifyAsync<AuthUser>(token);
      client.data.user = user;
      // A personal room lets us push "you have a new message" notifications
      // for the conversation list even when the client hasn't joined that
      // specific conversation's room yet.
      await client.join(`user:${user.sub}`);
    } catch {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<{ ok: boolean }> {
    const user = client.data.user as AuthUser | undefined;
    if (!user || !data?.conversationId) return { ok: false };

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { brand: { select: { userId: true } }, creator: { select: { userId: true } } },
    });
    if (!conversation) return { ok: false };

    const isParty = conversation.brand.userId === user.sub || conversation.creator.userId === user.sub;
    if (!isParty) {
      this.logger.warn(`User ${user.sub} tried to join a conversation they are not a party to`);
      return { ok: false };
    }
    await client.join(`conversation:${data.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (data?.conversationId) void client.leave(`conversation:${data.conversationId}`);
  }

  broadcastMessage(conversationId: string, recipientUserId: string, message: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
    this.server.to(`user:${recipientUserId}`).emit('conversation:updated', { conversationId });
  }

  broadcastRead(conversationId: string, readerUserId: string) {
    this.server.to(`conversation:${conversationId}`).emit('conversation:read', { conversationId, readerUserId });
  }

  private extractToken(client: Socket): string {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    const fromHeader = (client.handshake.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');
    const token = fromAuth ?? fromHeader;
    if (!token) throw new UnauthorizedException('Missing token');
    return token;
  }
}

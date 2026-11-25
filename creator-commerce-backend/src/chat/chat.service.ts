import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivityLogService } from '../common/activity-log.service';
import { paginate, paginationArgs, PaginationDto } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { StartConversationDto } from './chat.dto';

const CONVERSATION_INCLUDE = {
  brand: { select: { id: true, userId: true, businessName: true, logoUrl: true } },
  creator: { select: { id: true, userId: true, displayName: true, profilePhotoUrl: true } },
} satisfies Prisma.ConversationInclude;

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private gateway: ChatGateway,
  ) {}

  async startConversation(userId: string, dto: StartConversationDto) {
    const { brandId, creatorId } = await this.resolveCounterpart(userId, dto.counterpartId);

    const existing = await this.prisma.conversation.findUnique({
      where: { brandId_creatorId: { brandId, creatorId } },
      include: CONVERSATION_INCLUDE,
    });
    if (existing) return existing;

    // Tie the thread to an existing collaboration between the same pair, if
    // any, so either side has that context - purely informational, chat
    // itself never requires a collaboration to exist first.
    const collaboration = await this.prisma.collaboration.findFirst({
      where: { creatorId, campaign: { brandId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const conversation = await this.prisma.conversation.create({
      data: { brandId, creatorId, collaborationId: collaboration?.id },
      include: CONVERSATION_INCLUDE,
    });
    await this.activityLog.log({ userId, entityType: 'Conversation', entityId: conversation.id, action: 'CONVERSATION_STARTED' });
    return conversation;
  }

  async list(userId: string, q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where: Prisma.ConversationWhereInput = { OR: [{ brand: { userId } }, { creator: { userId } }] };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: { ...CONVERSATION_INCLUDE, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: { conversationId: { in: conversations.map((c) => c.id) }, senderUserId: { not: userId }, status: 'SENT' },
      _count: true,
    });
    const unreadByConversation = new Map(unreadCounts.map((u) => [u.conversationId, u._count]));

    const data = conversations.map(({ messages, ...conversation }) => ({
      ...conversation,
      lastMessage: messages[0] ?? null,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    }));

    return paginate(data, total, page, pageSize);
  }

  async messages(userId: string, conversationId: string, q: PaginationDto) {
    await this.assertParty(userId, conversationId);
    const { page, pageSize, skip, take } = paginationArgs(q);

    const [recent, total] = await Promise.all([
      this.prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Fetched newest-first for correct pagination, returned oldest-first so
    // the client can render the page top-to-bottom without re-sorting.
    return paginate(recent.reverse(), total, page, pageSize);
  }

  async send(userId: string, conversationId: string, body: string) {
    const conversation = await this.assertParty(userId, conversationId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, senderUserId: userId, body } }),
      this.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    ]);

    const recipientUserId = conversation.brand.userId === userId ? conversation.creator.userId : conversation.brand.userId;
    this.gateway.broadcastMessage(conversationId, recipientUserId, message);

    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParty(userId, conversationId);
    await this.prisma.message.updateMany({
      where: { conversationId, senderUserId: { not: userId }, status: 'SENT' },
      data: { status: 'READ', readAt: new Date() },
    });
    this.gateway.broadcastRead(conversationId, userId);
    return { ok: true };
  }

  private async resolveCounterpart(userId: string, counterpartId: string) {
    const [brand, creator] = await Promise.all([
      this.prisma.brandProfile.findUnique({ where: { userId } }),
      this.prisma.creatorProfile.findUnique({ where: { userId } }),
    ]);

    if (brand) {
      const target = await this.prisma.creatorProfile.findUnique({ where: { id: counterpartId } });
      if (!target) throw new NotFoundException('Creator not found');
      return { brandId: brand.id, creatorId: target.id };
    }
    if (creator) {
      const target = await this.prisma.brandProfile.findUnique({ where: { id: counterpartId } });
      if (!target) throw new NotFoundException('Brand not found');
      return { brandId: target.id, creatorId: creator.id };
    }
    throw new BadRequestException('Create your profile first');
  }

  private async assertParty(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId }, include: CONVERSATION_INCLUDE });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.brand.userId !== userId && conversation.creator.userId !== userId) {
      throw new ForbiddenException('You are not a party to this conversation');
    }
    return conversation;
  }
}

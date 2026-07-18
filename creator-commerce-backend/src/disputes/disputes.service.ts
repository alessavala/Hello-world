import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { ReputationService } from '../common/reputation.service';
import { OpenDisputeDto, ResolveDisputeDto } from './disputes.dto';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private reputation: ReputationService,
  ) {}

  async open(userId: string, dto: OpenDisputeDto) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: dto.collaborationId },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
    if (!collaboration) throw new NotFoundException('Collaboration not found');
    if (![collaboration.creator.userId, collaboration.campaign.brand.userId].includes(userId)) {
      throw new ForbiddenException('You are not a party to this collaboration');
    }
    if (['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(collaboration.status)) {
      throw new BadRequestException(`Cannot open a dispute on a collaboration in ${collaboration.status} state`);
    }

    const [dispute] = await this.prisma.$transaction([
      this.prisma.dispute.create({ data: { collaborationId: dto.collaborationId, openedByUserId: userId, reason: dto.reason, description: dto.description } }),
      this.prisma.collaboration.update({ where: { id: dto.collaborationId }, data: { status: 'DISPUTED' } }),
    ]);

    await this.activityLog.log({ userId, entityType: 'Dispute', entityId: dispute.id, action: 'DISPUTE_OPENED' });
    return dispute;
  }

  mine(userId: string) {
    return this.prisma.dispute.findMany({
      where: { OR: [{ openedByUserId: userId }, { collaboration: { creator: { userId } } }, { collaboration: { campaign: { brand: { userId } } } }] },
      include: { collaboration: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markUnderReview(adminUserId: string, id: string) {
    const dispute = await this.requireOpen(id);
    const updated = await this.prisma.dispute.update({ where: { id: dispute.id }, data: { status: 'UNDER_REVIEW' } });
    await this.activityLog.log({ userId: adminUserId, entityType: 'Dispute', entityId: id, action: 'DISPUTE_UNDER_REVIEW' });
    return updated;
  }

  async resolve(adminUserId: string, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id }, include: { collaboration: true } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      throw new BadRequestException(`Dispute is already ${dispute.status}`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id },
        data: { status: dto.status, resolution: dto.resolution, resolvedByUserId: adminUserId, resolvedAt: new Date() },
      }),
      this.prisma.collaboration.update({ where: { id: dispute.collaborationId }, data: { status: dto.collaborationStatus } }),
    ]);

    await this.activityLog.log({ userId: adminUserId, entityType: 'Dispute', entityId: id, action: `DISPUTE_${dto.status}` });
    await this.reputation.recompute(dispute.collaboration.creatorId);

    return updated;
  }

  private async requireOpen(id: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== 'OPEN') throw new BadRequestException(`Dispute is already ${dispute.status}`);
    return dispute;
  }
}

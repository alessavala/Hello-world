import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CollaborationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { ReputationService } from '../common/reputation.service';
import { assertValidTransition, CollaborationParty } from './collaboration-state-machine';

const ACTION_BY_STATUS: Partial<Record<CollaborationStatus, string>> = {
  SAMPLE_SENT: 'PRODUCT_SHIPPED',
  SAMPLE_RECEIVED: 'PRODUCT_RECEIVED',
  DRAFT_SUBMITTED: 'DELIVERABLE_SUBMITTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  FINAL_SUBMITTED: 'FINAL_SUBMITTED',
  APPROVED: 'DELIVERABLE_APPROVED',
  PUBLISHED: 'CONTENT_PUBLISHED',
  COMPLETED: 'COLLABORATION_COMPLETED',
  CANCELLED: 'COLLABORATION_CANCELLED',
};

@Injectable()
export class CollaborationsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private reputation: ReputationService,
  ) {}

  list(userId: string) {
    return this.prisma.collaboration.findMany({
      where: { OR: [{ creator: { userId } }, { campaign: { brand: { userId } } }] },
      include: { campaign: { include: { brand: true, category: true } }, creator: true, deliverables: true, reviews: true },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  async one(userId: string, id: string) {
    const c = await this.findWithParties(id);
    this.assertParty(userId, c);
    return this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        campaign: { include: { brand: true, category: true } },
        creator: true,
        deliverables: { include: { reviews: true } },
        disputes: true,
        reviews: true,
      },
    });
  }

  async updateStatus(userId: string, id: string, status: CollaborationStatus, trackingCarrier?: string, trackingNumber?: string) {
    const collaboration = await this.findWithParties(id);
    const actingAs = this.assertParty(userId, collaboration);

    assertValidTransition(collaboration.status, status, actingAs);
    await this.assertBusinessRules(collaboration.id, status, trackingCarrier, trackingNumber);

    const updated = await this.prisma.collaboration.update({
      where: { id },
      data: {
        status,
        trackingCarrier: status === 'SAMPLE_SENT' ? trackingCarrier : undefined,
        trackingNumber: status === 'SAMPLE_SENT' ? trackingNumber : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    await this.activityLog.log({
      userId,
      entityType: 'Collaboration',
      entityId: id,
      action: ACTION_BY_STATUS[status] ?? `STATUS_${status}`,
    });

    if (status === 'COMPLETED') {
      await this.reputation.recompute(collaboration.creatorId);
    }

    return updated;
  }

  private async assertBusinessRules(collaborationId: string, to: CollaborationStatus, trackingCarrier?: string, trackingNumber?: string) {
    if (to === 'SAMPLE_SENT' && (!trackingCarrier || !trackingNumber)) {
      throw new BadRequestException('trackingCarrier and trackingNumber are required to mark the sample as sent');
    }

    if (to === 'FINAL_SUBMITTED' || to === 'APPROVED' || to === 'PUBLISHED') {
      const deliverables = await this.prisma.deliverable.findMany({ where: { collaborationId } });
      if (to === 'FINAL_SUBMITTED' && !deliverables.some((d) => d.finalUrl)) {
        throw new BadRequestException('At least one deliverable needs a finalUrl before submitting the final version');
      }
      if (to === 'APPROVED' && (deliverables.length === 0 || !deliverables.every((d) => d.status === 'APPROVED'))) {
        throw new BadRequestException('All deliverables must be approved first');
      }
      if (to === 'PUBLISHED' && (deliverables.length === 0 || !deliverables.every((d) => d.publicationUrl))) {
        throw new BadRequestException('All deliverables need a publicationUrl before marking the collaboration as published');
      }
    }
  }

  private async findWithParties(id: string) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
    if (!collaboration) throw new NotFoundException('Collaboration not found');
    return collaboration;
  }

  private assertParty(userId: string, collaboration: { creator: { userId: string }; campaign: { brand: { userId: string } } }): CollaborationParty {
    if (collaboration.creator.userId === userId) return 'CREATOR';
    if (collaboration.campaign.brand.userId === userId) return 'BRAND';
    throw new ForbiddenException('You are not a party to this collaboration');
  }
}

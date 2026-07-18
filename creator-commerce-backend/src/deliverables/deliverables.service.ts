import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { CreateDeliverableDto, PublishDeliverableDto, SubmitDeliverableDto } from './deliverables.dto';

@Injectable()
export class DeliverablesService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async create(userId: string, d: CreateDeliverableDto) {
    const c = await this.prisma.collaboration.findUnique({ where: { id: d.collaborationId }, include: { campaign: { include: { brand: true } } } });
    if (!c || c.campaign.brand.userId !== userId) throw new ForbiddenException();
    return this.prisma.deliverable.create({ data: d });
  }

  async submit(userId: string, id: string, d: SubmitDeliverableDto) {
    if (!d.draftUrl && !d.finalUrl) throw new BadRequestException('Provide at least a draftUrl or a finalUrl');

    const item = await this.prisma.deliverable.findUnique({ where: { id }, include: { collaboration: { include: { creator: true } } } });
    if (!item) throw new NotFoundException();
    if (item.collaboration.creator.userId !== userId) throw new ForbiddenException();
    if (item.status === 'PUBLISHED') throw new BadRequestException('This deliverable has already been published');

    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: { ...d, status: 'SUBMITTED', submittedAt: new Date() },
    });
    await this.activityLog.log({ userId, entityType: 'Deliverable', entityId: id, action: 'DELIVERABLE_SUBMITTED' });
    return updated;
  }

  async review(userId: string, id: string, decision: 'APPROVED' | 'CHANGES_REQUESTED', comments: string) {
    const item = await this.prisma.deliverable.findUnique({ where: { id }, include: { collaboration: { include: { campaign: { include: { brand: true } } } } } });
    if (!item || item.collaboration.campaign.brand.userId !== userId) throw new ForbiddenException();
    if (item.status !== 'SUBMITTED') throw new BadRequestException('Only a submitted deliverable can be reviewed');

    await this.prisma.deliverableReview.create({ data: { deliverableId: id, reviewerId: userId, decision, comments } });
    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: { status: decision, approvedAt: decision === 'APPROVED' ? new Date() : undefined },
    });
    await this.activityLog.log({
      userId,
      entityType: 'Deliverable',
      entityId: id,
      action: decision === 'APPROVED' ? 'DELIVERABLE_APPROVED' : 'CHANGES_REQUESTED',
    });
    return updated;
  }

  async publish(userId: string, id: string, d: PublishDeliverableDto) {
    const item = await this.prisma.deliverable.findUnique({ where: { id }, include: { collaboration: { include: { creator: true } } } });
    if (!item) throw new NotFoundException();
    if (item.collaboration.creator.userId !== userId) throw new ForbiddenException();
    if (item.status !== 'APPROVED') throw new BadRequestException('Only an approved deliverable can be published');

    const updated = await this.prisma.deliverable.update({ where: { id }, data: { status: 'PUBLISHED', publicationUrl: d.publicationUrl } });
    await this.activityLog.log({ userId, entityType: 'Deliverable', entityId: id, action: 'CONTENT_PUBLISHED' });
    return updated;
  }
}

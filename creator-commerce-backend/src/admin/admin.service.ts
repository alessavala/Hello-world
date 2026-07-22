import { Injectable } from '@nestjs/common';
import { UserStatus, VerificationLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { MailService } from '../common/mail.service';
import { paginate, paginationArgs, PaginationDto } from '../common/pagination';
import { AdminCollaborationListDto, AdminDisputeListDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private mail: MailService,
  ) {}

  async dashboard() {
    const [users, creators, brands, campaigns, activeCollaborations, openDisputes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.creatorProfile.count(),
      this.prisma.brandProfile.count(),
      this.prisma.campaign.count(),
      this.prisma.collaboration.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
    ]);
    return { users, creators, brands, campaigns, activeCollaborations, openDisputes };
  }

  async users(q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count(),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async creators(q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [data, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({ include: { user: { select: { email: true, status: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.creatorProfile.count(),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async brands(q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [data, total] = await Promise.all([
      this.prisma.brandProfile.findMany({ include: { user: { select: { email: true, status: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.brandProfile.count(),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async campaigns(q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({ include: { brand: true, category: true }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.campaign.count(),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async collaborations(q: AdminCollaborationListDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where = { status: q.status };
    const [data, total] = await Promise.all([
      this.prisma.collaboration.findMany({ where, include: { creator: true, campaign: { include: { brand: true } } }, orderBy: { acceptedAt: 'desc' }, skip, take }),
      this.prisma.collaboration.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async disputes(q: AdminDisputeListDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where = { status: q.status };
    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({ where, include: { collaboration: true }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.dispute.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async setUserStatus(adminUserId: string, id: string, status: UserStatus) {
    const updated = await this.prisma.user.update({ where: { id }, data: { status } });
    await this.activityLog.log({
      userId: adminUserId,
      entityType: 'User',
      entityId: id,
      action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_STATUS_CHANGED',
      metadata: { status },
    });
    return updated;
  }

  async verifyCreator(adminUserId: string, id: string, level: VerificationLevel) {
    const updated = await this.prisma.creatorProfile.update({ where: { id }, data: { verificationLevel: level } });
    await this.activityLog.log({ userId: adminUserId, entityType: 'CreatorProfile', entityId: id, action: 'CREATOR_VERIFIED', metadata: { level } });
    await this.mail.notifyUser(updated.userId, 'Tu nivel de verificación cambió', `<p>Tu perfil ahora tiene el nivel de verificación <strong>${level}</strong>.</p>`);
    return updated;
  }

  async verifyMarketplace(adminUserId: string, creatorMarketplaceId: string, verified: boolean) {
    const updated = await this.prisma.creatorMarketplace.update({ where: { id: creatorMarketplaceId }, data: { verified } });
    await this.activityLog.log({
      userId: adminUserId,
      entityType: 'CreatorMarketplace',
      entityId: creatorMarketplaceId,
      action: verified ? 'MARKETPLACE_VERIFIED' : 'MARKETPLACE_UNVERIFIED',
    });
    return updated;
  }

  async verifyBrand(adminUserId: string, id: string, verified: boolean) {
    const updated = await this.prisma.brandProfile.update({ where: { id }, data: { verificationStatus: verified } });
    await this.activityLog.log({ userId: adminUserId, entityType: 'BrandProfile', entityId: id, action: verified ? 'BRAND_VERIFIED' : 'BRAND_UNVERIFIED' });
    if (verified) {
      await this.mail.notifyUser(updated.userId, 'Tu marca fue verificada', '<p>Tu perfil de marca ahora tiene la insignia de verificado.</p>');
    }
    return updated;
  }

  activity(entityType?: string) {
    return this.prisma.activityLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

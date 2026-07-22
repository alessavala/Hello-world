import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationSource, CampaignApplication } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { MailService } from '../common/mail.service';
import { computeMatchScore } from '../common/matching';
import { paginate, paginationArgs } from '../common/pagination';
import { ApplicationListDto, ApplyDto, InviteCreatorDto } from './applications.dto';

const APPLICANT_INCLUDE = {
  socialAccounts: true,
  marketplaces: true,
  categories: true,
} as const;

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private mail: MailService,
  ) {}

  async apply(userId: string, campaignId: string, d: ApplyDto) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId }, include: APPLICANT_INCLUDE });
    if (!creator) throw new NotFoundException('Create your creator profile first');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
    if (!campaign || campaign.status !== 'PUBLISHED') throw new BadRequestException('Campaign is unavailable');
    if (campaign.applicationDeadline && campaign.applicationDeadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    const { total } = computeMatchScore(creator, campaign);
    const application = await this.prisma.campaignApplication.create({
      data: { campaignId, creatorId: creator.id, proposedRate: d.proposedRate, message: d.message, matchScore: total, source: ApplicationSource.APPLICATION },
    });
    await this.activityLog.log({ userId, entityType: 'CampaignApplication', entityId: application.id, action: 'APPLICATION_SUBMITTED' });
    await this.mail.notifyUser(
      campaign.brand.userId,
      'Nueva aplicación a tu campaña',
      `<p><strong>${creator.displayName}</strong> aplicó a tu campaña "${campaign.name}".</p>`,
    );
    return application;
  }

  async invite(userId: string, d: InviteCreatorDto) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: d.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.brandId !== brand.id) throw new ForbiddenException('You do not own this campaign');
    if (campaign.status !== 'PUBLISHED') throw new BadRequestException('Publish the campaign before inviting creators');

    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: d.creatorId }, include: APPLICANT_INCLUDE });
    if (!creator) throw new NotFoundException('Creator not found');

    const { total } = computeMatchScore(creator, campaign);
    const invitation = await this.prisma.campaignApplication.create({
      data: {
        campaignId: d.campaignId,
        creatorId: d.creatorId,
        message: d.message,
        matchScore: total,
        source: ApplicationSource.INVITATION,
        status: 'INVITED',
        invitedByUserId: userId,
      },
    });
    await this.activityLog.log({ userId, entityType: 'CampaignApplication', entityId: invitation.id, action: 'INVITATION_SENT' });
    await this.mail.notifyUser(
      creator.userId,
      'Te invitaron a una campaña',
      `<p><strong>${brand.businessName}</strong> te invitó a participar en la campaña "${campaign.name}".</p>`,
    );
    return invitation;
  }

  my(userId: string, q: ApplicationListDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where = { creator: { userId }, status: q.status };
    return Promise.all([
      this.prisma.campaignApplication.findMany({
        where,
        include: { campaign: { include: { brand: true, category: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.campaignApplication.count({ where }),
    ]).then(([data, total]) => paginate(data, total, page, pageSize));
  }

  async forCampaign(userId: string, campaignId: string, q: ApplicationListDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.brand.userId !== userId) throw new ForbiddenException();

    const { page, pageSize, skip, take } = paginationArgs(q);
    const where = { campaignId, status: q.status };
    const [data, total] = await Promise.all([
      this.prisma.campaignApplication.findMany({
        where,
        include: { creator: { include: { socialAccounts: true, marketplaces: true } } },
        orderBy: { matchScore: 'desc' },
        skip,
        take,
      }),
      this.prisma.campaignApplication.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async updateStatus(userId: string, id: string, status: 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED') {
    const app = await this.prisma.campaignApplication.findUnique({ where: { id }, include: { campaign: { include: { brand: true } }, creator: true } });
    if (!app) throw new NotFoundException();
    if (app.campaign.brand.userId !== userId) throw new ForbiddenException();
    if (app.source !== ApplicationSource.APPLICATION) throw new BadRequestException('Invitations are accepted or rejected by the creator, not the brand');
    this.assertBrandTransition(app.status, status);

    if (status === 'ACCEPTED') {
      const collaboration = await this.acceptIntoCollaboration(app);
      await this.mail.notifyUser(
        app.creator.userId,
        '¡Tu aplicación fue aceptada!',
        `<p>Te aceptaron para la campaña "${app.campaign.name}". Coordinen los siguientes pasos por el chat de la plataforma.</p>`,
      );
      return collaboration;
    }

    const updated = await this.prisma.campaignApplication.update({ where: { id }, data: { status } });
    await this.activityLog.log({ userId, entityType: 'CampaignApplication', entityId: id, action: `APPLICATION_${status}` });
    if (status === 'REJECTED') {
      await this.mail.notifyUser(
        app.creator.userId,
        'Actualización de tu aplicación',
        `<p>Tu aplicación a la campaña "${app.campaign.name}" no fue seleccionada esta vez.</p>`,
      );
    }
    return updated;
  }

  async respond(userId: string, id: string, accept: boolean) {
    const app = await this.prisma.campaignApplication.findUnique({
      where: { id },
      include: { campaign: { include: { brand: true } }, creator: true },
    });
    if (!app) throw new NotFoundException();
    if (app.creator.userId !== userId) throw new ForbiddenException();
    if (app.source !== ApplicationSource.INVITATION) throw new BadRequestException('Only invitations can be accepted or rejected this way');
    if (app.status !== 'INVITED') throw new BadRequestException(`Invitation already ${app.status.toLowerCase()}`);

    if (accept) {
      const collaboration = await this.acceptIntoCollaboration(app);
      await this.mail.notifyUser(
        app.campaign.brand.userId,
        `${app.creator.displayName} aceptó tu invitación`,
        `<p><strong>${app.creator.displayName}</strong> aceptó tu invitación a la campaña "${app.campaign.name}".</p>`,
      );
      return collaboration;
    }

    const updated = await this.prisma.campaignApplication.update({ where: { id }, data: { status: 'REJECTED' } });
    await this.activityLog.log({ userId, entityType: 'CampaignApplication', entityId: id, action: 'INVITATION_REJECTED' });
    await this.mail.notifyUser(
      app.campaign.brand.userId,
      `${app.creator.displayName} rechazó tu invitación`,
      `<p><strong>${app.creator.displayName}</strong> rechazó tu invitación a la campaña "${app.campaign.name}".</p>`,
    );
    return updated;
  }

  async withdraw(userId: string, id: string) {
    const app = await this.prisma.campaignApplication.findUnique({ where: { id }, include: { creator: true } });
    if (!app) throw new NotFoundException();
    if (app.creator.userId !== userId) throw new ForbiddenException();
    if (!['APPLIED', 'SHORTLISTED'].includes(app.status)) {
      throw new BadRequestException('Only pending applications can be withdrawn');
    }
    const updated = await this.prisma.campaignApplication.update({ where: { id }, data: { status: 'WITHDRAWN' } });
    await this.activityLog.log({ userId, entityType: 'CampaignApplication', entityId: id, action: 'APPLICATION_WITHDRAWN' });
    return updated;
  }

  private assertBrandTransition(from: string, to: string) {
    const allowed: Record<string, string[]> = {
      APPLIED: ['SHORTLISTED', 'ACCEPTED', 'REJECTED'],
      SHORTLISTED: ['ACCEPTED', 'REJECTED'],
    };
    if (!allowed[from]?.includes(to)) {
      throw new ForbiddenException(`Cannot move application from ${from} to ${to}`);
    }
  }

  /**
   * Accepting an application/invitation and creating its Collaboration must
   * be atomic: two concurrent accepts on the same application, or acceptance
   * once the campaign's creator slots are already filled, must not both
   * succeed. The unique `applicationId` on Collaboration is the final
   * backstop (surfaced as 409 by the global exception filter) but we also
   * check the slot cap up front inside the same transaction.
   */
  private async acceptIntoCollaboration(app: CampaignApplication & { campaign: { deliveryDays: number; creatorsRequired: number; id: string } }) {
    const collaboration = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.collaboration.findUnique({ where: { applicationId: app.id } });
      if (existing) return existing;

      const activeCollaborations = await tx.collaboration.count({
        where: { campaignId: app.campaignId, status: { notIn: ['CANCELLED'] } },
      });
      if (activeCollaborations >= app.campaign.creatorsRequired) {
        throw new BadRequestException('This campaign already has the required number of creators');
      }

      await tx.campaignApplication.update({ where: { id: app.id }, data: { status: 'ACCEPTED' } });
      const deadline = new Date(Date.now() + app.campaign.deliveryDays * 86400000);
      return tx.collaboration.create({
        data: { applicationId: app.id, campaignId: app.campaignId, creatorId: app.creatorId, deadlineAt: deadline },
      });
    });
    await this.activityLog.log({ entityType: 'Collaboration', entityId: collaboration.id, action: 'CREATOR_ACCEPTED' });
    return collaboration;
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { paginate, paginationArgs } from '../common/pagination';
import { assertValidCampaignTransition } from './campaign-state-machine';
import { BrandCampaignSearchDto, CampaignSearchDto, CreateCampaignDto, UpdateCampaignDto } from './campaigns.dto';

const DETAIL_INCLUDE = { brand: true, product: true, category: true } satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async create(userId: string, dto: CreateCampaignDto) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new BadRequestException('Product not found');
      if (product.brandId !== brand.id) throw new ForbiddenException('You can only attach your own products to a campaign');
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        ...dto,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : undefined,
        brandId: brand.id,
      },
    });
    await this.activityLog.log({ userId, entityType: 'Campaign', entityId: campaign.id, action: 'CAMPAIGN_CREATED' });
    return campaign;
  }

  async update(userId: string, id: string, dto: UpdateCampaignDto) {
    const campaign = await this.assertOwnership(userId, id);
    if (campaign.status !== 'DRAFT') throw new ForbiddenException('Only draft campaigns can be edited; pause or close a published campaign instead');

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Category not found');
    }
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product || product.brandId !== campaign.brandId) throw new ForbiddenException('You can only attach your own products to a campaign');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { ...dto, applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : undefined },
    });
  }

  async list(q: CampaignSearchDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where: Prisma.CampaignWhereInput = {
      status: CampaignStatus.PUBLISHED,
      marketplace: q.marketplace,
      categoryId: q.categoryId,
      targetCountry: q.targetCountry,
      compensationType: q.compensationType,
    };
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({ where, include: DETAIL_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.campaign.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async mine(userId: string, q: BrandCampaignSearchDto) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where: Prisma.CampaignWhereInput = { brandId: brand.id, status: q.status };
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({ where, include: DETAIL_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.campaign.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async one(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { ...DETAIL_INCLUDE, applications: { select: { id: true, status: true, creatorId: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    // Unpublished campaigns are draft business data and only visible to their owner.
    if (campaign.status !== 'PUBLISHED' && campaign.brand.userId !== userId) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async status(userId: string, id: string, status: CampaignStatus) {
    const campaign = await this.assertOwnership(userId, id);
    assertValidCampaignTransition(campaign.status, status);
    const updated = await this.prisma.campaign.update({ where: { id }, data: { status } });
    if (status === 'PUBLISHED') {
      await this.activityLog.log({ userId, entityType: 'Campaign', entityId: id, action: 'CAMPAIGN_PUBLISHED' });
    }
    return updated;
  }

  private async assertOwnership(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: { brand: true } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.brand.userId !== userId) throw new ForbiddenException('You do not own this campaign');
    return campaign;
  }
}

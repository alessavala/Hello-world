import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { UpsertBrandDto } from './brands.dto';

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async upsert(userId: string, dto: UpsertBrandDto) {
    const profile = await this.prisma.brandProfile.upsert({ where: { userId }, update: dto, create: { userId, ...dto } });
    await this.activityLog.log({ userId, entityType: 'BrandProfile', entityId: profile.id, action: 'PROFILE_UPDATED' });
    return profile;
  }

  async me(userId: string) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId }, include: { products: true, campaigns: true } });
    if (!brand) throw new NotFoundException('Brand profile not found');
    return brand;
  }
}

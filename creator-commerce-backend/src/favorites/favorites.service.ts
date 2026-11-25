import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { paginate, paginationArgs, PaginationDto } from '../common/pagination';

const CREATOR_INCLUDE = {
  socialAccounts: true,
  marketplaces: true,
  categories: { include: { category: true } },
} as const;

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async add(userId: string, creatorId: string) {
    const brand = await this.getBrand(userId);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    const favorite = await this.prisma.favorite.upsert({
      where: { brandId_creatorId: { brandId: brand.id, creatorId } },
      update: {},
      create: { brandId: brand.id, creatorId },
    });
    await this.activityLog.log({ userId, entityType: 'Favorite', entityId: favorite.id, action: 'CREATOR_FAVORITED' });
    return favorite;
  }

  async remove(userId: string, creatorId: string) {
    const brand = await this.getBrand(userId);
    await this.prisma.favorite.deleteMany({ where: { brandId: brand.id, creatorId } });
    await this.activityLog.log({ userId, entityType: 'Favorite', entityId: creatorId, action: 'CREATOR_UNFAVORITED' });
    return { removed: true };
  }

  async list(userId: string, q: PaginationDto) {
    const brand = await this.getBrand(userId);
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { brandId: brand.id },
        include: { creator: { include: CREATOR_INCLUDE } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.favorite.count({ where: { brandId: brand.id } }),
    ]);
    return paginate(
      favorites.map((f) => f.creator),
      total,
      page,
      pageSize,
    );
  }

  async ids(userId: string) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) return [];
    const favorites = await this.prisma.favorite.findMany({ where: { brandId: brand.id }, select: { creatorId: true } });
    return favorites.map((f) => f.creatorId);
  }

  private async getBrand(userId: string) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');
    return brand;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Derives every Creator Passport metric from real platform history. Nothing
 * here is ever accepted as input from a client DTO - the only way these
 * numbers move is by completing campaigns, collecting reviews, and
 * resolving disputes.
 */
@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private prisma: PrismaService) {}

  async recompute(creatorId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!creator) return;

    const collaborations = await this.prisma.collaboration.findMany({
      where: { creatorId, status: { in: ['COMPLETED', 'DISPUTED'] } },
      select: { id: true, status: true, completedAt: true, deadlineAt: true, campaign: { select: { brandId: true } } },
    });

    const completed = collaborations.filter((c) => c.status === 'COMPLETED');
    const campaignsCompleted = completed.length;

    const onTime = completed.filter((c) => c.completedAt && c.completedAt <= c.deadlineAt);
    const onTimeDeliveryRate = completed.length ? onTime.length / completed.length : 0;

    const disputedCount = collaborations.filter((c) => c.status === 'DISPUTED').length;
    const totalForDisputeRate = collaborations.length;
    const disputeRate = totalForDisputeRate ? disputedCount / totalForDisputeRate : 0;

    const distinctBrands = new Set(collaborations.map((c) => c.campaign.brandId));
    const brandCounts = new Map<string, number>();
    for (const c of collaborations) {
      brandCounts.set(c.campaign.brandId, (brandCounts.get(c.campaign.brandId) ?? 0) + 1);
    }

    const [ratingAgg, rehireAgg, deliverables] = await Promise.all([
      this.prisma.review.aggregate({
        where: { reviewedUserId: creator.userId },
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['wouldWorkAgain'],
        where: { reviewedUserId: creator.userId, wouldWorkAgain: { not: null } },
        _count: true,
      }),
      this.prisma.deliverable.findMany({
        where: { collaboration: { creatorId } },
        select: {
          id: true,
          reviews: { orderBy: { createdAt: 'asc' }, take: 1, select: { decision: true } },
        },
      }),
    ]);

    const avgRating = ratingAgg._avg.rating ?? 0;

    const rehireYes = rehireAgg.find((r) => r.wouldWorkAgain === true)?._count ?? 0;
    const rehireTotal = rehireAgg.reduce((sum, r) => sum + r._count, 0);
    const brandRehireRate = rehireTotal ? rehireYes / rehireTotal : 0;

    const reviewedDeliverables = deliverables.filter((d) => d.reviews.length > 0);
    const firstApproved = reviewedDeliverables.filter((d) => d.reviews[0].decision === 'APPROVED');
    const firstApprovalRate = reviewedDeliverables.length ? firstApproved.length / reviewedDeliverables.length : 0;

    // Composite reliability score (0-100) blending on-time delivery, rating
    // and dispute-free history. Falls back to the neutral 50 baseline until
    // the creator has real history to derive it from.
    const hasHistory = campaignsCompleted > 0 || avgRating > 0;
    const reliabilityScore = hasHistory
      ? Math.round(Math.max(0, Math.min(100, (onTimeDeliveryRate * 40 + (avgRating / 5) * 40 + (1 - disputeRate) * 20))))
      : 50;

    await this.prisma.creatorProfile.update({
      where: { id: creatorId },
      data: {
        campaignsCompleted,
        onTimeDeliveryRate,
        disputeRate,
        avgRating,
        brandRehireRate,
        firstApprovalRate,
        reliabilityScore,
      },
    });

    void distinctBrands; // retained for potential future "unique brands worked with" metric
  }

  async passport(creatorId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      include: { marketplaces: true },
    });
    if (!creator) return null;

    const amazon = creator.marketplaces.find((m) => m.marketplace === 'AMAZON')?.verified ?? false;
    const mercadoLibre = creator.marketplaces.find((m) => m.marketplace === 'MERCADO_LIBRE')?.verified ?? false;
    const tiktokShop = creator.marketplaces.find((m) => m.marketplace === 'TIKTOK_SHOP')?.verified ?? false;

    return {
      creatorCommerceScore: creator.reliabilityScore,
      identityVerified: creator.verificationLevel !== 'REGISTERED',
      amazonAffiliateVerified: amazon,
      mercadoLibreAffiliateVerified: mercadoLibre,
      tiktokShopCreatorVerified: tiktokShop,
      campaignsCompleted: creator.campaignsCompleted,
      onTimeDeliveryRate: creator.onTimeDeliveryRate,
      avgRating: creator.avgRating,
      brandRehireRate: creator.brandRehireRate,
      firstApprovalRate: creator.firstApprovalRate,
      disputeRate: creator.disputeRate,
      verificationLevel: creator.verificationLevel,
    };
  }
}

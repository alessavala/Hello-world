import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { ReputationService } from '../common/reputation.service';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private reputation: ReputationService,
  ) {}

  async create(userId: string, d: CreateReviewDto) {
    const c = await this.prisma.collaboration.findUnique({
      where: { id: d.collaborationId },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
    if (!c) throw new ForbiddenException();

    const creatorUserId = c.creator.userId;
    const brandUserId = c.campaign.brand.userId;
    if (![creatorUserId, brandUserId].includes(userId)) throw new ForbiddenException();
    if (c.status !== 'COMPLETED') throw new BadRequestException('Collaboration must be completed before it can be reviewed');

    // The reviewed party is always derived from the collaboration itself -
    // a reviewer can never name an arbitrary target.
    const reviewedUserId = userId === creatorUserId ? brandUserId : creatorUserId;
    // wouldWorkAgain only makes sense for a brand rating a creator.
    const wouldWorkAgain = userId === brandUserId ? d.wouldWorkAgain : undefined;

    const review = await this.prisma.review.create({
      data: {
        collaborationId: d.collaborationId,
        reviewerUserId: userId,
        reviewedUserId,
        rating: d.rating,
        communication: d.communication,
        quality: d.quality,
        punctuality: d.punctuality,
        comments: d.comments,
        wouldWorkAgain,
      },
    });

    await this.activityLog.log({ userId, entityType: 'Review', entityId: review.id, action: 'REVIEW_CREATED' });

    if (reviewedUserId === creatorUserId) {
      await this.reputation.recompute(c.creator.id);
    }

    return review;
  }
}

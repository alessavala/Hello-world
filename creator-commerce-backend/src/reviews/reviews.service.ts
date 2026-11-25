import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { MailService } from '../common/mail.service';
import { ReputationService } from '../common/reputation.service';
import { paginate, paginationArgs, PaginationDto } from '../common/pagination';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private reputation: ReputationService,
    private mail: MailService,
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

    await this.mail.notifyUser(reviewedUserId, 'Recibiste una nueva reseña', `<p>Tenés una nueva reseña con ${d.rating}/5 estrellas.</p>`);

    return review;
  }

  async forUser(userId: string, q: PaginationDto) {
    const { page, pageSize, skip, take } = paginationArgs(q);
    const [data, total, avg] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewedUserId: userId },
        include: { reviewer: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.review.count({ where: { reviewedUserId: userId } }),
      this.prisma.review.aggregate({ where: { reviewedUserId: userId }, _avg: { rating: true } }),
    ]);
    return { ...paginate(data, total, page, pageSize), avgRating: avg._avg.rating ?? 0 };
  }
}

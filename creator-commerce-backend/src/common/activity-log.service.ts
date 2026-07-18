import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Fire-and-forget audit trail write. Never throws into the caller - a
   * logging failure must not roll back or fail the business operation it
   * is describing.
   */
  async log(params: {
    userId?: string | null;
    entityType: string;
    entityId?: string | null;
    action: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: params.userId ?? null,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          action: params.action,
          metadata: params.metadata,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write activity log: ${params.entityType}.${params.action}`, err as Error);
    }
  }
}

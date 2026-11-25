import { ForbiddenException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';

const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['PAUSED', 'CLOSED', 'CANCELLED'],
  PAUSED: ['PUBLISHED', 'CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

export function assertValidCampaignTransition(from: CampaignStatus, to: CampaignStatus) {
  if (from === to) return;
  if (!TRANSITIONS[from].includes(to)) {
    throw new ForbiddenException(`Cannot move campaign from ${from} to ${to}`);
  }
}

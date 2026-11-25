import { CollaborationStatus } from '@prisma/client';
import { IsIn, IsString } from 'class-validator';

export class OpenDisputeDto {
  @IsString() collaborationId: string;
  @IsString() reason: string;
  @IsString() description: string;
}

const RESOLUTION_STATUSES = ['RESOLVED', 'REJECTED'] as const;
// A dispute can only resolve the collaboration back onto a non-dispute
// track; DISPUTED itself is excluded so admins can't leave it stuck.
const REOPEN_STATUSES = Object.values(CollaborationStatus).filter((s) => s !== 'DISPUTED') as CollaborationStatus[];

export class ResolveDisputeDto {
  @IsIn(RESOLUTION_STATUSES) status: (typeof RESOLUTION_STATUSES)[number];
  @IsString() resolution: string;
  @IsIn(REOPEN_STATUSES) collaborationStatus: CollaborationStatus;
}


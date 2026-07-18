import { CollaborationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCollaborationStatusDto {
  @IsEnum(CollaborationStatus) status: CollaborationStatus;
  @IsOptional() @IsString() trackingCarrier?: string;
  @IsOptional() @IsString() trackingNumber?: string;
}

import { ApplicationStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../common/pagination';

const BRAND_SETTABLE_STATUSES = ['SHORTLISTED', 'ACCEPTED', 'REJECTED'] as const;

export class ApplyDto {
  @IsOptional() @IsNumber() proposedRate?: number;
  @IsOptional() @IsString() message?: string;
}

export class InviteCreatorDto {
  @IsString() campaignId: string;
  @IsString() creatorId: string;
  @IsOptional() @IsString() message?: string;
}

export class ApplicationStatusDto {
  @IsIn(BRAND_SETTABLE_STATUSES) status: (typeof BRAND_SETTABLE_STATUSES)[number];
}

export class RespondInvitationDto {
  @IsBoolean() accept: boolean;
}

export class ApplicationListDto extends PaginationDto {
  @IsOptional() @IsEnum(ApplicationStatus) status?: ApplicationStatus;
}

import { CollaborationStatus, DisputeStatus, UserStatus, VerificationLevel } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../common/pagination';

export class UserStatusDto {
  @IsEnum(UserStatus) status: UserStatus;
}

export class VerifyCreatorDto {
  @IsEnum(VerificationLevel) level: VerificationLevel;
}

export class VerifyMarketplaceDto {
  @IsBoolean() verified: boolean;
}

export class VerifyBrandDto {
  @IsBoolean() verified: boolean;
}

export class AdminCollaborationListDto extends PaginationDto {
  @IsOptional() @IsEnum(CollaborationStatus) status?: CollaborationStatus;
}

export class AdminDisputeListDto extends PaginationDto {
  @IsOptional() @IsEnum(DisputeStatus) status?: DisputeStatus;
}

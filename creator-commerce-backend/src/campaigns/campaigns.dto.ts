import { PartialType } from '@nestjs/swagger';
import { CampaignStatus, CompensationType, Marketplace } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination';

export class CreateCampaignDto {
  @IsOptional() @IsString() productId?: string;
  @IsString() categoryId: string;
  @IsString() name: string;
  @IsString() description: string;
  @IsEnum(Marketplace) marketplace: Marketplace;
  @IsEnum(CompensationType) compensationType: CompensationType;
  @IsOptional() @IsNumber() fixedAmount?: number;
  @IsInt() @Min(1) creatorsRequired: number;
  @IsString() deliverableDescription: string;
  @IsOptional() @IsDateString() applicationDeadline?: string;
  @IsInt() @Min(1) deliveryDays: number;
  @IsOptional() @IsInt() @Min(0) minFollowers?: number;
  @IsOptional() @IsInt() @Min(0) minAverageViews?: number;
  @IsOptional() @IsString() targetCountry?: string;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus) status: CampaignStatus;
}

export class CampaignSearchDto extends PaginationDto {
  @IsOptional() @IsEnum(Marketplace) marketplace?: Marketplace;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() targetCountry?: string;
  @IsOptional() @IsEnum(CompensationType) compensationType?: CompensationType;
}

export class BrandCampaignSearchDto extends PaginationDto {
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
}

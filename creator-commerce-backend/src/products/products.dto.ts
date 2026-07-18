import { PartialType } from '@nestjs/swagger';
import { Marketplace } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination';

export class CreateProductDto {
  @IsString() categoryId: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(Marketplace) marketplace: Marketplace;
  @IsOptional() @IsString() externalId?: string;
  @IsUrl() productUrl: string;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional() @IsBoolean() active?: boolean;
}

export class ProductSearchDto extends PaginationDto {
  @IsOptional() @IsEnum(Marketplace) marketplace?: Marketplace;
  @IsOptional() @IsString() categoryId?: string;
}

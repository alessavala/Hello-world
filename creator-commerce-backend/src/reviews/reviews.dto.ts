import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString() collaborationId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsInt() @Min(1) @Max(5) communication: number;
  @IsInt() @Min(1) @Max(5) quality: number;
  @IsInt() @Min(1) @Max(5) punctuality: number;
  @IsOptional() @IsString() comments?: string;
  @IsOptional() @IsBoolean() wouldWorkAgain?: boolean;
}

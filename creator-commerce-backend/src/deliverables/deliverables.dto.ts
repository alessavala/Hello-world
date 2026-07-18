import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateDeliverableDto {
  @IsString() collaborationId: string;
  @IsString() title: string;
  @IsString() contentType: string;
}

export class SubmitDeliverableDto {
  @IsOptional() @IsUrl() draftUrl?: string;
  @IsOptional() @IsUrl() finalUrl?: string;
}

export class ReviewDeliverableDto {
  @IsIn(['APPROVED', 'CHANGES_REQUESTED']) decision: 'APPROVED' | 'CHANGES_REQUESTED';
  @IsString() comments: string;
}

export class PublishDeliverableDto {
  @IsUrl() publicationUrl: string;
}

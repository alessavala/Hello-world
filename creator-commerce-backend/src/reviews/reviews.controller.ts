import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public } from '../common/auth';
import { PaginationDto } from '../common/pagination';
import { CreateReviewDto } from './reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() d: CreateReviewDto) {
    return this.service.create(u.sub, d);
  }

  @Public()
  @Get('user/:userId')
  forUser(@Param('userId') userId: string, @Query() q: PaginationDto) {
    return this.service.forUser(userId, q);
  }
}

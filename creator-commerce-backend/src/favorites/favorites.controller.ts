import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { PaginationDto } from '../common/pagination';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Roles(UserRole.BRAND)
@Controller('favorites')
export class FavoritesController {
  constructor(private service: FavoritesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: PaginationDto) {
    return this.service.list(u.sub, q);
  }

  @Get('ids')
  ids(@CurrentUser() u: AuthUser) {
    return this.service.ids(u.sub);
  }

  @Post(':creatorId')
  add(@CurrentUser() u: AuthUser, @Param('creatorId') creatorId: string) {
    return this.service.add(u.sub, creatorId);
  }

  @Delete(':creatorId')
  remove(@CurrentUser() u: AuthUser, @Param('creatorId') creatorId: string) {
    return this.service.remove(u.sub, creatorId);
  }
}

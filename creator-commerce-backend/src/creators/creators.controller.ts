import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Public, Roles } from '../common/auth';
import { CreatorsService } from './creators.service';
import {
  CreateMarketplaceDto,
  CreatePortfolioItemDto,
  CreateSocialAccountDto,
  CreatorSearchDto,
  UpdateMarketplaceDto,
  UpdatePortfolioItemDto,
  UpdateSocialAccountDto,
  UpsertCreatorDto,
} from './creators.dto';

@ApiTags('creators')
@ApiBearerAuth()
@Controller('creators')
export class CreatorsController {
  constructor(private service: CreatorsService) {}

  @Roles(UserRole.CREATOR)
  @Put('me')
  upsert(@CurrentUser() u: AuthUser, @Body() dto: UpsertCreatorDto) {
    return this.service.upsert(u.sub, dto);
  }

  @Roles(UserRole.CREATOR)
  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return this.service.me(u.sub);
  }

  @Get()
  search(@Query() q: CreatorSearchDto) {
    return this.service.search(q);
  }

  @Public()
  @Get(':id')
  one(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Get(':id/passport')
  passport(@Param('id') id: string) {
    return this.service.passport(id);
  }

  @Roles(UserRole.CREATOR)
  @Post('me/social-accounts')
  addSocialAccount(@CurrentUser() u: AuthUser, @Body() dto: CreateSocialAccountDto) {
    return this.service.addSocialAccount(u.sub, dto);
  }

  @Roles(UserRole.CREATOR)
  @Patch('me/social-accounts/:id')
  updateSocialAccount(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateSocialAccountDto) {
    return this.service.updateSocialAccount(u.sub, id, dto);
  }

  @Roles(UserRole.CREATOR)
  @Delete('me/social-accounts/:id')
  removeSocialAccount(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.removeSocialAccount(u.sub, id);
  }

  @Roles(UserRole.CREATOR)
  @Post('me/marketplaces')
  addMarketplace(@CurrentUser() u: AuthUser, @Body() dto: CreateMarketplaceDto) {
    return this.service.addMarketplace(u.sub, dto);
  }

  @Roles(UserRole.CREATOR)
  @Patch('me/marketplaces/:id')
  updateMarketplace(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateMarketplaceDto) {
    return this.service.updateMarketplace(u.sub, id, dto);
  }

  @Roles(UserRole.CREATOR)
  @Delete('me/marketplaces/:id')
  removeMarketplace(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.removeMarketplace(u.sub, id);
  }

  @Roles(UserRole.CREATOR)
  @Post('me/categories/:categoryId')
  addCategory(@CurrentUser() u: AuthUser, @Param('categoryId') categoryId: string) {
    return this.service.addCategory(u.sub, categoryId);
  }

  @Roles(UserRole.CREATOR)
  @Delete('me/categories/:categoryId')
  removeCategory(@CurrentUser() u: AuthUser, @Param('categoryId') categoryId: string) {
    return this.service.removeCategory(u.sub, categoryId);
  }

  @Roles(UserRole.CREATOR)
  @Post('me/portfolio')
  addPortfolioItem(@CurrentUser() u: AuthUser, @Body() dto: CreatePortfolioItemDto) {
    return this.service.addPortfolioItem(u.sub, dto);
  }

  @Roles(UserRole.CREATOR)
  @Patch('me/portfolio/:id')
  updatePortfolioItem(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdatePortfolioItemDto) {
    return this.service.updatePortfolioItem(u.sub, id, dto);
  }

  @Roles(UserRole.CREATOR)
  @Delete('me/portfolio/:id')
  removePortfolioItem(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.removePortfolioItem(u.sub, id);
  }
}

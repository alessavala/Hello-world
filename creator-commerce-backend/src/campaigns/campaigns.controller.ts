import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { CampaignsService } from './campaigns.service';
import { BrandCampaignSearchDto, CampaignSearchDto, CreateCampaignDto, UpdateCampaignDto, UpdateCampaignStatusDto } from './campaigns.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private service: CampaignsService) {}

  @Roles(UserRole.BRAND)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() d: CreateCampaignDto) {
    return this.service.create(u.sub, d);
  }

  @Roles(UserRole.BRAND)
  @Get('mine')
  mine(@CurrentUser() u: AuthUser, @Query() q: BrandCampaignSearchDto) {
    return this.service.mine(u.sub, q);
  }

  @Get()
  list(@Query() q: CampaignSearchDto) {
    return this.service.list(q);
  }

  @Get(':id')
  one(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.one(u.sub, id);
  }

  @Roles(UserRole.BRAND)
  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: UpdateCampaignDto) {
    return this.service.update(u.sub, id, d);
  }

  @Roles(UserRole.BRAND)
  @Patch(':id/status')
  status(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: UpdateCampaignStatusDto) {
    return this.service.status(u.sub, id, d.status);
  }
}

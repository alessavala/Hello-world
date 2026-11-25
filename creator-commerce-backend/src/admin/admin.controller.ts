import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { PaginationDto } from '../common/pagination';
import { AdminService } from './admin.service';
import {
  AdminCollaborationListDto,
  AdminDisputeListDto,
  UserStatusDto,
  VerifyBrandDto,
  VerifyCreatorDto,
  VerifyMarketplaceDto,
} from './admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('users')
  users(@Query() q: PaginationDto) {
    return this.service.users(q);
  }

  @Get('creators')
  creators(@Query() q: PaginationDto) {
    return this.service.creators(q);
  }

  @Get('brands')
  brands(@Query() q: PaginationDto) {
    return this.service.brands(q);
  }

  @Get('campaigns')
  campaigns(@Query() q: PaginationDto) {
    return this.service.campaigns(q);
  }

  @Get('collaborations')
  collaborations(@Query() q: AdminCollaborationListDto) {
    return this.service.collaborations(q);
  }

  @Get('disputes')
  disputes(@Query() q: AdminDisputeListDto) {
    return this.service.disputes(q);
  }

  @Get('activity')
  activity(@Query('entityType') entityType?: string) {
    return this.service.activity(entityType);
  }

  @Patch('users/:id/status')
  status(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: UserStatusDto) {
    return this.service.setUserStatus(u.sub, id, d.status);
  }

  @Patch('creators/:id/verify')
  verify(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: VerifyCreatorDto) {
    return this.service.verifyCreator(u.sub, id, d.level);
  }

  @Patch('marketplaces/:id/verify')
  verifyMarketplace(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: VerifyMarketplaceDto) {
    return this.service.verifyMarketplace(u.sub, id, d.verified);
  }

  @Patch('brands/:id/verify')
  verifyBrand(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: VerifyBrandDto) {
    return this.service.verifyBrand(u.sub, id, d.verified);
  }
}

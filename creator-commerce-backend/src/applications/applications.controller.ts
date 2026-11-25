import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { ApplicationsService } from './applications.service';
import { ApplicationListDto, ApplicationStatusDto, ApplyDto, InviteCreatorDto, RespondInvitationDto } from './applications.dto';

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private service: ApplicationsService) {}

  @Roles(UserRole.CREATOR)
  @Post('campaign/:campaignId')
  apply(@CurrentUser() u: AuthUser, @Param('campaignId') id: string, @Body() d: ApplyDto) {
    return this.service.apply(u.sub, id, d);
  }

  @Roles(UserRole.BRAND)
  @Post('invite')
  invite(@CurrentUser() u: AuthUser, @Body() d: InviteCreatorDto) {
    return this.service.invite(u.sub, d);
  }

  @Roles(UserRole.CREATOR)
  @Get('me')
  my(@CurrentUser() u: AuthUser, @Query() q: ApplicationListDto) {
    return this.service.my(u.sub, q);
  }

  @Roles(UserRole.BRAND)
  @Get('campaign/:campaignId')
  forCampaign(@CurrentUser() u: AuthUser, @Param('campaignId') campaignId: string, @Query() q: ApplicationListDto) {
    return this.service.forCampaign(u.sub, campaignId, q);
  }

  @Roles(UserRole.BRAND)
  @Patch(':id/status')
  updateStatus(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: ApplicationStatusDto) {
    return this.service.updateStatus(u.sub, id, d.status);
  }

  @Roles(UserRole.CREATOR)
  @Patch(':id/respond')
  respond(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: RespondInvitationDto) {
    return this.service.respond(u.sub, id, d.accept);
  }

  @Roles(UserRole.CREATOR)
  @Patch(':id/withdraw')
  withdraw(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.withdraw(u.sub, id);
  }
}

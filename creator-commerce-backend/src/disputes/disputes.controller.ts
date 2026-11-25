import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { DisputesService } from './disputes.service';
import { OpenDisputeDto, ResolveDisputeDto } from './disputes.dto';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller('disputes')
export class DisputesController {
  constructor(private service: DisputesService) {}

  @Post()
  open(@CurrentUser() u: AuthUser, @Body() dto: OpenDisputeDto) {
    return this.service.open(u.sub, dto);
  }

  @Get('me')
  mine(@CurrentUser() u: AuthUser) {
    return this.service.mine(u.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/review')
  markUnderReview(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.markUnderReview(u.sub, id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/resolve')
  resolve(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.service.resolve(u.sub, id, dto);
  }
}

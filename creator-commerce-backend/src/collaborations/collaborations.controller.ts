import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/auth';
import { CollaborationsService } from './collaborations.service';
import { UpdateCollaborationStatusDto } from './collaborations.dto';

@ApiTags('collaborations')
@ApiBearerAuth()
@Controller('collaborations')
export class CollaborationsController {
  constructor(private service: CollaborationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.service.list(u.sub);
  }

  @Get(':id')
  one(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.one(u.sub, id);
  }

  @Patch(':id/status')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: UpdateCollaborationStatusDto) {
    return this.service.updateStatus(u.sub, id, d.status, d.trackingCarrier, d.trackingNumber);
  }
}

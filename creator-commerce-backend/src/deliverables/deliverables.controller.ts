import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { DeliverablesService } from './deliverables.service';
import { CreateDeliverableDto, PublishDeliverableDto, ReviewDeliverableDto, SubmitDeliverableDto } from './deliverables.dto';

@ApiTags('deliverables')
@ApiBearerAuth()
@Controller('deliverables')
export class DeliverablesController {
  constructor(private service: DeliverablesService) {}

  @Roles(UserRole.BRAND)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() d: CreateDeliverableDto) {
    return this.service.create(u.sub, d);
  }

  @Roles(UserRole.CREATOR)
  @Patch(':id/submit')
  submit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: SubmitDeliverableDto) {
    return this.service.submit(u.sub, id, d);
  }

  @Roles(UserRole.BRAND)
  @Patch(':id/review')
  review(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: ReviewDeliverableDto) {
    return this.service.review(u.sub, id, d.decision, d.comments);
  }

  @Roles(UserRole.CREATOR)
  @Patch(':id/publish')
  publish(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: PublishDeliverableDto) {
    return this.service.publish(u.sub, id, d);
  }
}

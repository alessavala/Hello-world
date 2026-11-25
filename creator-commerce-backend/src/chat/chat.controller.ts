import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/auth';
import { PaginationDto } from '../common/pagination';
import { ChatService } from './chat.service';
import { SendMessageDto, StartConversationDto } from './chat.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Post('conversations')
  start(@CurrentUser() u: AuthUser, @Body() dto: StartConversationDto) {
    return this.service.startConversation(u.sub, dto);
  }

  @Get('conversations')
  list(@CurrentUser() u: AuthUser, @Query() q: PaginationDto) {
    return this.service.list(u.sub, q);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query() q: PaginationDto) {
    return this.service.messages(u.sub, id, q);
  }

  @Post('conversations/:id/messages')
  send(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.service.send(u.sub, id, dto.body);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.markRead(u.sub, id);
  }
}

import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FacebookAuthDto, GoogleAuthDto, LoginDto, RegisterDto } from './auth.dto';
import { CurrentUser, Public, AuthUser } from '../common/auth';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Public()
  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.service.googleLogin(dto);
  }

  @Public()
  @Post('facebook')
  facebook(@Body() dto: FacebookAuthDto) {
    return this.service.facebookLogin(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}

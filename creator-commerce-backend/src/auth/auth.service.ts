import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { LoginDto, RegisterDto } from './auth.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private activityLog: ActivityLogService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN) throw new BadRequestException('Admin registration is disabled');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');

    const user = await this.prisma.user.create({
      data: { email: dto.email.toLowerCase(), passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS), role: dto.role },
    });
    await this.activityLog.log({ userId: user.id, entityType: 'User', entityId: user.id, action: 'USER_REGISTERED', metadata: { role: user.role } });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') throw new ForbiddenException('This account has been suspended');
    return this.issue(user);
  }

  private async issue(user: { id: string; email: string; role: UserRole }) {
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}

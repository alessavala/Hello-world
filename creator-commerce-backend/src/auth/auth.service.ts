import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/activity-log.service';
import { FacebookAuthDto, GoogleAuthDto, LoginDto, RegisterDto } from './auth.dto';

const BCRYPT_ROUNDS = 12;

interface SocialProfile {
  email: string;
  providerId: string;
}

@Injectable()
export class AuthService {
  private readonly googleClientId: string | undefined;
  private readonly googleClient: OAuth2Client | null;
  private readonly facebookAppId: string | undefined;
  private readonly facebookAppSecret: string | undefined;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private activityLog: ActivityLogService,
    private config: ConfigService,
  ) {
    this.googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
    this.facebookAppId = this.config.get<string>('FACEBOOK_APP_ID');
    this.facebookAppSecret = this.config.get<string>('FACEBOOK_APP_SECRET');
  }

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
    if (!user || !user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') throw new ForbiddenException('This account has been suspended');
    return this.issue(user);
  }

  async googleLogin(dto: GoogleAuthDto) {
    if (!this.googleClient) throw new ServiceUnavailableException('Social login with Google is not configured');
    const profile = await this.verifyGoogleToken(dto.idToken);
    return this.findOrCreateSocialUser('googleId', profile, dto.role);
  }

  async facebookLogin(dto: FacebookAuthDto) {
    if (!this.facebookAppId || !this.facebookAppSecret) {
      throw new ServiceUnavailableException('Social login with Facebook is not configured');
    }
    const profile = await this.verifyFacebookToken(dto.accessToken);
    return this.findOrCreateSocialUser('facebookId', profile, dto.role);
  }

  // Not private, so tests can stub out the network call to Google without
  // hitting real servers while still exercising the find-or-create/link logic.
  async verifyGoogleToken(idToken: string): Promise<SocialProfile> {
    const ticket = await this.googleClient!.verifyIdToken({ idToken, audience: this.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException('Google token did not include an email');
    if (!payload.email_verified) throw new UnauthorizedException('Google account email is not verified');
    return { email: payload.email, providerId: payload.sub };
  }

  async verifyFacebookToken(accessToken: string): Promise<SocialProfile> {
    const appToken = `${this.facebookAppId}|${this.facebookAppSecret}`;
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`,
    );
    const debugData = (await debugRes.json()) as { data?: { is_valid?: boolean; app_id?: string } };
    if (!debugData.data?.is_valid || debugData.data.app_id !== this.facebookAppId) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,email&access_token=${encodeURIComponent(accessToken)}`);
    const profile = (await profileRes.json()) as { id?: string; email?: string };
    if (!profile.email || !profile.id) {
      throw new UnauthorizedException('Your Facebook account has no email, or email permission was not granted');
    }
    return { email: profile.email, providerId: profile.id };
  }

  private async findOrCreateSocialUser(idField: 'googleId' | 'facebookId', profile: SocialProfile, role?: UserRole) {
    const linkData = idField === 'googleId' ? { googleId: profile.providerId } : { facebookId: profile.providerId };
    const uniqueWhere = idField === 'googleId' ? { googleId: profile.providerId } : { facebookId: profile.providerId };

    let user = await this.prisma.user.findUnique({ where: uniqueWhere });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
      if (byEmail) {
        // Same email already registered (password login or the other social
        // provider) - link this provider to that account instead of erroring.
        user = await this.prisma.user.update({ where: { id: byEmail.id }, data: linkData });
      } else {
        if (!role || role === UserRole.ADMIN) {
          throw new BadRequestException('role is required (CREATOR or BRAND) to create a new account');
        }
        user = await this.prisma.user.create({
          data: { email: profile.email.toLowerCase(), role, ...linkData },
        });
        await this.activityLog.log({ userId: user.id, entityType: 'User', entityId: user.id, action: 'USER_REGISTERED', metadata: { role: user.role, provider: idField } });
      }
    }

    if (user.status === 'SUSPENDED') throw new ForbiddenException('This account has been suspended');
    return this.issue(user);
  }

  private async issue(user: Pick<User, 'id' | 'email' | 'role'>) {
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}

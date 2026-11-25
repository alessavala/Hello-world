import { BadRequestException, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';

function buildService(overrides: { googleClientId?: string; facebookAppId?: string; facebookAppSecret?: string } = {}) {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
  const activityLog = { log: jest.fn().mockResolvedValue(undefined) };
  // Object spread (not `??`) so an explicit `{ googleClientId: undefined }`
  // override actually wins over the default, instead of being treated as
  // "not provided" the way `??` would.
  const defaults = { GOOGLE_CLIENT_ID: 'test-google-client-id', FACEBOOK_APP_ID: 'test-fb-app-id', FACEBOOK_APP_SECRET: 'test-fb-app-secret' };
  const values: Record<string, string | undefined> = {
    ...defaults,
    ...('googleClientId' in overrides ? { GOOGLE_CLIENT_ID: overrides.googleClientId } : {}),
    ...('facebookAppId' in overrides ? { FACEBOOK_APP_ID: overrides.facebookAppId } : {}),
    ...('facebookAppSecret' in overrides ? { FACEBOOK_APP_SECRET: overrides.facebookAppSecret } : {}),
  };
  const config = { get: jest.fn((key: string) => values[key]) };

  const service = new AuthService(prisma as any, jwt as any, activityLog as any, config as any);
  return { service, prisma, jwt, activityLog };
}

const ACTIVE_USER = (over: Partial<{ id: string; email: string; role: UserRole; status: UserStatus; googleId: string | null; facebookId: string | null }> = {}) => ({
  id: 'user-1',
  email: 'creator@test.com',
  role: UserRole.CREATOR,
  status: UserStatus.ACTIVE,
  googleId: null,
  facebookId: null,
  ...over,
});

describe('AuthService social login', () => {
  it('rejects Google login when GOOGLE_CLIENT_ID is not configured', async () => {
    const { service } = buildService({ googleClientId: undefined });
    await expect(service.googleLogin({ idToken: 'x' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects Facebook login when app credentials are not configured', async () => {
    const { service } = buildService({ facebookAppId: undefined });
    await expect(service.facebookLogin({ accessToken: 'x' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('creates a new user on first Google sign-in when a role is provided', async () => {
    const { service, prisma, activityLog } = buildService();
    jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue({ email: 'new@test.com', providerId: 'google-sub-1' });
    prisma.user.findUnique.mockResolvedValueOnce(null); // no user with this googleId
    prisma.user.findUnique.mockResolvedValueOnce(null); // no user with this email either
    prisma.user.create.mockResolvedValue(ACTIVE_USER({ email: 'new@test.com', googleId: 'google-sub-1' }));

    const result = await service.googleLogin({ idToken: 'x', role: UserRole.CREATOR });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@test.com', role: UserRole.CREATOR, googleId: 'google-sub-1' },
    });
    expect(activityLog.log).toHaveBeenCalled();
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user.email).toBe('new@test.com');
  });

  it('rejects creating a brand-new account without a role', async () => {
    const { service, prisma } = buildService();
    jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue({ email: 'new@test.com', providerId: 'google-sub-1' });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.googleLogin({ idToken: 'x' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('links Google to an existing account found by email instead of creating a duplicate', async () => {
    const { service, prisma } = buildService();
    jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue({ email: 'existing@test.com', providerId: 'google-sub-2' });
    prisma.user.findUnique.mockResolvedValueOnce(null); // no match by googleId
    prisma.user.findUnique.mockResolvedValueOnce(ACTIVE_USER({ id: 'user-2', email: 'existing@test.com' })); // match by email
    prisma.user.update.mockResolvedValue(ACTIVE_USER({ id: 'user-2', email: 'existing@test.com', googleId: 'google-sub-2' }));

    const result = await service.googleLogin({ idToken: 'x' });

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-2' }, data: { googleId: 'google-sub-2' } });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.user.id).toBe('user-2');
  });

  it('logs straight in when the Google id already matches a user', async () => {
    const { service, prisma } = buildService();
    jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue({ email: 'existing@test.com', providerId: 'google-sub-3' });
    prisma.user.findUnique.mockResolvedValueOnce(ACTIVE_USER({ id: 'user-3', googleId: 'google-sub-3' }));

    const result = await service.googleLogin({ idToken: 'x' });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result.user.id).toBe('user-3');
  });

  it('rejects a suspended account even with a valid Google token', async () => {
    const { service, prisma } = buildService();
    jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue({ email: 'suspended@test.com', providerId: 'google-sub-4' });
    prisma.user.findUnique.mockResolvedValueOnce(ACTIVE_USER({ id: 'user-4', status: UserStatus.SUSPENDED }));

    await expect(service.googleLogin({ idToken: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a new user on first Facebook sign-in', async () => {
    const { service, prisma } = buildService();
    jest.spyOn(service, 'verifyFacebookToken').mockResolvedValue({ email: 'fb@test.com', providerId: 'fb-id-1' });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue(ACTIVE_USER({ email: 'fb@test.com', facebookId: 'fb-id-1' }));

    const result = await service.facebookLogin({ accessToken: 'x', role: UserRole.BRAND });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'fb@test.com', role: UserRole.BRAND, facebookId: 'fb-id-1' },
    });
    expect(result.user.email).toBe('fb@test.com');
  });
});

describe('AuthService password login', () => {
  it('rejects password login for a social-only account (no passwordHash)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(ACTIVE_USER({ passwordHash: null } as any));

    await expect(service.login({ email: 'creator@test.com', password: 'whatever123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(UserRole) role: UserRole;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

// `role` is only required the first time - it decides CREATOR vs BRAND when
// this Google/Facebook sign-in creates a brand-new account. It's ignored
// when the provider id (or a matching email) already resolves to a user.
export class GoogleAuthDto {
  @IsString() idToken: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
}

export class FacebookAuthDto {
  @IsString() accessToken: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
}

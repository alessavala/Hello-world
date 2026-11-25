import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
export const PUBLIC_KEY='isPublic'; export const Public=()=>SetMetadata(PUBLIC_KEY,true);
export const ROLES_KEY='roles'; export const Roles=(...roles:UserRole[])=>SetMetadata(ROLES_KEY,roles);
export type AuthUser={sub:string;email:string;role:UserRole};
export const CurrentUser=createParamDecorator((_:unknown,ctx:ExecutionContext)=>ctx.switchToHttp().getRequest().user as AuthUser);
@Injectable() export class JwtAuthGuard implements CanActivate { constructor(private jwt:JwtService,private reflector:Reflector){} async canActivate(ctx:ExecutionContext){if(this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY,[ctx.getHandler(),ctx.getClass()]))return true; const req=ctx.switchToHttp().getRequest(); const token=req.headers.authorization?.replace(/^Bearer\s+/i,''); if(!token)throw new UnauthorizedException('Missing bearer token'); try{req.user=await this.jwt.verifyAsync(token);return true;}catch{throw new UnauthorizedException('Invalid or expired token');}} }
@Injectable() export class RolesGuard implements CanActivate { constructor(private reflector:Reflector){} canActivate(ctx:ExecutionContext){const roles=this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY,[ctx.getHandler(),ctx.getClass()]); if(!roles?.length)return true; const user=ctx.switchToHttp().getRequest().user as AuthUser; if(!roles.includes(user.role))throw new ForbiddenException('Insufficient permissions'); return true;} }

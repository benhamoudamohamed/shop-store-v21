import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {

  private logger = new Logger('🛡️ Roles Guard 🛡️')

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if(!roles?.includes(user.userRole)) {
      this.logger.error(`🚫 User with email: ${user.email} is attempting to access unauthorized route`)
      return false;
    }
    return roles.some((role) => {
      return role === user.userRole;
    });
  }
}

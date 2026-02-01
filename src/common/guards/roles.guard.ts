import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants';
import { Role } from '../enums';
import { ErrorMessages, formatMessage, BilingualForbiddenException } from '../';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new BilingualForbiddenException(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      const rolesString = requiredRoles.join(', ');
      throw new BilingualForbiddenException(
        formatMessage(ErrorMessages.ACCESS_DENIED, { roles: rolesString }),
      );
    }

    return true;
  }
}

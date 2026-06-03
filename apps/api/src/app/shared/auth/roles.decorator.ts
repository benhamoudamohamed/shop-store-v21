import { SetMetadata } from '@nestjs/common';

/**
 * Attach role metadata to a route so RolesGuard can enforce access control.
 */
export const RolesDecorator = (...roles: string[]) => SetMetadata('roles', roles);

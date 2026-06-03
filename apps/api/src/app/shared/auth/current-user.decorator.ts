import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Retrieve the current authenticated user payload from the request.
 * Can optionally return a specific property by passing a key.
 */
export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.user[data] : request.user;
});

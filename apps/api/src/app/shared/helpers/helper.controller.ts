import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { AuthenticationGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { RolesDecorator } from "../auth/roles.decorator";
import { User } from "@youssef-brand/shared/shared-types";
import { UserRole } from "@youssef-brand/shared/shared-enums";

/**
 * Controller exposing lightweight helper endpoints for authenticated users.
 */
@Controller('helper')
export class HelperController {

  /**
   * Return the current authenticated user information.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN, UserRole.enum.MODERATOR)
  @Get('/whoami')
  @HttpCode(HttpStatus.OK)
  whoAmI(@CurrentUser() user: User) {
    return user;
  }
} 

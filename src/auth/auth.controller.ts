import { Controller, Post, Body, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      return await this.authService.login(user, response);
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  @Post('register')
  async register(@Body() userData) {
    return this.authService.register(userData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user,
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      await this.authService.revokeToken(user.id, 'auth_token', response);
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    return user;
  }

  async login(user: User, response?: Response) {
    const payload = {
      sub: user.id,
      email: user.email
    };

    const token = this.jwtService.sign(payload);

    // Set cookie with improved error handling
    if (response && typeof response.cookie === 'function') {
      try {
        response.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 86400000, // 24 hours
          path: '/',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
      } catch (error) {
        console.error('Error setting auth cookie:', error);
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      accessToken: token,
    };
  }

  async revokeToken(
    userId: string,
    cookieName: string,
    response: Response
  ): Promise<void> {
    // Clear cookie
    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    console.log(`Token revoked for user with ID ${userId}`);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        // Include additional fields you want, but NOT the password
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user };
  }

  async register(userData: any) {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const newUser = await this.userService.create({
      ...userData,
      password: hashedPassword
    });
    
    if (!newUser) throw new Error('Error creating user');
    
    return await this.login(newUser);
  }
}
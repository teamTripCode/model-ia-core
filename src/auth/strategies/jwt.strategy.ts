import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

// Custom function to extract JWT from cookies or authorization header
const fromCookieOrAuthHeader = (req: Request): string | null => {
  // Try to get token from cookies first
  if (req && req.cookies && req.cookies['auth_token']) {
    return req.cookies['auth_token'];
  }
  
  // If no token in cookies, try from Authorization header
  const extractFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken();
  return extractFromHeader(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: fromCookieOrAuthHeader,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email
    };
  }
}
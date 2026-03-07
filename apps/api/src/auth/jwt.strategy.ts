import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req?.cookies?.token || null;
          console.log('[JWT] cookie keys:', req?.cookies ? Object.keys(req.cookies) : 'no cookies object');
          console.log('[JWT] token from cookie:', token ? 'present' : 'missing');
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
    console.log('[JWT] strategy init — secret set:', !!process.env.JWT_SECRET);
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('[JWT] validate called — sub:', payload?.sub, 'email:', payload?.email);
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

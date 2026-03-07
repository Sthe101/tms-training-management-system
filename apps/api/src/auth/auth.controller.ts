import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// COOKIE_SECURE=true must be set explicitly in production env vars.
// Falls back to NODE_ENV check. SameSite=None + Secure required for cross-origin cookies.
const isSecure = () =>
  process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isSecure(),
  sameSite: (isSecure() ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const opts = cookieOptions();
    console.log('[AUTH] login cookie options:', opts);
    res.cookie('token', result.token, opts);
    return { success: true, user: result.user };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    res.cookie('token', result.token, cookieOptions());
    return { success: true, user: result.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Must use same options as when cookie was set so browser clears it correctly
    res.clearCookie('token', cookieOptions());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return {
      success: true,
      user: req.user,
    };
  }

  // TEMPORARY DEBUG ENDPOINT — remove after auth issue is resolved
  @Get('debug')
  async debug(@Req() req: Request) {
    return {
      nodeEnv: process.env.NODE_ENV,
      cookieSecure: process.env.COOKIE_SECURE,
      jwtSecretSet: !!process.env.JWT_SECRET,
      frontendUrl: process.env.FRONTEND_URL,
      cookieHeader: req.headers['cookie'] || 'none',
      cookiesParsed: req.cookies ? Object.keys(req.cookies) : [],
      origin: req.headers['origin'] || 'none',
    };
  }
}

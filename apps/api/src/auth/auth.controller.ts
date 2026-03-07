import {
  Controller,
  Post,
  Patch,
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
import { CurrentUser } from './decorators/current-user.decorator';

const isSecure = () =>
  process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isSecure(),
  sameSite: (isSecure() ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
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
    res.cookie('token', result.token, cookieOptions());
    return { success: true, user: result.user, token: result.token };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    res.cookie('token', result.token, cookieOptions());
    return { success: true, user: result.user, token: result.token };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', cookieOptions());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return { success: true, user: req.user };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: { id: string }) {
    const data = await this.authService.getProfile(user.id);
    return { success: true, ...data };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; departmentId?: string; currentPassword?: string; newPassword?: string },
  ) {
    const updated = await this.authService.updateProfile(user.id, body);
    return { success: true, user: updated };
  }

  // Public endpoint — no auth required — used by signup page to populate dropdowns
  @Get('divisions')
  async getPublicDivisions() {
    const divisions = await this.authService.getPublicDivisions();
    return { success: true, divisions };
  }
}

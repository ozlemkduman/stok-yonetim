import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, LoginResponse, AuthTokens } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Public, CurrentUser, CurrentUserData } from '../../common';
import { User } from './auth.repository';

interface RequestWithUser extends Request {
  user: User;
}

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: RequestWithUser,
    @Body() _dto: LoginDto,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(req.user, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
  async register(@Body() _dto: RegisterDto): Promise<LoginResponse> {
    // Public registration is disabled
    return this.authService.register(_dto);
  }

  @Public()
  @Get('invitation/:token')
  async validateInvitation(@Param('token') token: string) {
    const invitation = await this.authService.validateInvitation(token);
    return {
      success: true,
      data: invitation,
    };
  }

  @Public()
  @Post('register-with-invitation')
  async registerWithInvitation(
    @Body() dto: { token: string; name: string; password: string; phone?: string },
  ): Promise<{ success: boolean; data: LoginResponse }> {
    const result = await this.authService.registerWithInvitation(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authHeader: string,
  ): Promise<{ message: string }> {
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(token);
    }
    return { message: 'Çıkış başarılı' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: CurrentUserData): Promise<{ message: string }> {
    await this.authService.logoutAll(user.sub);
    return { message: 'Tüm oturumlardan çıkış yapıldı' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    const profile = await this.authService.getProfile(user.sub);
    if (!profile) {
      return null;
    }
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      tenantId: profile.tenant_id,
      permissions: profile.permissions,
      emailVerifiedAt: profile.email_verified_at,
      lastLoginAt: profile.last_login_at,
    };
  }

  // Google login is disabled - only invitation-based registration is allowed
  // @Public()
  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // async googleAuth() {
  //   // Guard redirects to Google
  // }

  // @Public()
  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // async googleAuthCallback(
  //   @Req() req: Request & { user: GoogleUser },
  //   @Res() res: Response,
  // ) {
  //   const ipAddress = req.ip || req.socket.remoteAddress;
  //   const userAgent = req.headers['user-agent'];

  //   const result = await this.authService.googleLogin(
  //     req.user,
  //     ipAddress,
  //     userAgent,
  //   );

  //   // Redirect to frontend with tokens
  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5175';
  //   const params = new URLSearchParams({
  //     accessToken: result.tokens.accessToken,
  //     refreshToken: result.tokens.refreshToken,
  //   });

  //   res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  // }
}

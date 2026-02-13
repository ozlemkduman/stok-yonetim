import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository, User, Tenant } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string | null;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      return null;
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Hesabınız aktif değil');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    // Get tenant info if user has one
    let tenant: Tenant | null = null;
    if (user.tenant_id) {
      tenant = await this.authRepository.findTenantById(user.tenant_id);

      if (tenant && tenant.status !== 'active' && tenant.status !== 'trial') {
        throw new UnauthorizedException('Şirket hesabı askıya alınmış veya iptal edilmiş');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.authRepository.createSession({
      user_id: user.id,
      token_hash: this.authRepository.hashToken(tokens.accessToken),
      refresh_token_hash: this.authRepository.hashToken(tokens.refreshToken),
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        ...(tenant && {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
          },
        }),
      },
      tokens,
    };
  }

  async register(dto: RegisterDto): Promise<LoginResponse> {
    // Check if email already exists
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda');
    }

    // Generate slug from company name
    const slug = this.generateSlug(dto.companyName);

    // Check if slug already exists
    const existingTenant = await this.authRepository.findTenantBySlug(slug);
    if (existingTenant) {
      throw new ConflictException('Bu şirket adı zaten kullanımda');
    }

    // Get default plan
    const defaultPlan = await this.authRepository.getDefaultPlan();

    // Create tenant with trial period
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days trial

    const tenant = await this.authRepository.createTenant({
      name: dto.companyName,
      slug,
      plan_id: defaultPlan?.id || null,
      status: 'trial',
      trial_ends_at: trialEndDate,
      billing_email: dto.email,
      settings: {},
    });

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user as tenant admin
    const user = await this.authRepository.createUser({
      tenant_id: tenant.id,
      email: dto.email,
      password_hash: passwordHash,
      name: dto.name,
      phone: dto.phone || null,
      role: 'tenant_admin',
      permissions: ['*'],
      status: 'active',
      email_verified_at: null,
    });

    // Update tenant owner
    await this.authRepository.updateTenantOwner(tenant.id, user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.authRepository.createSession({
      user_id: user.id,
      token_hash: this.authRepository.hashToken(tokens.accessToken),
      refresh_token_hash: this.authRepository.hashToken(tokens.refreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
        },
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.authRepository.hashToken(refreshToken);
    const session = await this.authRepository.findSessionByRefreshToken(tokenHash);

    if (!session) {
      throw new UnauthorizedException('Geçersiz refresh token');
    }

    const user = await this.authRepository.findUserById(session.user_id);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya aktif değil');
    }

    // Invalidate old session
    await this.authRepository.invalidateSession(session.id);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Create new session
    await this.authRepository.createSession({
      user_id: user.id,
      token_hash: this.authRepository.hashToken(tokens.accessToken),
      refresh_token_hash: this.authRepository.hashToken(tokens.refreshToken),
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return tokens;
  }

  async logout(accessToken: string): Promise<void> {
    const tokenHash = this.authRepository.hashToken(accessToken);
    const session = await this.authRepository.findSessionByToken(tokenHash);

    if (session) {
      await this.authRepository.invalidateSession(session.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.invalidateAllUserSessions(userId);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
    }

    // Generate reset token
    const token = this.authRepository.generateToken();
    const tokenHash = this.authRepository.hashToken(token);

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    // TODO: Send email with reset link
    // For now, just log the token (remove in production)
    console.log(`Password reset token for ${email}: ${token}`);

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.authRepository.hashToken(token);
    const resetToken = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.authRepository.updateUser(resetToken.user_id, {
      password_hash: passwordHash,
    } as any);

    // Mark token as used
    await this.authRepository.markPasswordResetTokenUsed(resetToken.id);

    // Invalidate all sessions
    await this.authRepository.invalidateAllUserSessions(resetToken.user_id);

    return { message: 'Şifreniz başarıyla değiştirildi' };
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.authRepository.findUserById(userId);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

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
import { EmailService } from '../../common/services/email.service';

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
    private readonly emailService: EmailService,
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

  async register(_dto: RegisterDto): Promise<LoginResponse> {
    // Public registration is disabled - use invitation-based registration
    throw new BadRequestException('Kayit sadece davet ile yapilabilir');
  }

  async registerWithInvitation(dto: {
    token: string;
    name: string;
    password: string;
    phone?: string;
  }): Promise<LoginResponse> {
    // Find and validate invitation
    const invitation = await this.authRepository.findInvitationByToken(dto.token);

    if (!invitation) {
      throw new BadRequestException('Gecersiz davet linki');
    }

    if (invitation.accepted_at) {
      throw new BadRequestException('Bu davet zaten kullanilmis');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestException('Bu davetin suresi dolmus');
    }

    // Check if email already exists
    const existingUser = await this.authRepository.findUserByEmail(invitation.email);
    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda');
    }

    let tenant: Tenant;

    // If tenant_id exists, use existing tenant
    if (invitation.tenant_id) {
      const existingTenant = await this.authRepository.findTenantById(invitation.tenant_id);
      if (!existingTenant) {
        throw new BadRequestException('Organizasyon bulunamadi');
      }
      tenant = existingTenant;
    } else {
      // Create new tenant for tenant_admin invitations
      if (!invitation.tenant_name) {
        throw new BadRequestException('Organizasyon adi gerekli');
      }

      const slug = this.generateSlug(invitation.tenant_name);

      // Check if slug already exists
      const existingTenantBySlug = await this.authRepository.findTenantBySlug(slug);
      if (existingTenantBySlug) {
        throw new ConflictException('Bu organizasyon adı zaten kullanımda');
      }

      // Get default plan
      const defaultPlan = await this.authRepository.getDefaultPlan();

      // Create tenant with trial period
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 90); // 90 days trial

      tenant = await this.authRepository.createTenant({
        name: invitation.tenant_name,
        slug,
        plan_id: defaultPlan?.id || null,
        status: 'trial',
        trial_ends_at: trialEndDate,
        billing_email: invitation.email,
        settings: {},
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Determine permissions based on role
    const permissions = ['*'];

    // Create user
    const user = await this.authRepository.createUser({
      tenant_id: tenant.id,
      email: invitation.email,
      password_hash: passwordHash,
      name: dto.name,
      phone: dto.phone || null,
      role: invitation.role,
      permissions,
      status: 'active',
      email_verified_at: new Date(), // Invitation means email is verified
    });

    // Update tenant owner if this is a new tenant
    if (!invitation.tenant_id && invitation.role === 'tenant_admin') {
      await this.authRepository.updateTenantOwner(tenant.id, user.id);
    }

    // Mark invitation as accepted
    await this.authRepository.markInvitationAccepted(invitation.id);

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

  async validateInvitation(token: string): Promise<{
    email: string;
    role: string;
    tenantName: string | null;
    isNewTenant: boolean;
  }> {
    const invitation = await this.authRepository.findInvitationByToken(token);

    if (!invitation) {
      throw new BadRequestException('Gecersiz davet linki');
    }

    if (invitation.accepted_at) {
      throw new BadRequestException('Bu davet zaten kullanilmis');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestException('Bu davetin suresi dolmus');
    }

    let tenantName: string | null = null;
    if (invitation.tenant_id) {
      const tenant = await this.authRepository.findTenantById(invitation.tenant_id);
      tenantName = tenant?.name || null;
    } else {
      tenantName = invitation.tenant_name;
    }

    return {
      email: invitation.email,
      role: invitation.role,
      tenantName,
      isNewTenant: !invitation.tenant_id,
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

    await this.emailService.sendPasswordReset(email, token);

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

  async googleLogin(
    googleUser: {
      googleId: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    // Check if user exists with this email
    let user = await this.authRepository.findUserByEmail(googleUser.email);

    if (user) {
      // User exists, update google_id if not set
      if (!user.google_id) {
        await this.authRepository.updateUser(user.id, {
          google_id: googleUser.googleId,
          avatar_url: googleUser.avatarUrl,
        } as any);
      }
    } else {
      // New user - create tenant and user
      const slug = this.generateSlug(googleUser.name + '-company');

      // Get default plan
      const defaultPlan = await this.authRepository.getDefaultPlan();

      // Create tenant with trial period
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 90);

      const tenant = await this.authRepository.createTenant({
        name: `${googleUser.name} Sirket`,
        slug,
        plan_id: defaultPlan?.id || null,
        status: 'trial',
        trial_ends_at: trialEndDate,
        billing_email: googleUser.email,
        settings: {},
      });

      // Create user as tenant admin (no password for Google users)
      user = await this.authRepository.createUser({
        tenant_id: tenant.id,
        email: googleUser.email,
        password_hash: '', // No password for Google login
        name: googleUser.name,
        phone: null,
        role: 'tenant_admin',
        permissions: ['*'],
        status: 'active',
        email_verified_at: new Date(), // Google emails are verified
        google_id: googleUser.googleId,
        avatar_url: googleUser.avatarUrl,
      });

      // Update tenant owner
      await this.authRepository.updateTenantOwner(tenant.id, user.id);
    }

    // Login the user
    return this.login(user, ipAddress, userAgent);
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

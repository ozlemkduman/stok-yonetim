import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  permissions: string[];
  status: string;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  plan_id: string | null;
  settings: Record<string, any>;
  status: string;
  trial_ends_at: Date | null;
  subscription_starts_at: Date | null;
  subscription_ends_at: Date | null;
  billing_email: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  is_valid: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_period: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.knex<User>('users')
      .where({ email })
      .first();

    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;
    }

    return user || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await this.db.knex<User>('users')
      .where({ id })
      .first();

    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;
    }

    return user || null;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const insertData = {
      ...data,
      permissions: JSON.stringify(data.permissions || []),
    };

    const [user] = await this.db.knex('users')
      .insert(insertData)
      .returning('*');

    if (user.permissions) {
      user.permissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;
    }

    return user as User;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const updateData: any = { ...data, updated_at: this.db.knex.fn.now() };

    if (data.permissions) {
      updateData.permissions = JSON.stringify(data.permissions);
    }

    const [user] = await this.db.knex<User>('users')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;
    }

    return user || null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db.knex('users')
      .where({ id: userId })
      .update({ last_login_at: this.db.knex.fn.now() });
  }

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const insertData = {
      ...data,
      settings: JSON.stringify(data.settings || {}),
    };

    const [tenant] = await this.db.knex('tenants')
      .insert(insertData)
      .returning('*');

    return tenant as Tenant;
  }

  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.db.knex<Tenant>('tenants')
      .where({ slug })
      .first();
    return tenant || null;
  }

  async findTenantById(id: string): Promise<Tenant | null> {
    const tenant = await this.db.knex<Tenant>('tenants')
      .where({ id })
      .first();
    return tenant || null;
  }

  async updateTenantOwner(tenantId: string, ownerId: string): Promise<void> {
    await this.db.knex('tenants')
      .where({ id: tenantId })
      .update({ owner_id: ownerId });
  }

  async getDefaultPlan(): Promise<Plan | null> {
    const plan = await this.db.knex<Plan>('plans')
      .where({ code: 'starter', is_active: true })
      .first();
    return plan || null;
  }

  async createSession(data: Partial<UserSession>): Promise<UserSession> {
    const [session] = await this.db.knex<UserSession>('user_sessions')
      .insert(data)
      .returning('*');
    return session;
  }

  async findSessionByToken(tokenHash: string): Promise<UserSession | null> {
    const session = await this.db.knex<UserSession>('user_sessions')
      .where({ token_hash: tokenHash, is_valid: true })
      .where('expires_at', '>', this.db.knex.fn.now())
      .first();
    return session || null;
  }

  async findSessionByRefreshToken(refreshTokenHash: string): Promise<UserSession | null> {
    const session = await this.db.knex<UserSession>('user_sessions')
      .where({ refresh_token_hash: refreshTokenHash, is_valid: true })
      .first();
    return session || null;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.db.knex('user_sessions')
      .where({ id: sessionId })
      .update({ is_valid: false, updated_at: this.db.knex.fn.now() });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.db.knex('user_sessions')
      .where({ user_id: userId })
      .update({ is_valid: false, updated_at: this.db.knex.fn.now() });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.knex('password_reset_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  }

  async findPasswordResetToken(tokenHash: string): Promise<{ id: string; user_id: string; used_at: Date | null } | null> {
    const token = await this.db.knex('password_reset_tokens')
      .where({ token_hash: tokenHash })
      .where('expires_at', '>', this.db.knex.fn.now())
      .whereNull('used_at')
      .first();
    return token || null;
  }

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await this.db.knex('password_reset_tokens')
      .where({ id: tokenId })
      .update({ used_at: this.db.knex.fn.now() });
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

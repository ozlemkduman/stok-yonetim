import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private _knex: Knex;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this._knex = knex({
      client: 'pg',
      connection: this.configService.get<string>('database.url'),
      pool: {
        min: this.configService.get<number>('database.pool.min', 2),
        max: this.configService.get<number>('database.pool.max', 10),
      },
    });

    // Test connection
    try {
      await this._knex.raw('SELECT 1');
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }

    // Auto-run migrations
    try {
      const migrationsDir = path.resolve(__dirname, 'migrations');
      const [batch, migrations] = await this._knex.migrate.latest({
        directory: migrationsDir,
      });
      if (migrations.length > 0) {
        this.logger.log(`Ran ${migrations.length} migrations (batch ${batch})`);
      } else {
        this.logger.log('Database schema is up to date');
      }
    } catch (error) {
      this.logger.error('Migration failed', error);
    }

    // Auto-seed plans and super admin
    await this.ensurePlansAndAdmin();
  }

  private async ensurePlansAndAdmin() {
    try {
      // Ensure plans exist
      const planCount = await this._knex('plans').count('* as count').first();
      if (Number(planCount?.count) === 0) {
        await this._knex('plans').insert([
          { name: 'Basic', code: 'basic', price: 199, billing_period: 'monthly', features: JSON.stringify({ sales: true, returns: true }), limits: JSON.stringify({ maxUsers: 1, maxProducts: 200 }), is_active: true, sort_order: 1 },
          { name: 'Pro', code: 'pro', price: 449, billing_period: 'monthly', features: JSON.stringify({ sales: true, returns: true, quotes: true, eDocuments: true, warehouses: true, integrations: true, invoiceImport: true, advancedReports: true, multiWarehouse: true }), limits: JSON.stringify({ maxUsers: 5, maxProducts: 5000 }), is_active: true, sort_order: 2 },
          { name: 'Plus', code: 'plus', price: 799, billing_period: 'monthly', features: JSON.stringify({ sales: true, returns: true, quotes: true, eDocuments: true, warehouses: true, integrations: true, crm: true, fieldTeam: true, invoiceImport: true, advancedReports: true, multiWarehouse: true, apiAccess: true }), limits: JSON.stringify({ maxUsers: -1, maxProducts: -1 }), is_active: true, sort_order: 3 },
        ]);
        this.logger.log('Plans seeded');
      }

      // Ensure super admin exists
      const adminExists = await this._knex('users').where({ role: 'super_admin' }).first();
      if (!adminExists) {
        const email = process.env.SUPER_ADMIN_EMAIL || 'admin@stoksayac.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'StokSayac2026!';
        const passwordHash = await bcrypt.hash(password, 12);
        await this._knex('users').insert({
          email,
          password_hash: passwordHash,
          name: 'Platform Admin',
          role: 'super_admin',
          permissions: JSON.stringify(['*']),
          status: 'active',
          email_verified_at: this._knex.fn.now(),
        });
        this.logger.log('Super admin created');
      }
    } catch (error) {
      this.logger.error('Seed failed', error);
    }
  }

  async onModuleDestroy() {
    if (this._knex) {
      await this._knex.destroy();
    }
  }

  get knex(): Knex {
    return this._knex;
  }

  // Utility method for transactions
  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    return this._knex.transaction(callback);
  }
}

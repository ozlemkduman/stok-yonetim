import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

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

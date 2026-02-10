import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://stok_user:stok_pass@localhost:5432/stok_db',
  pool: {
    min: 2,
    max: 10,
  },
}));

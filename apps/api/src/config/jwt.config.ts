import { registerAs } from '@nestjs/config';

const DEFAULT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const DEFAULT_REFRESH_SECRET = 'your-refresh-secret-change-in-production';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || secret === DEFAULT_SECRET) {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    if (!process.env.JWT_REFRESH_SECRET || refreshSecret === DEFAULT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET must be set in production environment');
    }
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
});

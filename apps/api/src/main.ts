import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error.stack);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Security headers
  app.use(helmet());

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigin = configService.get<string>('app.corsOrigin');
  if (isProduction && (!corsOrigin || corsOrigin === '*')) {
    logger.error('CORS_ORIGIN must be set to specific domain(s) in production. Wildcard (*) is not allowed.');
    process.exit(1);
  }
  let origin: boolean | string | string[];
  if (corsOrigin === '*') {
    origin = true;
  } else if (corsOrigin && corsOrigin.includes(',')) {
    origin = corsOrigin.split(',').map((o) => o.trim());
  } else {
    origin = corsOrigin || true;
  }
  app.enableCors({
    origin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port', 3001);
  await app.listen(port);

  logger.log(`Application running on port ${port} with prefix /${apiPrefix}`);
}

bootstrap();

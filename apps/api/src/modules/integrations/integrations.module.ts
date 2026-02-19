import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationsRepository } from './integrations.repository';
import { DatabaseModule } from '../../database/database.module';
import { TenantSettingsModule } from '../tenant-settings/tenant-settings.module';

@Module({
  imports: [DatabaseModule, TenantSettingsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IntegrationsRepository],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

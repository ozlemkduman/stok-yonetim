import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { TenantSettingsModule } from '../tenant-settings/tenant-settings.module';

@Module({
  imports: [TenantSettingsModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService, CustomersRepository],
})
export class CustomersModule {}

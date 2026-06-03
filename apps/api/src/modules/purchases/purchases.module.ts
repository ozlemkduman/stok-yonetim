import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { PurchasesRepository } from './purchases.repository';
import { DatabaseModule } from '../../database/database.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  imports: [DatabaseModule, SuppliersModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchasesRepository, ActivityLogService],
  exports: [PurchasesService, PurchasesRepository],
})
export class PurchasesModule {}

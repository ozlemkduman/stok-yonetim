import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { VehiclesController } from './vehicles/vehicles.controller';
import { VehiclesService } from './vehicles/vehicles.service';
import { VehiclesRepository } from './vehicles/vehicles.repository';
import { ServiceOrdersController } from './service-orders/service-orders.controller';
import { ServiceOrdersService } from './service-orders/service-orders.service';
import { ServiceOrdersRepository } from './service-orders/service-orders.repository';

/**
 * Oto Servis modülü (Faz 1) — araç kartı + iş emri.
 * Controller'lar @RequireSector('auto_service') ile korunur; yalnızca
 * business_type='auto_service' tenant'lar (ve super_admin) erişebilir.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [VehiclesController, ServiceOrdersController],
  providers: [
    VehiclesService,
    VehiclesRepository,
    ServiceOrdersService,
    ServiceOrdersRepository,
    ActivityLogService,
  ],
  exports: [VehiclesService, ServiceOrdersService],
})
export class AutoServiceModule {}

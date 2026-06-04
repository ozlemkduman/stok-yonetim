import { Module } from '@nestjs/common';
import { OpeningStockController } from './opening-stock.controller';
import { OpeningStockService } from './opening-stock.service';
import { OpeningStockRepository } from './opening-stock.repository';
import { DatabaseModule } from '../../database/database.module';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OpeningStockController],
  providers: [OpeningStockService, OpeningStockRepository, ActivityLogService],
  exports: [OpeningStockService],
})
export class OpeningStockModule {}

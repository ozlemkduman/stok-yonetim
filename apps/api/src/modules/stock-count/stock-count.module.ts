import { Module } from '@nestjs/common';
import { StockCountController } from './stock-count.controller';
import { StockCountService } from './stock-count.service';
import { StockCountRepository } from './stock-count.repository';
import { DatabaseModule } from '../../database/database.module';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StockCountController],
  providers: [StockCountService, StockCountRepository, ActivityLogService],
  exports: [StockCountService],
})
export class StockCountModule {}

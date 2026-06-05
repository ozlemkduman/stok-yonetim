import { Module } from '@nestjs/common';
import { ChequesController } from './cheques.controller';
import { ChequesService } from './cheques.service';
import { ChequesRepository } from './cheques.repository';
import { DatabaseModule } from '../../database/database.module';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ChequesController],
  providers: [ChequesService, ChequesRepository, ActivityLogService],
  exports: [ChequesService],
})
export class ChequesModule {}

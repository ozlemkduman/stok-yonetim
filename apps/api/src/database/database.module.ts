import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ActivityLogService } from '../common/services/activity-log.service';

@Global()
@Module({
  providers: [DatabaseService, ActivityLogService],
  exports: [DatabaseService, ActivityLogService],
})
export class DatabaseModule {}

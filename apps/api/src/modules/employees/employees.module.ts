import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { DatabaseModule } from '../../database/database.module';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesRepository, ActivityLogService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

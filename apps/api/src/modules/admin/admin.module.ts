import { Module } from '@nestjs/common';
import { AdminTenantsController } from './controllers/admin-tenants.controller';
import { AdminPlansController } from './controllers/admin-plans.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminLogsController } from './controllers/admin-logs.controller';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminPlansService } from './services/admin-plans.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminLogsService } from './services/admin-logs.service';
import { TenantsRepository } from './repositories/tenants.repository';
import { PlansRepository } from './repositories/plans.repository';
import { AdminUsersRepository } from './repositories/admin-users.repository';

@Module({
  controllers: [
    AdminTenantsController,
    AdminPlansController,
    AdminUsersController,
    AdminDashboardController,
    AdminLogsController,
  ],
  providers: [
    AdminTenantsService,
    AdminPlansService,
    AdminUsersService,
    AdminDashboardService,
    AdminLogsService,
    TenantsRepository,
    PlansRepository,
    AdminUsersRepository,
  ],
  exports: [
    AdminTenantsService,
    AdminPlansService,
    AdminUsersService,
    AdminLogsService,
  ],
})
export class AdminModule {}

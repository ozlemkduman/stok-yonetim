import { Module } from '@nestjs/common';
import { AdminTenantsController } from './controllers/admin-tenants.controller';
import { AdminPlansController } from './controllers/admin-plans.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminLogsController } from './controllers/admin-logs.controller';
import { AdminInvitationsController } from './controllers/admin-invitations.controller';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminPlansService } from './services/admin-plans.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminLogsService } from './services/admin-logs.service';
import { InvitationsService } from './services/invitations.service';
import { TenantsRepository } from './repositories/tenants.repository';
import { PlansRepository } from './repositories/plans.repository';
import { AdminUsersRepository } from './repositories/admin-users.repository';
import { InvitationsRepository } from './repositories/invitations.repository';
import { EmailService } from '../../common/services/email.service';

@Module({
  controllers: [
    AdminTenantsController,
    AdminPlansController,
    AdminUsersController,
    AdminDashboardController,
    AdminLogsController,
    AdminInvitationsController,
  ],
  providers: [
    AdminTenantsService,
    AdminPlansService,
    AdminUsersService,
    AdminDashboardService,
    AdminLogsService,
    InvitationsService,
    TenantsRepository,
    PlansRepository,
    AdminUsersRepository,
    InvitationsRepository,
    EmailService,
  ],
  exports: [
    AdminTenantsService,
    AdminPlansService,
    AdminUsersService,
    AdminLogsService,
    InvitationsService,
  ],
})
export class AdminModule {}

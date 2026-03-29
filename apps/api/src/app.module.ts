import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { appConfig, databaseConfig, jwtConfig } from './config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { TenantSettingsModule } from './modules/tenant-settings/tenant-settings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { EDocumentsModule } from './modules/e-documents/e-documents.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CrmModule } from './modules/crm/crm.module';
import { FieldTeamModule } from './modules/field-team/field-team.module';
import { InvoiceImportModule } from './modules/invoice-import/invoice-import.module';
import { ContactModule } from './modules/contact/contact.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    AdminModule,
    UsersModule,
    TenantSettingsModule,
    CustomersModule,
    ProductsModule,
    SalesModule,
    ReturnsModule,
    PaymentsModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
    AccountsModule,
    WarehousesModule,
    QuotesModule,
    EDocumentsModule,
    IntegrationsModule,
    CrmModule,
    FieldTeamModule,
    InvoiceImportModule,
    ContactModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}

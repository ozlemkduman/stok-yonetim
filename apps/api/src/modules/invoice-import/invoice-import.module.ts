import { Module } from '@nestjs/common';
import { InvoiceImportController } from './invoice-import.controller';
import { InvoiceImportService } from './invoice-import.service';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [CustomersModule, ProductsModule, SalesModule],
  controllers: [InvoiceImportController],
  providers: [InvoiceImportService],
})
export class InvoiceImportModule {}

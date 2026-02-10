import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [ProductsModule, CustomersModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService, SalesRepository],
})
export class SalesModule {}

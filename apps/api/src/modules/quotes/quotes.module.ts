import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuotesRepository } from './quotes.repository';
import { SalesModule } from '../sales/sales.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, SalesModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuotesRepository],
  exports: [QuotesService, QuotesRepository],
})
export class QuotesModule {}

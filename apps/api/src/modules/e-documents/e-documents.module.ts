import { Module } from '@nestjs/common';
import { EDocumentsController } from './e-documents.controller';
import { EDocumentsService } from './e-documents.service';
import { EDocumentsRepository } from './e-documents.repository';
import { GibMockService } from './gib-mock.service';
import { SalesModule } from '../sales/sales.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, SalesModule],
  controllers: [EDocumentsController],
  providers: [EDocumentsService, EDocumentsRepository, GibMockService],
  exports: [EDocumentsService, EDocumentsRepository],
})
export class EDocumentsModule {}

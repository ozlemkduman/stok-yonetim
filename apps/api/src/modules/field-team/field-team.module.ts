import { Module } from '@nestjs/common';
import { FieldTeamController } from './field-team.controller';
import { FieldTeamService } from './field-team.service';
import { FieldTeamRepository } from './field-team.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FieldTeamController],
  providers: [FieldTeamService, FieldTeamRepository],
  exports: [FieldTeamService],
})
export class FieldTeamModule {}

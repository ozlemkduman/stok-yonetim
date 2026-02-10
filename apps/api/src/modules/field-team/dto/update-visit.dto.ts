import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';

export class UpdateVisitDto {
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'skipped', 'rescheduled'])
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsDateString()
  check_in_time?: string;

  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

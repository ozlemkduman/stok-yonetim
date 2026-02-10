import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsUUID()
  contact_id: string;

  @IsEnum(['call', 'email', 'meeting', 'note', 'task'])
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['planned', 'completed', 'cancelled'])
  status?: 'planned' | 'completed' | 'cancelled';

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsObject()
  outcome?: Record<string, unknown>;
}

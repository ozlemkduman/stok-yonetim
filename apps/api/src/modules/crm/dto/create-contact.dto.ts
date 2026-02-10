import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsDateString, IsObject } from 'class-validator';

export class CreateContactDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEnum(['lead', 'prospect', 'customer', 'inactive'])
  status?: 'lead' | 'prospect' | 'customer' | 'inactive';

  @IsOptional()
  @IsEnum(['website', 'referral', 'social', 'cold_call', 'event', 'other'])
  source?: 'website' | 'referral' | 'social' | 'cold_call' | 'event' | 'other';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsDateString()
  next_follow_up?: string;
}

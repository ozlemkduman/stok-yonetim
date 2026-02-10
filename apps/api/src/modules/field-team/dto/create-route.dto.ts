import { IsString, IsOptional, IsDateString, IsUUID, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VisitInput {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @IsString()
  visit_type: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  scheduled_time?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsDateString()
  route_date: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  estimated_duration_minutes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisitInput)
  visits?: VisitInput[];
}
